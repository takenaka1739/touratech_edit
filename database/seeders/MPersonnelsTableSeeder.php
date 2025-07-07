<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class MPersonnelsTableSeeder extends Seeder
{
    public function run()
    {
        if (app()->bound('debugbar')) {
            \Debugbar::disable();
        }

        DB::table('m_personnels')->updateOrInsert(
            ['login_id' => 'admin'],
            [
                'name' => '管理者',
                'password' => Hash::make('password'),
                'role' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );
    }
}
