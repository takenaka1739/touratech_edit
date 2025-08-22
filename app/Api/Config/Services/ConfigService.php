<?php

namespace App\Api\Config\Services;

use App\Base\Models\Config;
use App\Base\Models\ConfigCod;
use App\Base\Models\ConfigCurrency;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * 環境設定サービス
 */
class ConfigService
{

  /**
   * 詳細データを取得する
   *
   * @param int $id 見積ID
   * @return array
   */
public function get()
{
    $m = \App\Base\Models\Config::getSelf();
    $data = $m->toArray();

    // ここで画面向けに yyyy/MM/dd で上書き
    $data['tax_rate_change_at'] = $m->tax_rate_change_at
        ? Carbon::parse((string)$m->tax_rate_change_at)->format('Y/m/d')
        : null;

    // ついでに別名も残すなら
    $data['tax_rate_change_date'] = $data['tax_rate_change_at'];
    $data['delivery_eta_comment'] = (string)($m->delivery_eta_comment ?? '');
    $data['currencies'] = \App\Base\Models\ConfigCurrency::orderBy('id')->get()->toArray();
    $data['cods']       = \App\Base\Models\ConfigCod::orderBy('id')->get()->toArray();

    return $data;
}

  /**
   * 更新
   *
   * @param array $data 更新データ
   */
  public function update(array $data)
  {
    $data = new Collection($data);
    DB::transaction(function () use ($data) {
      $m = Config::getSelf();
      $m->company_name = $data->get('company_name');
      $m->zip_code = $data->get('zip_code');
      $m->address1 = $data->get('address1');
      $m->address2 = $data->get('address2');
      $m->tel = $data->get('tel');
      $m->fax = $data->get('fax');
      $m->email = $data->get('email');
      $m->bank_name1 = $data->get('bank_name1');
      $m->branch_name1 = $data->get('branch_name1');
      $m->account_name1 = $data->get('account_name1');
      $m->account_type1 = $data->get('account_type1');
      $m->account_number1 = $data->get('account_number1');
      $m->bank_name2 = $data->get('bank_name2');
      $m->branch_name2 = $data->get('branch_name2');
      $m->account_name2 = $data->get('account_name2');
      $m->account_type2 = $data->get('account_type2');
      $m->account_number2 = $data->get('account_number2');
      $m->company_level = $data->get('company_level');
      $m->sales_tax_rate = $data->get('sales_tax_rate');
      $m->pre_tax_rate = $data->get('pre_tax_rate');
      $m->tax_rate_change_at = $data->get('tax_rate_change_at');
      $m->send_trader        = is_numeric($data->get('send_trader')) ? (int)$data->get('send_trader') : null;
      $m->send_personal      = is_numeric($data->get('send_personal')) ? (int)$data->get('send_personal') : null;
      $m->delivery_eta_comment = $data->get('delivery_eta_comment');
      $m->save();

      $currencies = $data->get('currencies');
      foreach ($currencies as $c) {
        $c = new Collection($c);
        $cm = ConfigCurrency::find($c->get('id'));
        $cm->rate = $c->get('rate');
        $cm->save();
      }

      $cods = $data->get('cods');
      foreach ($cods as $c) {
        $c = new Collection($c);
        $cm = ConfigCod::find($c->get('id'));
        $cm->amount = $c->get('amount');
        $cm->save();
      }
    });
  }
}