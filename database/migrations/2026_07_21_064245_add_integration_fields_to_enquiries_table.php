<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->string('platform', 50)->nullable()->after('channel');
            $table->string('external_id', 191)->nullable()->after('platform');
            $table->json('raw_payload')->nullable()->after('external_id');
            $table->index(['company_id', 'platform', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'platform', 'external_id']);
            $table->dropColumn(['platform', 'external_id', 'raw_payload']);
        });
    }
};
