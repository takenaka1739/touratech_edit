<?php

namespace App\Api\App\Services;

use App\Base\Models\Config;
use App\Base\Models\ConfigCod;
use App\Base\Models\ConfigCurrency;
use Illuminate\Support\Facades\Log;

/**
 * アプリケーション共通サービス
 */
class AppService
{
  /**
   * 環境設定を取得する
   *
   * @return array
   */
  public function getConfig()
  {
    return Config::getSelf()->toArray();
  }

  /**
   * 通貨換算を取得する
   *
   * @return array
   */
  public function getConfigCurrency()
  {
    $rows = ConfigCurrency::orderBy('id')->get()->toArray();

    return $rows;
  }

  /**
   * 代引手数料を取得する
   *
   * @return array
   */
  public function getConfigCod()
  {
    $rows = ConfigCod::orderBy('id')->get()->toArray();

    return $rows;
  }
}
