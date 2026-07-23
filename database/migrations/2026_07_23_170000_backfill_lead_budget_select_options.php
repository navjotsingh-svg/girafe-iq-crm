<?php

use App\Models\CustomFieldDefinition;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = ['Under 1L', '1L-5L', '5L-10L', '10L+', 'Not decided'];

        CustomFieldDefinition::withoutGlobalScopes()
            ->where('entity', 'lead')
            ->where('key', 'budget')
            ->where('type', 'select')
            ->get()
            ->each(function (CustomFieldDefinition $field) use ($defaults) {
                $options = $field->options;
                if (is_array($options) && count(array_filter($options, fn ($o) => filled($o))) > 0) {
                    return;
                }

                $field->update(['options' => $defaults]);
            });
    }

    public function down(): void
    {
        //
    }
};
