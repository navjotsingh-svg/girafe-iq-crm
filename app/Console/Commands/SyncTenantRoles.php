<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\Onboarding\IndustryPackService;
use Illuminate\Console\Command;

class SyncTenantRoles extends Command
{
    protected $signature = 'crm:sync-roles {--company= : Optional company id}';

    protected $description = 'Resync tenant role permissions (locks staff out of team/reports/whatsapp/automation)';

    public function handle(IndustryPackService $packs): int
    {
        $query = Company::query();
        if ($this->option('company')) {
            $query->whereKey((int) $this->option('company'));
        }

        $count = 0;
        $query->each(function (Company $company) use ($packs, &$count) {
            $packs->syncTenantRoles($company);
            $count++;
            $this->line("Synced roles for company #{$company->id} ({$company->name})");
        });

        $this->info("Done. Synced {$count} company(ies).");

        return self::SUCCESS;
    }
}
