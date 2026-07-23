<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Services\Crm\DealService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PipelineController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;

        $pipeline = Pipeline::resolveForCompany($company->id);

        $stages = [];
        $totalValue = 0;
        $wonCount = 0;
        $openCount = 0;

        if ($pipeline) {
            app(\App\Services\Crm\SettingsService::class)->ensureOpenStagesBeforeClosed($pipeline);
            $boardStages = $pipeline->stagesForBoard();

            $deals = Deal::query()
                ->with(['lead:id,name,phone,temperature', 'assignee:id,name'])
                ->where('pipeline_id', $pipeline->id)
                ->get();

            foreach ($boardStages as $stage) {
                $stageDeals = $deals->where('pipeline_stage_id', $stage->id)->values();

                $stages[] = [
                    'id' => $stage->id,
                    'name' => $stage->name,
                    'color' => $stage->color,
                    'probability' => $stage->probability,
                    'is_won' => $stage->is_won,
                    'is_lost' => $stage->is_lost,
                    'deals' => $stageDeals->map(fn (Deal $d) => [
                        'id' => $d->id,
                        'title' => $d->title,
                        'value' => (float) $d->value,
                        'currency' => $d->currency,
                        'lead' => $d->lead ? [
                            'id' => $d->lead->id,
                            'name' => $d->lead->name,
                            'phone' => $d->lead->phone,
                            'temperature' => $d->lead->temperature,
                        ] : null,
                        'assignee' => $d->assignee?->name,
                        'won_at' => $d->won_at?->toIso8601String(),
                        'lost_at' => $d->lost_at?->toIso8601String(),
                    ])->all(),
                ];

                if (! $stage->is_won && ! $stage->is_lost) {
                    $totalValue += $stageDeals->sum('value');
                    $openCount += $stageDeals->count();
                }

                if ($stage->is_won) {
                    $wonCount += $stageDeals->count();
                }
            }
        }

        return Inertia::render('Pipeline/Index', [
            'pipeline' => $pipeline ? [
                'id' => $pipeline->id,
                'name' => $pipeline->name,
            ] : null,
            'stages' => $stages,
            'stats' => [
                'open_deals' => $openCount,
                'won_deals' => $wonCount,
                'pipeline_value' => $totalValue,
                'currency' => $company->currency ?? 'INR',
            ],
        ]);
    }

    public function moveStage(Deal $deal, Request $request, DealService $service): RedirectResponse
    {
        if ($deal->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $data = $request->validate([
            'pipeline_stage_id' => 'required|exists:pipeline_stages,id',
        ]);

        $stage = PipelineStage::query()->findOrFail($data['pipeline_stage_id']);

        if ($stage->pipeline_id !== $deal->pipeline_id) {
            abort(422, 'Stage must belong to the same pipeline.');
        }

        $service->moveToStage($deal, $stage);

        return back()->with('success', 'Deal moved to '.$stage->name);
    }
}
