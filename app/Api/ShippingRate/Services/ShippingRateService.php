<?php

namespace App\Api\ShippingRate\Services;

use App\Base\Models\Config;
use App\Base\Models\PrefectureShippingRate;
use App\Base\Models\RemoteIslandShippingRate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ShippingRateService
{
    private const PREFECTURES = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
    ];

    public function get(): array
    {
        $this->ensurePrefectureRates();
        $config = Config::getSelf();

        return [
            'free_shipping_thresholds' => [
                'send_personal' => $config->send_personal,
                'send_trader' => $config->send_trader,
            ],
            'prefecture_rates' => PrefectureShippingRate::orderBy('sort_order')->get()->toArray(),
            'remote_island_rates' => RemoteIslandShippingRate::orderBy('sort_order')->orderBy('id')->get()->toArray(),
        ];
    }

    public function update(array $data): void
    {
        DB::transaction(function () use ($data) {
            $config = Config::getSelf();
            $thresholds = new Collection($data['free_shipping_thresholds'] ?? []);
            $config->send_personal = is_numeric($thresholds->get('send_personal'))
                ? (int) $thresholds->get('send_personal')
                : null;
            $config->send_trader = is_numeric($thresholds->get('send_trader'))
                ? (int) $thresholds->get('send_trader')
                : null;
            $config->save();

            foreach ($data['prefecture_rates'] as $index => $row) {
                $c = new Collection($row);
                PrefectureShippingRate::updateOrCreate(
                    ['prefecture' => $c->get('prefecture')],
                    [
                        'amount' => $c->get('amount', 0),
                        'sort_order' => $c->get('sort_order', $index + 1),
                    ]
                );
            }

            foreach (($data['remote_island_rates'] ?? []) as $index => $row) {
                $c = new Collection($row);
                $query = RemoteIslandShippingRate::query();

                if ($c->get('id')) {
                    $query->where('id', $c->get('id'));
                } else {
                    $query->where('sort_order', $c->get('sort_order', $index + 1));
                }

                $query->update(['amount' => $c->get('amount', 0)]);
            }
        });
    }

    private function ensurePrefectureRates(): void
    {
        foreach (self::PREFECTURES as $index => $prefecture) {
            PrefectureShippingRate::firstOrCreate(
                ['prefecture' => $prefecture],
                [
                    'amount' => $prefecture === '北海道' ? 1980 : ($prefecture === '沖縄県' ? 4400 : 1100),
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}
