<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('follow_ups', function (Blueprint $table) {
            $table->foreignId('enquiry_id')
                ->nullable()
                ->after('lead_id')
                ->constrained()
                ->nullOnDelete();
            $table->index(['company_id', 'enquiry_id']);
        });
    }

    public function down(): void
    {
        Schema::table('follow_ups', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'enquiry_id']);
            $table->dropConstrainedForeignId('enquiry_id');
        });
    }
};
