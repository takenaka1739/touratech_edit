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

    // ✅ 取得できているかログ（最初の数件だけ）
    Log::info('[AppService] getConfigCurrency', [
      'count' => count($rows),
      'head'  => array_slice($rows, 0, 3),
    ]);

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

    Log::info('[AppService] getConfigCod', [
      'count' => count($rows),
      'head'  => array_slice($rows, 0, 3),
    ]);

    return $rows;
  }
}
