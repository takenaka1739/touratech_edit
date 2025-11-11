<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Base\Models\Item;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //Item::factory()->count(10)->create();

        // 通常のItemを10件生成
        factory(Item::class, 10)->create();
        // セット品（setItem）を5件生成
        //factory(Item::class, 5)->states('setItem')->create();
        // 廃止された商品を3件生成
        factory(Item::class, 3)->states('discontinued')->create();
        // 非表示の商品を2件生成
        factory(Item::class, 2)->states('hidden')->create();
        // 削除された商品を1件生成
        factory(Item::class)->state('deleted')->create();


        //Item::factory()->count(10)->create();
        //Item::factory()->setItem()->count(5)->create();
        //Item::factory()->discontinued()->count(3)->create();
        //Item::factory()->hidden()->count(2)->create();
        //Item::factory()->deleted()->create();

    }
}
