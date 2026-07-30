<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('google_resource_name')->nullable()->after('notes');
            $table->index(['company_id', 'google_resource_name']);
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'google_resource_name']);
            $table->dropColumn('google_resource_name');
        });
    }
};
