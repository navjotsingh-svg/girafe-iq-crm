<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('industry_key', 50)->default('general')->index();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('country', 2)->default('IN');
            $table->string('timezone', 64)->default('Asia/Kolkata');
            $table->string('currency', 3)->default('INR');
            $table->string('team_size', 20)->nullable();
            $table->unsignedTinyInteger('onboarding_step')->default(1);
            $table->boolean('onboarding_completed')->default(false);
            $table->string('subscription_status', 30)->default('trialing');
            $table->timestamp('trial_ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('branding')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
