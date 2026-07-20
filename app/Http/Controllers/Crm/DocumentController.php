<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Document;
use App\Models\Lead;
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
        $company = $request->user()->company;

        $documents = Document::query()
            ->with(['uploader:id,name', 'documentable'])
            ->latest()
            ->paginate(20)
            ->through(fn (Document $d) => [
                'id' => $d->id,
                'uuid' => $d->uuid,
                'title' => $d->title,
                'original_name' => $d->original_name,
                'category' => $d->category,
                'mime_type' => $d->mime_type,
                'size' => $d->humanSize(),
                'url' => $d->url(),
                'uploader' => $d->uploader?->name,
                'related' => $this->relatedLabel($d),
                'created_at' => $d->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'leads' => Lead::query()->orderBy('name')->limit(100)->get(['id', 'name']),
            'customers' => Customer::query()->orderBy('name')->limit(100)->get(['id', 'name']),
            'stats' => [
                'total' => Document::query()->count(),
                'this_month' => Document::query()
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
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

    public function store(Request $request, DocumentService $service): RedirectResponse
    {
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
        if ($document->company_id !== $request->user()->company_id) {
            abort(403);
        }

        return Storage::disk($document->disk)->download(
            $document->path,
            $document->original_name
        );
    }

    public function destroy(Document $document, Request $request, DocumentService $service): RedirectResponse
    {
        if ($document->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $service->delete($document);

        return redirect()->route('documents.index')
            ->with('success', 'Document deleted.');
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
}
