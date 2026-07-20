<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Document;
use App\Models\Lead;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function store(Company $company, User $user, UploadedFile $file, array $data): Document
    {
        $disk = 'public';
        $folder = 'documents/'.$company->id;
        $path = $file->store($folder, $disk);

        [$type, $id] = $this->resolveDocumentable($company, $data);

        $document = Document::create([
            'company_id' => $company->id,
            'title' => $data['title'] ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'original_name' => $file->getClientOriginalName(),
            'disk' => $disk,
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize() ?: 0,
            'category' => $data['category'] ?? 'other',
            'documentable_type' => $type,
            'documentable_id' => $id,
            'uploaded_by' => $user->id,
            'notes' => $data['notes'] ?? null,
        ]);

        $this->logger->log('document.uploaded', $document);

        return $document;
    }

    public function delete(Document $document): void
    {
        if ($document->path) {
            Storage::disk($document->disk)->delete($document->path);
        }

        $this->logger->log('document.deleted', $document);
        $document->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{0: ?string, 1: ?int}
     */
    private function resolveDocumentable(Company $company, array $data): array
    {
        $related = $data['related_type'] ?? null;
        $relatedId = $data['related_id'] ?? null;

        if (! $related || ! $relatedId) {
            return [null, null];
        }

        return match ($related) {
            'lead' => [
                Lead::class,
                Lead::query()->where('company_id', $company->id)->where('id', $relatedId)->value('id'),
            ],
            'customer' => [
                Customer::class,
                Customer::query()->where('company_id', $company->id)->where('id', $relatedId)->value('id'),
            ],
            default => [null, null],
        };
    }
}
