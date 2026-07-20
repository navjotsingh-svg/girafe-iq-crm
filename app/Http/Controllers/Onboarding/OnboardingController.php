<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Services\Onboarding\OnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $company = $request->user()->company;

        if (! $company) {
            abort(403, 'No company workspace found.');
        }

        if ($company->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        $onboardingKeys = config('industries.onboarding', array_keys(config('industries.profiles', [])));

        $industries = collect($onboardingKeys)->map(function (string $key) {
            $p = config("industries.profiles.{$key}", []);

            return [
                'key' => $key,
                'name' => $p['name'] ?? $key,
                'tagline' => $p['tagline'] ?? '',
                'icon' => $p['icon'] ?? 'briefcase',
            ];
        })->values();

        return Inertia::render('Onboarding/Wizard', [
            'step' => (int) $company->onboarding_step,
            'company' => [
                'name' => $company->name,
                'industry_key' => $company->industry_key,
                'team_size' => $company->team_size,
                'selected_sources' => $company->settings['selected_sources'] ?? [],
                'setup_checklist' => $company->settings['setup_checklist'] ?? [],
                'import_path' => $company->settings['import_path'] ?? null,
            ],
            'industries' => $industries,
            'sources' => collect(config('industry_packs.source_catalog'))->map(fn ($name, $slug) => [
                'slug' => $slug,
                'name' => $name,
            ])->values(),
            'teamSizes' => [
                ['value' => 'just_me', 'label' => 'Just me'],
                ['value' => '2-5', 'label' => '2–5 people'],
                ['value' => '6-20', 'label' => '6–20 people'],
                ['value' => '20+', 'label' => '20+ people'],
            ],
            'importOptions' => [
                ['value' => 'add_enquiry', 'label' => 'Add First Enquiry', 'hint' => 'Capture a walk-in or phone lead now'],
                ['value' => 'import_leads', 'label' => 'Import Leads', 'hint' => 'Upload Excel / CSV (coming soon)'],
                ['value' => 'connect_source', 'label' => 'Connect Source', 'hint' => 'Ads, website, WhatsApp later'],
                ['value' => 'sample_data', 'label' => 'Explore Sample Data', 'hint' => 'See how Girafe IQ looks with demo leads'],
                ['value' => 'skip', 'label' => 'Skip for now', 'hint' => 'Go straight to your ready dashboard'],
            ],
            'summary' => $this->summary($company),
            'autoSetupItems' => [
                'Pipeline',
                'Lead Fields',
                'Follow-up Types',
                'Dashboard',
                'Reports',
                'Team Roles',
            ],
        ]);
    }

    public function saveIndustry(Request $request, OnboardingService $onboarding): RedirectResponse
    {
        $company = $request->user()->company;
        $allowed = config('industries.onboarding', array_keys(config('industries.profiles', [])));

        $data = $request->validate([
            'industry_key' => ['required', 'string', Rule::in($allowed)],
        ]);

        $onboarding->saveIndustry($company, $data['industry_key']);

        return back();
    }

    public function saveTeamSize(Request $request, OnboardingService $onboarding): RedirectResponse
    {
        $company = $request->user()->company;
        $data = $request->validate([
            'team_size' => ['required', 'string', Rule::in(['just_me', '2-5', '6-20', '20+'])],
        ]);

        $onboarding->saveTeamSize($company, $data['team_size']);

        return back();
    }

    public function saveSources(Request $request, OnboardingService $onboarding): RedirectResponse
    {
        $company = $request->user()->company;
        $catalog = array_keys(config('industry_packs.source_catalog', []));

        $data = $request->validate([
            'sources' => ['required', 'array', 'min:1'],
            'sources.*' => ['string', Rule::in($catalog)],
        ]);

        $onboarding->saveSources($company, $data['sources']);

        return back();
    }

    public function runAutoSetup(Request $request, OnboardingService $onboarding): RedirectResponse
    {
        $onboarding->runAutoSetup($request->user()->company);

        return back();
    }

    public function chooseImport(Request $request, OnboardingService $onboarding): RedirectResponse
    {
        $data = $request->validate([
            'path' => ['required', 'string', Rule::in([
                'add_enquiry', 'import_leads', 'connect_source', 'sample_data', 'skip',
            ])],
        ]);

        $onboarding->chooseImportPath($request->user()->company, $data['path']);

        return back();
    }

    public function complete(Request $request, OnboardingService $onboarding): RedirectResponse
    {
        $company = $onboarding->complete($request->user()->company);
        $importPath = $company->settings['import_path'] ?? 'skip';

        if ($importPath === 'add_enquiry') {
            return redirect()->route('enquiries.index', ['create' => 1])
                ->with('success', 'Welcome to '.config('girafe.name').'! Add your first enquiry.');
        }

        return redirect()->route('dashboard')
            ->with('success', 'Welcome to '.config('girafe.name').'! Your workspace is ready.');
    }

    private function summary($company): array
    {
        if ($company->onboarding_step < 6) {
            return [];
        }

        return [
            'statuses' => \App\Models\LeadStatus::withoutGlobalScopes()->where('company_id', $company->id)->count(),
            'sources' => \App\Models\LeadSource::withoutGlobalScopes()->where('company_id', $company->id)->count(),
            'fields' => \App\Models\CustomFieldDefinition::withoutGlobalScopes()->where('company_id', $company->id)->count(),
            'pipeline_stages' => \App\Models\PipelineStage::withoutGlobalScopes()->where('company_id', $company->id)->count(),
            'task_types' => \App\Models\TaskType::withoutGlobalScopes()->where('company_id', $company->id)->count(),
            'widgets' => \App\Models\DashboardWidget::withoutGlobalScopes()->where('company_id', $company->id)->count(),
        ];
    }
}
