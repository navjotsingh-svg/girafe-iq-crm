<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\Onboarding\IndustryPackService;
use Illuminate\Console\Command;

class SyncTenantRoles extends Command
{
    protected $signature = 'crm:sync-roles {--company= : Optional company id} {--force : Reset roles to default permissions}';

    protected $description = 'Resync tenant role permissions (locks staff out of team/reports/whatsapp/automation)';

    public function handle(IndustryPackService $packs): int
    {
        $query = Company::query();
        if ($this->option('company')) {
            $query->whereKey((int) $this->option('company'));
        }

        $force = (bool) $this->option('force');

        $count = 0;
        $query->each(function (Company $company) use ($packs, &$count, $force) {
            $packs->syncTenantRoles($company, $force);
            $count++;
            $this->line("Synced roles for company #{$company->id} ({$company->name})".($force ? ' [defaults reset]' : ''));
        });

        $this->info("Done. Synced {$count} company(ies).");

        return self::SUCCESS;
    }
}
