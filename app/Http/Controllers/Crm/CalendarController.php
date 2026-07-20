<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $monthParam = $request->get('month'); // YYYY-MM
        $cursor = $monthParam
            ? Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth()
            : now()->startOfMonth();

        $start = $cursor->copy()->startOfMonth()->startOfWeek(Carbon::MONDAY);
        $end = $cursor->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);

        $followUps = FollowUp::query()
            ->with(['lead:id,name', 'taskType:id,name,color', 'assignee:id,name'])
            ->whereNotNull('due_at')
            ->whereBetween('due_at', [$start, $end])
            ->orderBy('due_at')
            ->get()
            ->map(fn (FollowUp $f) => [
                'id' => $f->id,
                'title' => $f->title,
                'status' => $f->status,
                'due_at' => $f->due_at?->toIso8601String(),
                'due_date' => $f->due_at?->toDateString(),
                'due_time' => $f->due_at?->format('H:i'),
                'lead' => $f->lead ? ['id' => $f->lead->id, 'name' => $f->lead->name] : null,
                'task_type' => $f->taskType,
                'assignee' => $f->assignee?->name,
                'is_overdue' => $f->isOverdue(),
            ])
            ->groupBy('due_date');

        $days = [];
        $day = $start->copy();
        while ($day->lte($end)) {
            $key = $day->toDateString();
            $days[] = [
                'date' => $key,
                'day' => $day->day,
                'in_month' => $day->month === $cursor->month,
                'is_today' => $day->isToday(),
                'events' => $followUps->get($key, collect())->values()->all(),
            ];
            $day->addDay();
        }

        return Inertia::render('Calendar/Index', [
            'month' => $cursor->format('Y-m'),
            'monthLabel' => $cursor->format('F Y'),
            'prevMonth' => $cursor->copy()->subMonth()->format('Y-m'),
            'nextMonth' => $cursor->copy()->addMonth()->format('Y-m'),
            'days' => $days,
            'stats' => [
                'this_month' => FollowUp::query()
                    ->whereNotNull('due_at')
                    ->whereBetween('due_at', [
                        $cursor->copy()->startOfMonth(),
                        $cursor->copy()->endOfMonth(),
                    ])
                    ->count(),
                'pending' => FollowUp::query()
                    ->where('status', FollowUp::STATUS_PENDING)
                    ->whereNotNull('due_at')
                    ->whereBetween('due_at', [
                        $cursor->copy()->startOfMonth(),
                        $cursor->copy()->endOfMonth(),
                    ])
                    ->count(),
            ],
        ]);
    }
}
