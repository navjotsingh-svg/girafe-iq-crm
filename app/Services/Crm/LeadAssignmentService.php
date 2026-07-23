<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeadAssignmentService
{
    /**
     * Pick the next assignee via weighted round-robin when enabled.
     * Returns null when disabled or no eligible users.
     */
    public function nextAssignee(Company $company): ?User
    {
        $config = $this->config($company);

        if (! $config['enabled']) {
            return null;
        }

        return DB::transaction(function () use ($company) {
            /** @var Company $locked */
            $locked = Company::query()
                ->whereKey($company->id)
                ->lockForUpdate()
                ->firstOrFail();

            $config = $this->config($locked);

            if (! $config['enabled']) {
                return null;
            }

            $pool = $this->poolUsers($locked, $config);

            if ($pool->isEmpty()) {
                return null;
            }

            $sequence = $this->buildSequence($pool, $config['weights']);

            if ($sequence === []) {
                return null;
            }

            $lastIndex = $config['last_sequence_index'];
            $nextIndex = 0;

            if ($lastIndex !== null && $lastIndex >= 0 && $lastIndex < count($sequence)) {
                $nextIndex = ($lastIndex + 1) % count($sequence);
            }

            $nextId = $sequence[$nextIndex];
            /** @var User|null $next */
            $next = $pool->firstWhere('id', $nextId);

            if (! $next) {
                return null;
            }

            $settings = $locked->settings ?? [];
            $settings['lead_assignment'] = array_merge($config, [
                'last_assigned_user_id' => $next->id,
                'last_sequence_index' => $nextIndex,
            ]);
            $locked->update(['settings' => $settings]);

            return $next;
        });
    }

    /**
     * Resolve assignee: use explicit id when provided, else round-robin, else fallback.
     */
    public function resolveAssigneeId(Company $company, ?int $explicitUserId, ?User $fallback = null): ?int
    {
        if ($explicitUserId) {
            return $explicitUserId;
        }

        $next = $this->nextAssignee($company);

        return $next?->id ?? $fallback?->id;
    }

    /**
     * @return array{
     *     enabled: bool,
     *     mode: string,
     *     user_ids: list<int>,
     *     weights: array<int, int>,
     *     last_assigned_user_id: int|null,
     *     last_sequence_index: int|null
     * }
     */
    public function config(Company $company): array
    {
        $raw = $company->settings['lead_assignment'] ?? [];

        $userIds = array_values(array_filter(array_map(
            'intval',
            is_array($raw['user_ids'] ?? null) ? $raw['user_ids'] : []
        )));

        $weights = [];
        if (is_array($raw['weights'] ?? null)) {
            foreach ($raw['weights'] as $userId => $weight) {
                $weights[(int) $userId] = max(0, min(100, (int) $weight));
            }
        }

        // Backfill weight 1 for selected users without an explicit weight
        foreach ($userIds as $id) {
            if (! array_key_exists($id, $weights)) {
                $weights[$id] = 1;
            }
        }

        return [
            'enabled' => (bool) ($raw['enabled'] ?? false),
            'mode' => ($raw['mode'] ?? 'all_active') === 'selected' ? 'selected' : 'all_active',
            'user_ids' => $userIds,
            'weights' => $weights,
            'last_assigned_user_id' => isset($raw['last_assigned_user_id'])
                ? (int) $raw['last_assigned_user_id']
                : null,
            'last_sequence_index' => isset($raw['last_sequence_index'])
                ? (int) $raw['last_sequence_index']
                : null,
        ];
    }

    /**
     * @return array{
     *     enabled: bool,
     *     mode: string,
     *     user_ids: list<int>,
     *     weights: array<int, int>,
     *     last_assigned_user_id: int|null,
     *     last_sequence_index: int|null,
     *     last_assigned_name: string|null
     * }
     */
    public function forUi(Company $company): array
    {
        $config = $this->config($company);
        $lastName = null;

        if ($config['last_assigned_user_id']) {
            $lastName = User::query()
                ->where('company_id', $company->id)
                ->where('id', $config['last_assigned_user_id'])
                ->value('name');
        }

        return [
            ...$config,
            'last_assigned_name' => $lastName,
        ];
    }

    /**
     * @param  array{
     *     enabled?: bool,
     *     mode?: string,
     *     user_ids?: list<int|string>,
     *     weights?: array<int|string, int|string>
     * }  $data
     */
    public function updateConfig(Company $company, array $data): Company
    {
        $current = $this->config($company);
        $mode = ($data['mode'] ?? $current['mode']) === 'selected' ? 'selected' : 'all_active';

        $weights = [];
        if (is_array($data['weights'] ?? null)) {
            foreach ($data['weights'] as $userId => $weight) {
                $weights[(int) $userId] = max(0, min(100, (int) $weight));
            }
        } else {
            $weights = $current['weights'];
        }

        $activeIds = User::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        // Drop weights for users who left / are inactive
        $weights = array_intersect_key($weights, array_flip($activeIds));

        if ($mode === 'selected') {
            $userIds = array_values(array_unique(array_filter(array_map(
                'intval',
                is_array($data['user_ids'] ?? null) ? $data['user_ids'] : $current['user_ids']
            ))));
            $userIds = array_values(array_intersect($userIds, $activeIds));

            // Selected users with no weight default to 1
            foreach ($userIds as $id) {
                if (! array_key_exists($id, $weights)) {
                    $weights[$id] = 1;
                }
            }
        } else {
            $userIds = [];
            foreach ($activeIds as $id) {
                if (! array_key_exists($id, $weights)) {
                    $weights[$id] = 1;
                }
            }
        }

        $settings = $company->settings ?? [];
        $settings['lead_assignment'] = [
            'enabled' => (bool) ($data['enabled'] ?? $current['enabled']),
            'mode' => $mode,
            'user_ids' => $mode === 'selected' ? $userIds : [],
            'weights' => $weights,
            'last_assigned_user_id' => $current['last_assigned_user_id'],
            'last_sequence_index' => $current['last_sequence_index'],
        ];

        $company->update(['settings' => $settings]);

        return $company->fresh();
    }

    /**
     * @param  array{enabled: bool, mode: string, user_ids: list<int>, weights: array<int, int>}  $config
     * @return Collection<int, User>
     */
    private function poolUsers(Company $company, array $config): Collection
    {
        $query = User::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->orderBy('id');

        if ($config['mode'] === 'selected') {
            if ($config['user_ids'] === []) {
                return collect();
            }
            $query->whereIn('id', $config['user_ids']);
        }

        $users = $query->get(['id', 'name', 'company_id', 'is_active']);

        // Exclude anyone with weight 0
        return $users->filter(function (User $user) use ($config) {
            $weight = (int) ($config['weights'][$user->id] ?? 1);

            return $weight > 0;
        })->values();
    }

    /**
     * Build weighted sequence, e.g. A:2 B:1 C:10 → [A,A,B,C×10].
     *
     * @param  Collection<int, User>  $pool
     * @param  array<int, int>  $weights
     * @return list<int>
     */
    private function buildSequence(Collection $pool, array $weights): array
    {
        $sequence = [];

        foreach ($pool as $user) {
            $weight = max(0, min(100, (int) ($weights[$user->id] ?? 1)));
            for ($i = 0; $i < $weight; $i++) {
                $sequence[] = (int) $user->id;
            }
        }

        return $sequence;
    }
}
