import CrmLayout from '@/Layouts/CrmLayout';
import { Head, Link } from '@inertiajs/react';

type CalendarEvent = {
    id: number;
    title: string;
    status: string;
    due_at: string | null;
    due_date: string;
    due_time: string | null;
    lead: { id: number; name: string } | null;
    task_type: { id: number; name: string; color: string } | null;
    assignee: string | null;
    is_overdue: boolean;
};

type DayCell = {
    date: string;
    day: number;
    in_month: boolean;
    is_today: boolean;
    events: CalendarEvent[];
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarIndex({
    month,
    monthLabel,
    prevMonth,
    nextMonth,
    days,
    stats,
}: {
    month: string;
    monthLabel: string;
    prevMonth: string;
    nextMonth: string;
    days: DayCell[];
    stats: { this_month: number; pending: number };
}) {
    return (
        <CrmLayout title="Calendar">
            <Head title="Calendar" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">Calendar</h2>
                    <p className="text-sm text-slate-500">
                        Follow-ups & tasks by due date
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('calendar.index', { month: prevMonth })}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
                    >
                        ← Prev
                    </Link>
                    <span className="min-w-[140px] text-center text-sm font-semibold">
                        {monthLabel}
                    </span>
                    <Link
                        href={route('calendar.index', { month: nextMonth })}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
                    >
                        Next →
                    </Link>
                    <Link
                        href={route('tasks.index')}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        + Schedule
                    </Link>
                </div>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs text-slate-500">Events this month</div>
                    <div className="text-2xl font-bold">{stats.this_month}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs text-slate-500">Pending</div>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
                    {WEEKDAYS.map((d) => (
                        <div
                            key={d}
                            className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50"
                        >
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((cell) => (
                        <div
                            key={cell.date}
                            className={`min-h-[110px] border-b border-r border-slate-100 p-1.5 dark:border-slate-800 ${
                                !cell.in_month ? 'bg-slate-50/60 dark:bg-slate-950/40' : ''
                            } ${cell.is_today ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                        >
                            <div
                                className={`mb-1 text-xs font-semibold ${
                                    cell.is_today
                                        ? 'text-emerald-700'
                                        : cell.in_month
                                          ? 'text-slate-700 dark:text-slate-300'
                                          : 'text-slate-400'
                                }`}
                            >
                                {cell.day}
                            </div>
                            <div className="space-y-1">
                                {cell.events.slice(0, 3).map((ev) => (
                                    <Link
                                        key={ev.id}
                                        href={
                                            ev.lead
                                                ? route('leads.show', ev.lead.id)
                                                : route('tasks.index')
                                        }
                                        className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight ${
                                            ev.is_overdue
                                                ? 'bg-rose-100 text-rose-800'
                                                : ev.status === 'completed'
                                                  ? 'bg-slate-100 text-slate-500 line-through'
                                                  : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                        title={ev.title}
                                    >
                                        {ev.due_time} {ev.title}
                                    </Link>
                                ))}
                                {cell.events.length > 3 && (
                                    <div className="px-1 text-[10px] text-slate-500">
                                        +{cell.events.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
                Viewing {month} · Click an event to open the linked lead or tasks list
            </p>
        </CrmLayout>
    );
}
