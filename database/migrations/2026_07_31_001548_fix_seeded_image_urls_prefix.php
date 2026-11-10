<?php

use App\Models\Facility;
use App\Models\MenuItem;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix seeded facility images
        Facility::where('image_url', 'like', '/storage/%')->get()->each(function ($f) {
            $f->image_url = str_replace('/storage/', '', $f->image_url);
            $f->save();
        });

        // Fix seeded menu item images
        MenuItem::where('image_url', 'like', '/storage/%')->get()->each(function ($m) {
            $m->image_url = str_replace('/storage/', '', $m->image_url);
            $m->save();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
