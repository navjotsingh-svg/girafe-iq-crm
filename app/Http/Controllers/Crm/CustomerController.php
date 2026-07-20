<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Services\Crm\CustomerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;

        $customers = Customer::query()
            ->with(['assignee:id,name', 'deal:id,title,value', 'lead:id,name'])
            ->latest()
            ->paginate(15)
            ->through(fn (Customer $c) => [
                'id' => $c->id,
                'uuid' => $c->uuid,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'status' => $c->status,
                'lifetime_value' => (float) $c->lifetime_value,
                'currency' => $c->currency,
                'assignee' => $c->assignee?->name,
                'deal' => $c->deal?->title,
                'converted_at' => $c->converted_at?->toIso8601String(),
                'created_at' => $c->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'stats' => [
                'total' => Customer::query()->count(),
                'active' => Customer::query()->where('status', Customer::STATUS_ACTIVE)->count(),
                'lifetime_value' => (float) Customer::query()->sum('lifetime_value'),
                'currency' => $company->currency ?? 'INR',
            ],
        ]);
    }

    public function show(Customer $customer, Request $request): Response
    {
        if ($customer->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $customer->load([
            'assignee:id,name',
            'deal.stage:id,name,color',
            'lead:id,name,email,phone,temperature',
        ]);

        $company = $request->user()->company;

        return Inertia::render('Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'status' => $customer->status,
                'lifetime_value' => (float) $customer->lifetime_value,
                'currency' => $customer->currency,
                'notes' => $customer->notes,
                'converted_at' => $customer->converted_at?->toIso8601String(),
                'assignee' => $customer->assignee,
                'deal' => $customer->deal ? [
                    'id' => $customer->deal->id,
                    'title' => $customer->deal->title,
                    'value' => (float) $customer->deal->value,
                    'stage' => $customer->deal->stage,
                ] : null,
                'lead' => $customer->lead ? [
                    'id' => $customer->lead->id,
                    'name' => $customer->lead->name,
                    'temperature' => $customer->lead->temperature,
                ] : null,
            ],
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, CustomerService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'status' => 'nullable|in:active,inactive,churned',
            'lifetime_value' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->create($request->user()->company, $request->user(), $data);

        return redirect()->route('customers.index')
            ->with('success', 'Customer created.');
    }

    public function update(Customer $customer, Request $request, CustomerService $service): RedirectResponse
    {
        if ($customer->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'status' => 'nullable|in:active,inactive,churned',
            'lifetime_value' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->update($customer, $data);

        return back()->with('success', 'Customer updated.');
    }
}
