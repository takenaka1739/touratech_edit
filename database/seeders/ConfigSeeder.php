<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConfigSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('m_configs')->insert([
            'company_name' => 'ツラーテック・ジャパン株式会社',
            'zip_code' => '123-4567',
            'address1' => '東京都渋谷区道玄坂1-2-3',
            'address2' => 'ツラーテックビル5F',
            'tel' => '03-1234-5678',
            'fax' => '03-1234-5679',
            'email' => 'info@touratech.co.jp',
            'company_level' => 1,
            'bank_name1' => '三井住友銀行',
            'branch_name1' => '渋谷支店',
            'account_name1' => 'ツラーテック・ジャパン（カ',
            'account_type1' => 1,
            'account_number1' => '1234567',
            'bank_name2' => 'ゆうちょ銀行',
            'branch_name2' => '〇〇八支店',
            'account_name2' => 'ツラーテック・ジャパン（カ',
            'account_type2' => 2,
            'account_number2' => '7654321',
            'sales_tax_rate' => 10,
            'pre_tax_rate' => 8,
            'tax_rate_change_at' => '2019-10-01',
            'supplier_id' => 1,
            'send_trader' => 1,
            'send_personal' => 0,
            'send_price' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
