<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meta_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('page_id')->index();
            $table->string('page_name')->nullable();
            $table->text('page_access_token');
            $table->string('instagram_business_id')->nullable();
            $table->boolean('subscribed_leadgen')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'page_id']);
            $table->unique('page_id'); // one CRM company owns a page for webhook routing
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meta_pages');
    }
};
