<?php

namespace App\Console\Commands;

use App\Services\Cron\CronService;
use Illuminate\Console\Command;

class RunCrmCron extends Command
{
    protected $signature = 'crm:cron
                            {--job=* : Optional job keys (messages, campaigns, invitations, trials, followups)}';

    protected $description = 'Run CRM cron jobs (messages, campaigns, invitations, trials, follow-ups)';

    public function handle(CronService $cron): int
    {
        $only = array_values(array_filter((array) $this->option('job')));

        $result = $cron->run($only === [] ? null : $only);

        $this->info('CRM cron finished at '.$result['ran_at']);

        foreach ($result['jobs'] as $name => $stats) {
            $this->line(sprintf('  [%s] %s', $name, json_encode($stats)));
        }

        return self::SUCCESS;
    }
}
