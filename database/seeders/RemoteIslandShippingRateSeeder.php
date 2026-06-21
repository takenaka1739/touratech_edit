<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RemoteIslandShippingRateSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeds/remote_island_shipping_rates.sql');

        if (!file_exists($path)) {
            throw new RuntimeException("SQL file not found: {$path}");
        }

        DB::unprepared(file_get_contents($path));
    }
}
