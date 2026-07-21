<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\CustomFieldDefinition;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Services\Crm\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;
        $tab = $request->get('tab', 'company');

        $pipeline = Pipeline::query()
            ->where('company_id', $company->id)
            ->where('is_default', true)
            ->with(['stages' => fn ($q) => $q->orderBy('sort_order')])
            ->first()
            ?? Pipeline::query()
                ->where('company_id', $company->id)
                ->with(['stages' => fn ($q) => $q->orderBy('sort_order')])
                ->first();

        $industries = collect(config('industries.onboarding', []))
            ->map(fn ($key) => [
                'key' => $key,
                'name' => config("industries.profiles.{$key}.name", $key),
            ])
            ->values();

        return Inertia::render('Settings/Index', [
            'tab' => $tab,
            'company' => [
                'name' => $company->name,
                'email' => $company->email,
                'phone' => $company->phone,
                'country' => $company->country,
                'timezone' => $company->timezone,
                'currency' => $company->currency,
                'industry_key' => $company->industry_key,
            ],
            'industries' => $industries,
            'leadFields' => CustomFieldDefinition::query()
                ->where('entity', 'lead')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (CustomFieldDefinition $f) => [
                    'id' => $f->id,
                    'name' => $f->name,
                    'key' => $f->key,
                    'type' => $f->type,
                    'options' => $f->options,
                    'is_required' => $f->is_required,
                    'is_system' => $f->is_system,
                    'show_in_list' => $f->show_in_list,
                ]),
            'pipeline' => $pipeline ? [
                'id' => $pipeline->id,
                'name' => $pipeline->name,
                'stages' => $pipeline->stages->map(fn (PipelineStage $s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'color' => $s->color,
                    'probability' => $s->probability,
                    'sort_order' => $s->sort_order,
                    'is_won' => $s->is_won,
                    'is_lost' => $s->is_lost,
                    'deals_count' => $s->deals()->count(),
                ]),
            ] : null,
            'timezones' => [
                'Asia/Kolkata',
                'Asia/Dubai',
                'UTC',
                'America/New_York',
                'Europe/London',
            ],
            'currencies' => ['INR', 'USD', 'EUR', 'AED', 'GBP'],
            'providers' => [
                'email' => [
                    'driver' => $company->settings['providers']['email']['driver'] ?? 'log',
                    'host' => $company->settings['providers']['email']['host'] ?? '',
                    'port' => $company->settings['providers']['email']['port'] ?? 587,
                    'username' => $company->settings['providers']['email']['username'] ?? '',
                    'encryption' => $company->settings['providers']['email']['encryption'] ?? 'tls',
                    'from_address' => $company->settings['providers']['email']['from_address'] ?? '',
                    'from_name' => $company->settings['providers']['email']['from_name'] ?? $company->name,
                    'has_password' => ! empty($company->settings['providers']['email']['password']),
                ],
                'whatsapp' => [
                    'driver' => $company->settings['providers']['whatsapp']['driver'] ?? 'log',
                    'phone_number_id' => $company->settings['providers']['whatsapp']['phone_number_id'] ?? '',
                    'has_token' => ! empty($company->settings['providers']['whatsapp']['api_token']),
                ],
            ],
            'integrations' => app(SettingsService::class)->integrationsForUi($company),
        ]);
    }

    public function updateCompany(Request $request, SettingsService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'country' => 'nullable|string|max:100',
            'timezone' => 'nullable|string|max:50',
            'currency' => 'nullable|string|max:3',
            'industry_key' => 'nullable|string|max:50',
        ]);

        $service->updateCompany($request->user()->company, $data);

        return redirect()->route('settings.index', ['tab' => 'company'])
            ->with('success', 'Company settings saved.');
    }

    public function updateProviders(Request $request, SettingsService $service): RedirectResponse
    {
        $data = $request->validate([
            'email_driver' => 'required|in:log,smtp',
            'email_host' => 'nullable|string|max:255',
            'email_port' => 'nullable|integer|min:1|max:65535',
            'email_username' => 'nullable|string|max:255',
            'email_password' => 'nullable|string|max:255',
            'email_encryption' => 'nullable|in:tls,ssl,',
            'email_from_address' => 'nullable|email|max:255',
            'email_from_name' => 'nullable|string|max:255',
            'whatsapp_driver' => 'required|in:log,meta',
            'whatsapp_api_token' => 'nullable|string|max:500',
            'whatsapp_phone_number_id' => 'nullable|string|max:100',
        ]);

        $service->updateProviders($request->user()->company, $data);

        return redirect()->route('settings.index', ['tab' => 'providers'])
            ->with('success', 'Provider settings saved.');
    }

    public function updateIntegration(Request $request, SettingsService $service): RedirectResponse
    {
        $platforms = array_keys(config('integrations.platforms', []));

        $data = $request->validate([
            'platform' => ['required', Rule::in($platforms)],
            'enabled' => 'nullable|boolean',
            'access_token' => 'nullable|string|max:2000',
            'verify_token' => 'nullable|string|max:255',
            'regenerate_secret' => 'nullable|boolean',
        ]);

        $service->updateIntegration($request->user()->company, $data);

        return redirect()->route('settings.index', ['tab' => 'integrations'])
            ->with('success', 'Integration saved.');
    }

    public function storeLeadField(Request $request, SettingsService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'key' => 'nullable|string|max:100|alpha_dash',
            'type' => ['required', Rule::in(['text', 'number', 'select', 'textarea', 'date', 'boolean', 'phone', 'email'])],
            'options' => 'nullable|string|max:2000',
            'is_required' => 'nullable|boolean',
            'show_in_list' => 'nullable|boolean',
        ]);

        $service->createLeadField($request->user()->company, $data);

        return redirect()->route('settings.index', ['tab' => 'fields'])
            ->with('success', 'Lead field added.');
    }

    public function destroyLeadField(CustomFieldDefinition $field, Request $request, SettingsService $service): RedirectResponse
    {
        if ($field->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $service->deleteLeadField($field);

        return redirect()->route('settings.index', ['tab' => 'fields'])
            ->with('success', 'Lead field removed.');
    }

    public function storePipelineStage(Request $request, SettingsService $service): RedirectResponse
    {
        $data = $request->validate([
            'pipeline_id' => 'required|exists:pipelines,id',
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
            'probability' => 'nullable|integer|min:0|max:100',
            'is_won' => 'nullable|boolean',
            'is_lost' => 'nullable|boolean',
        ]);

        $pipeline = Pipeline::query()->findOrFail($data['pipeline_id']);
        if ($pipeline->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $service->createPipelineStage($request->user()->company, $pipeline, $data);

        return redirect()->route('settings.index', ['tab' => 'pipeline'])
            ->with('success', 'Pipeline stage added.');
    }

    public function updatePipelineStage(PipelineStage $stage, Request $request, SettingsService $service): RedirectResponse
    {
        if ($stage->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:20',
            'probability' => 'nullable|integer|min:0|max:100',
            'is_won' => 'nullable|boolean',
            'is_lost' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $service->updatePipelineStage($stage, $data);

        return redirect()->route('settings.index', ['tab' => 'pipeline'])
            ->with('success', 'Stage updated.');
    }

    public function destroyPipelineStage(PipelineStage $stage, Request $request, SettingsService $service): RedirectResponse
    {
        if ($stage->company_id !== $request->user()->company_id) {
            abort(403);
        }

        try {
            $service->deletePipelineStage($stage);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return redirect()->route('settings.index', ['tab' => 'pipeline'])
                ->with('error', $e->getMessage());
        }

        return redirect()->route('settings.index', ['tab' => 'pipeline'])
            ->with('success', 'Stage removed.');
    }
}
