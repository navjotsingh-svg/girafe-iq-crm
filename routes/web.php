<?php

use App\Http\Controllers\Crm\AccountController;
use App\Http\Controllers\Crm\AutomationController;
use App\Http\Controllers\Crm\CalendarController;
use App\Http\Controllers\Crm\CampaignController;
use App\Http\Controllers\Crm\ContactController;
use App\Http\Controllers\Crm\CustomerController;
use App\Http\Controllers\Crm\DashboardController;
use App\Http\Controllers\Crm\DocumentController;
use App\Http\Controllers\Crm\EmailController;
use App\Http\Controllers\Crm\EnquiryController;
use App\Http\Controllers\Crm\FollowUpController;
use App\Http\Controllers\Crm\LeadController;
use App\Http\Controllers\Crm\PipelineController;
use App\Http\Controllers\Crm\ReportController;
use App\Http\Controllers\Crm\SettingsController;
use App\Http\Controllers\Crm\TeamController;
use App\Http\Controllers\Crm\WhatsAppController;
use App\Http\Controllers\Onboarding\OnboardingController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        $company = auth()->user()->company;
        if ($company && ! $company->onboarding_completed) {
            return redirect()->route('onboarding.show');
        }

        return redirect()->route('dashboard');
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'appName' => config('girafe.name'),
        'tagline' => config('girafe.tagline'),
    ]);
});

Route::redirect('/signup', '/register');

Route::middleware(['auth', 'verified', 'tenant'])->group(function () {
    Route::prefix('onboarding')->name('onboarding.')->group(function () {
        Route::get('/', [OnboardingController::class, 'show'])->name('show');
        Route::post('/industry', [OnboardingController::class, 'saveIndustry'])->name('industry');
        Route::post('/team-size', [OnboardingController::class, 'saveTeamSize'])->name('team-size');
        Route::post('/sources', [OnboardingController::class, 'saveSources'])->name('sources');
        Route::post('/auto-setup', [OnboardingController::class, 'runAutoSetup'])->name('auto-setup');
        Route::post('/import', [OnboardingController::class, 'chooseImport'])->name('import');
        Route::post('/complete', [OnboardingController::class, 'complete'])->name('complete');
    });

    Route::middleware('onboarding.completed')->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        Route::get('/enquiries', [EnquiryController::class, 'index'])->name('enquiries.index');
        Route::post('/enquiries', [EnquiryController::class, 'store'])->name('enquiries.store');
        Route::post('/enquiries/{enquiry}/convert', [EnquiryController::class, 'convert'])->name('enquiries.convert');

        Route::get('/leads', [LeadController::class, 'index'])->name('leads.index');
        Route::get('/leads/{lead}', [LeadController::class, 'show'])->name('leads.show');
        Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');
        Route::patch('/leads/{lead}', [LeadController::class, 'update'])->name('leads.update');

        Route::get('/pipeline', [PipelineController::class, 'index'])->name('pipeline.index');
        Route::patch('/deals/{deal}/stage', [PipelineController::class, 'moveStage'])->name('deals.move-stage');

        Route::get('/tasks', [FollowUpController::class, 'index'])->name('tasks.index');
        Route::post('/tasks', [FollowUpController::class, 'store'])->name('tasks.store');
        Route::post('/tasks/{followUp}/complete', [FollowUpController::class, 'complete'])->name('tasks.complete');

        Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
        Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::patch('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');

        Route::get('/team', [TeamController::class, 'index'])->name('team.index');
        Route::post('/team', [TeamController::class, 'store'])->name('team.store');
        Route::patch('/team/{member}/role', [TeamController::class, 'updateRole'])->name('team.update-role');
        Route::post('/team/{member}/toggle-active', [TeamController::class, 'toggleActive'])->name('team.toggle-active');

        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::patch('/settings/company', [SettingsController::class, 'updateCompany'])->name('settings.company');
        Route::patch('/settings/providers', [SettingsController::class, 'updateProviders'])->name('settings.providers');
        Route::post('/settings/fields', [SettingsController::class, 'storeLeadField'])->name('settings.fields.store');
        Route::delete('/settings/fields/{field}', [SettingsController::class, 'destroyLeadField'])->name('settings.fields.destroy');
        Route::post('/settings/stages', [SettingsController::class, 'storePipelineStage'])->name('settings.stages.store');
        Route::patch('/settings/stages/{stage}', [SettingsController::class, 'updatePipelineStage'])->name('settings.stages.update');
        Route::delete('/settings/stages/{stage}', [SettingsController::class, 'destroyPipelineStage'])->name('settings.stages.destroy');

        Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
        Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
        Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
        Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

        Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');

        Route::get('/automation', [AutomationController::class, 'index'])->name('automation.index');
        Route::post('/automation', [AutomationController::class, 'store'])->name('automation.store');
        Route::post('/automation/{rule}/toggle', [AutomationController::class, 'toggle'])->name('automation.toggle');
        Route::delete('/automation/{rule}', [AutomationController::class, 'destroy'])->name('automation.destroy');

        Route::get('/whatsapp', [WhatsAppController::class, 'index'])->name('whatsapp.index');
        Route::post('/whatsapp/templates', [WhatsAppController::class, 'storeTemplate'])->name('whatsapp.templates.store');
        Route::post('/whatsapp/send', [WhatsAppController::class, 'send'])->name('whatsapp.send');
        Route::delete('/whatsapp/templates/{template}', [WhatsAppController::class, 'destroyTemplate'])->name('whatsapp.templates.destroy');

        Route::get('/email', [EmailController::class, 'index'])->name('email.index');
        Route::post('/email/templates', [EmailController::class, 'storeTemplate'])->name('email.templates.store');
        Route::post('/email/send', [EmailController::class, 'send'])->name('email.send');
        Route::delete('/email/templates/{template}', [EmailController::class, 'destroyTemplate'])->name('email.templates.destroy');

        Route::get('/campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
        Route::post('/campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
        Route::post('/campaigns/{campaign}/launch', [CampaignController::class, 'launch'])->name('campaigns.launch');

        Route::get('/companies', [AccountController::class, 'index'])->name('companies.index');
        Route::get('/companies/sample.csv', [AccountController::class, 'sampleCsv'])->name('companies.sample');
        Route::post('/companies/import', [AccountController::class, 'import'])->name('companies.import');
        Route::post('/companies', [AccountController::class, 'store'])->name('companies.store');
        Route::get('/companies/{account}', [AccountController::class, 'show'])->name('companies.show');
        Route::patch('/companies/{account}', [AccountController::class, 'update'])->name('companies.update');

        Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
        Route::get('/contacts/sample.csv', [ContactController::class, 'sampleCsv'])->name('contacts.sample');
        Route::post('/contacts/import', [ContactController::class, 'import'])->name('contacts.import');
        Route::post('/contacts', [ContactController::class, 'store'])->name('contacts.store');
        Route::patch('/contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
