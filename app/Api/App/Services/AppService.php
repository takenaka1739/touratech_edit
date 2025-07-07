<?php

namespace App\Api\App\Services;

use App\Base\Models\Config;
use App\Base\Models\ConfigCod;
use App\Base\Models\ConfigCurrency;

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
    // return ConfigCurrency::orderBy('id')->get()->toArray();
    return []; // 一時的に空配列を返す
  }

  /**
   * 代引手数料を取得する
   *
   * @param array
   */
  public function getConfigCod()
  {
    //return ConfigCod::orderBy('id')->get()->toArray();
    return []; // 一時的に空配列を返す
  }
}