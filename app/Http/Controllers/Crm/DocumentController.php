<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Document;
use App\Models\Lead;
use App\Models\User;
use App\Services\Crm\DocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $company = $user->company;
        $isAdmin = $this->isDocumentsAdmin($user);

        $filters = [
            'search' => trim((string) $request->input('search', '')),
            'category' => (string) $request->input('category', ''),
            'uploader' => (string) $request->input('uploader', ''),
            'related' => (string) $request->input('related', ''),
            'include_deleted' => $isAdmin && $request->boolean('include_deleted'),
        ];

        $query = Document::query()
            ->with(['uploader:id,name,email', 'documentable']);

        if (! $isAdmin) {
            $query->where('uploaded_by', $user->id);
            // Staff cannot filter by other uploaders
            $filters['uploader'] = '';
        }

        if ($filters['include_deleted']) {
            $query->withTrashed();
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('original_name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($filters['category'] !== '') {
            $query->where('category', $filters['category']);
        }

        if ($isAdmin && $filters['uploader'] !== '') {
            $query->where('uploaded_by', (int) $filters['uploader']);
        }

        if ($filters['related'] === 'lead') {
            $query->where('documentable_type', Lead::class);
        } elseif ($filters['related'] === 'customer') {
            $query->where('documentable_type', Customer::class);
        } elseif ($filters['related'] === 'none') {
            $query->whereNull('documentable_type');
        }

        $ownScope = fn ($q) => $isAdmin ? $q : $q->where('uploaded_by', $user->id);

        $documents = $query
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Document $d) => [
                'id' => $d->id,
                'uuid' => $d->uuid,
                'title' => $d->title,
                'original_name' => $d->original_name,
                'category' => $d->category,
                'mime_type' => $d->mime_type,
                'size' => $d->humanSize(),
                'url' => $d->trashed() ? null : $d->url(),
                'uploader' => $d->uploader?->name,
                'uploader_email' => $d->uploader?->email,
                'related' => $this->relatedLabel($d),
                'related_href' => $this->relatedHref($d),
                'notes' => $d->notes,
                'is_deleted' => $d->trashed(),
                'created_at' => $d->created_at?->toIso8601String(),
                'created_at_human' => $d->created_at?->timezone($company->timezone ?? config('app.timezone'))->format('d M Y, h:i A'),
                'deleted_at' => $d->deleted_at?->toIso8601String(),
            ]);

        $history = [];
        if ($isAdmin) {
            $history = ActivityLog::query()
                ->with('user:id,name')
                ->where('subject_type', Document::class)
                ->whereIn('action', ['document.uploaded', 'document.deleted'])
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (ActivityLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'label' => $log->action === 'document.deleted' ? 'Deleted' : 'Uploaded',
                    'user' => $log->user?->name
                        ?? ($log->properties['uploader_name'] ?? 'System'),
                    'title' => $log->properties['title']
                        ?? $log->properties['original_name']
                        ?? 'Document #'.$log->subject_id,
                    'original_name' => $log->properties['original_name'] ?? null,
                    'category' => $log->properties['category'] ?? null,
                    'document_id' => $log->subject_id,
                    'created_at' => $log->created_at?->toIso8601String(),
                    'created_at_human' => $log->created_at?->timezone($company->timezone ?? config('app.timezone'))->format('d M Y, h:i A'),
                ]);
        }

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'history' => $history,
            'filters' => $filters,
            'is_admin' => $isAdmin,
            'can_manage' => true, // staff list is own-only; destroy still checks ownership/admin
            'leads' => Lead::query()->orderBy('name')->limit(100)->get(['id', 'name']),
            'customers' => Customer::query()->orderBy('name')->limit(100)->get(['id', 'name']),
            'uploaders' => $isAdmin
                ? User::query()
                    ->where('company_id', $company->id)
                    ->whereIn(
                        'id',
                        Document::query()->withTrashed()->whereNotNull('uploaded_by')->distinct()->pluck('uploaded_by')
                    )
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'stats' => [
                'total' => $ownScope(Document::query())->count(),
                'this_month' => $ownScope(Document::query())
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'deleted' => $isAdmin ? Document::onlyTrashed()->count() : 0,
                'uploaders' => $isAdmin
                    ? (int) Document::query()->whereNotNull('uploaded_by')->selectRaw('count(distinct uploaded_by) as c')->value('c')
                    : 1,
            ],
            'categories' => [
                ['value' => 'contract', 'label' => 'Contract'],
                ['value' => 'invoice', 'label' => 'Invoice'],
                ['value' => 'id_proof', 'label' => 'ID proof'],
                ['value' => 'proposal', 'label' => 'Proposal'],
                ['value' => 'other', 'label' => 'Other'],
            ],
        ]);
    }

    public function show(Request $request, int $document): Response
    {
        $user = $request->user();
        $isAdmin = $this->isDocumentsAdmin($user);

        $query = Document::query()->where('company_id', $user->company_id);
        if ($isAdmin) {
            $query->withTrashed();
        }

        $document = $query->findOrFail($document);

        $this->authorizeDocumentAccess($request->user(), $document, $isAdmin);

        $document->load(['uploader:id,name,email', 'documentable']);

        $company = $user->company;
        $tz = $company->timezone ?? config('app.timezone');

        $history = ActivityLog::query()
            ->with('user:id,name')
            ->where('subject_type', Document::class)
            ->where('subject_id', $document->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'label' => match ($log->action) {
                    'document.deleted' => 'Deleted',
                    'document.uploaded' => 'Uploaded',
                    default => str_replace(['document.', '_'], ['', ' '], $log->action),
                },
                'user' => $log->user?->name
                    ?? ($log->properties['uploader_name'] ?? 'System'),
                'properties' => $log->properties,
                'created_at' => $log->created_at?->toIso8601String(),
                'created_at_human' => $log->created_at?->timezone($tz)->format('d M Y, h:i A'),
            ]);

        return Inertia::render('Documents/Show', [
            'document' => [
                'id' => $document->id,
                'uuid' => $document->uuid,
                'title' => $document->title,
                'original_name' => $document->original_name,
                'category' => $document->category,
                'mime_type' => $document->mime_type,
                'size' => $document->humanSize(),
                'url' => $document->trashed() ? null : $document->url(),
                'notes' => $document->notes,
                'uploader' => $document->uploader?->name,
                'uploader_email' => $document->uploader?->email,
                'related' => $this->relatedLabel($document),
                'related_href' => $this->relatedHref($document),
                'is_deleted' => $document->trashed(),
                'created_at' => $document->created_at?->toIso8601String(),
                'created_at_human' => $document->created_at?->timezone($tz)->format('d M Y, h:i A'),
                'deleted_at_human' => $document->deleted_at?->timezone($tz)->format('d M Y, h:i A'),
            ],
            'history' => $history,
            'is_admin' => $isAdmin,
            'can_manage' => $isAdmin
                || $user->can('documents.manage')
                || (! $isAdmin && (int) $document->uploaded_by === (int) $user->id),
        ]);
    }

    public function store(Request $request, DocumentService $service): RedirectResponse
    {
        $user = $request->user();
        if (! $this->isDocumentsAdmin($user)
            && ! $user->can('documents.manage')
            && ! $user->can('documents.view')
        ) {
            abort(403, 'You do not have permission to upload documents.');
        }

        $data = $request->validate([
            'file' => 'required|file|max:10240',
            'title' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:40',
            'related_type' => 'nullable|in:lead,customer',
            'related_id' => 'nullable|integer',
            'notes' => 'nullable|string|max:2000',
        ]);

        $service->store(
            $request->user()->company,
            $request->user(),
            $request->file('file'),
            $data
        );

        return redirect()->route('documents.index')
            ->with('success', 'Document uploaded.');
    }

    public function download(Document $document, Request $request): StreamedResponse
    {
        $user = $request->user();

        if ($document->company_id !== $user->company_id) {
            abort(403);
        }

        if ($document->trashed()) {
            abort(404);
        }

        $this->authorizeDocumentAccess($user, $document, $this->isDocumentsAdmin($user));

        return Storage::disk($document->disk)->download(
            $document->path,
            $document->original_name
        );
    }

    public function destroy(Document $document, Request $request, DocumentService $service): RedirectResponse
    {
        $user = $request->user();

        if ($document->company_id !== $user->company_id) {
            abort(403);
        }

        $isAdmin = $this->isDocumentsAdmin($user);
        $this->authorizeDocumentAccess($user, $document, $isAdmin);

        // Admins / manage permission, or staff deleting their own upload
        if (! $isAdmin
            && ! $user->can('documents.manage')
            && (int) $document->uploaded_by !== (int) $user->id
        ) {
            abort(403, 'You do not have permission to delete this document.');
        }

        $service->delete($document);

        return redirect()->route('documents.index')
            ->with('success', 'Document deleted.');
    }

    private function authorizeDocumentAccess(User $user, Document $document, bool $isAdmin): void
    {
        if ($isAdmin) {
            return;
        }

        if ((int) $document->uploaded_by !== (int) $user->id) {
            abort(403, 'You can only access documents you uploaded.');
        }
    }

    private function isDocumentsAdmin(User $user): bool
    {
        // Only company admins / managers see all docs + uploader filters.
        // Staff roles (sales_executive, support, etc.) never get this.
        $user->syncPermissionTeam();

        return $user->isCompanyAdmin()
            || $user->hasRole('manager')
            || $user->hasRole('super_admin')
            || $user->getRoleNames()->contains('manager')
            || $user->getRoleNames()->contains('company_admin')
            || $user->getRoleNames()->contains('super_admin');
    }

    private function relatedLabel(Document $document): ?string
    {
        if (! $document->documentable) {
            return null;
        }

        $name = $document->documentable->name ?? null;
        if (! $name) {
            return null;
        }

        $type = class_basename($document->documentable_type);

        return "{$type}: {$name}";
    }

    private function relatedHref(Document $document): ?string
    {
        if (! $document->documentable_id || ! $document->documentable_type) {
            return null;
        }

        return match ($document->documentable_type) {
            Lead::class => route('leads.show', $document->documentable_id),
            Customer::class => route('customers.show', $document->documentable_id),
            default => null,
        };
    }
}
