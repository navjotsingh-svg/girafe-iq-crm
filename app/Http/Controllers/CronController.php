<?php

namespace App\Http\Controllers;

use App\Services\Cron\CronService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CronController extends Controller
{
    public function run(Request $request, CronService $cron, ?string $job = null): JsonResponse
    {

        $only = null;

        if ($job) {
            if (! in_array($job, CronService::JOBS, true)) {
                return response()->json([
                    'ok' => false,
                    'error' => 'Unknown job.',
                    'available' => CronService::JOBS,
                ], 404);
            }
            $only = [$job];
        } elseif ($request->filled('job')) {
            $requested = array_values(array_filter(array_map(
                'trim',
                explode(',', (string) $request->query('job'))
            )));
            $only = array_values(array_intersect(CronService::JOBS, $requested));
            if ($only === []) {
                return response()->json([
                    'ok' => false,
                    'error' => 'No valid jobs in ?job=.',
                    'available' => CronService::JOBS,
                ], 422);
            }
        }

        return response()->json($cron->run($only));
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'jobs' => CronService::JOBS,
            'endpoints' => [
                'all' => url('/cron/run'),
                'one' => url('/cron/run/{job}'),
                'filter' => url('/cron/run').'?job=messages,campaigns',
            ],
        ]);
    }
}
