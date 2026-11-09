<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            return;
        }

        $exitCode = Artisan::call('app:import-legacy-json', [
            'source' => database_path('seeders/data/db.json'),
        ]);
        if ($exitCode !== 0) {
            throw new RuntimeException(Artisan::output());
        }

    }
}
