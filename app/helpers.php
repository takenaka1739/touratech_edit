<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Carbon;

if (!function_exists('assets')) {
  /**
   * Generate an asset path with version for the application.
   *
   * @param string $path
   * @param bool|null $secure
   * @return string
   */
  function assets($path, $secure = null)
  {
    $file = public_path() . DIRECTORY_SEPARATOR . ltrim($path, '\\/');

    $param = "";
    if (File::exists($file)) {
      $param = "?v=" . File::lastModified($file);
    }
    return asset($path . $param, $secure);
  }
}

if (!function_exists('escape_like')) {
  /**
   * Escape special characters for a LIKE query.
   *
   * @param string $value
   * @param string $char
   * @return string
   */
  function escape_like(string $value, string $char = '\\')
  {
    return str_replace(
      [$char, '%', '_'],
      [$char . $char, $char . '%', $char . '_'],
      $value
    );
  }
}

if (!function_exists('app_storage_path')) {
  /**
   * Get the path to the storate\app folder.
   *
   * @param string $path
   * @return string
   */
  function app_storage_path(string $path)
  {
    return storage_path('app/' . $path);
  }
}

if (!function_exists('get_cutoff_date')) {
  /**
   * 年月(Y/m)と締日(d)から締日(Y/m/d)を取得する
   *
   * @param string $month 年月(Y/m)
   * @param mixed $cutoff_date 締日(d)
   * @return string
   */
  function get_cutoff_date(string $month, $cutoff_date)
  {
    $matsu = str_pad($cutoff_date, 2, 0, STR_PAD_LEFT);
    $dt = Carbon::parse($month . "/01")->endOfMonth();
    if ($matsu === "31") {
      return $dt->format('Y/m/d');
    } else {
      if ($dt->day < (int)$cutoff_date) {
        return $dt->format('Y/m/d');
      } else {
        return Carbon::parse($month . "/" . $matsu)->format('Y/m/d');
      }
    }
  }
}

if (!function_exists('get_corporate_class_name')) {
  /**
   * 支払方法の名称を取得する
   *
   * @param int $corporate_class 支払方法
   * @return string
   */
  function get_corporate_class_name(int $corporate_class)
  {
    $name = "";
    switch ($corporate_class)
    {
      case 1:
        $name = "現金";
        break;
      case 2:
        $name = "掛売";
        break;
      case 3:
        $name = "宅配代引";
        break;
      case 4:
        $name = "銀行振込";
        break;
      case 5:
        $name = "クレジットカード";
        break;

      default:
        throw new Exception("支払方法の取得に失敗しました。");
    }

    return $name;
  }
}

if (!function_exists('get_sales_tax')) {
  /**
   * 消費税（内税）を取得する
   *
   * @param int $amount
   * @param int $rate
   * @param int $fraction
   */
  function get_sales_tax(int $amount, int $rate, int $fraction) {
    $_amount = ($amount * $rate) / (100 + $rate);
    switch ($fraction) {
      case 1:
        return floor($_amount);
      case 2:
        return ceil($_amount);
      case 3:
        return round($_amount);
      default:
        return 0;
    }
  }
}

if (!function_exists('get_sales_tax2')) {
  /**
   * 消費税（内税）を取得する
   *
   * @param float $amount
   * @param int $rate
   * @param int $fraction
   */
  function get_sales_tax2(float $amount, int $rate, int $fraction) {
    $_amount = bcdiv(bcmul($amount, $rate, 2),  (100 + $rate), 2);
    switch ($fraction) {
      case 1:
        return floor($_amount);
      case 2:
        return ceil($_amount);
      case 3:
        return round($_amount);
      default:
        return 0;
    }
  }
}

if (!function_exists('calc_amount')) {
  /**
   * 金額と消費税（内税）を取得する
   *
   * @param float $unit_price 単価
   * @param int $quantity 数量
   * @param int $sales_tax_rate 消費税率(%)
   * @param int $fraction 端数処理(1:切り捨て、2:切り上げ、3:四捨五入)
   * @return [
   *  $amount 金額
   *  $sales_tax 消費税（内税）
   * ]
   */
  function calc_amount(float $unit_price, int $quantity, int $sales_tax_rate, int $fraction) {
    $amount = bcmul($unit_price, $quantity, 2);
    switch ($fraction)
    {
      case 1:
        $amount = floor($amount);

        break;
      case 2:
        $amount = ceil($amount);

        break;
      case 3:
        $amount = round($amount);

        break;
      default:
        throw new Exception("金額の取得に失敗しました。");
    }
    $sales_tax = get_sales_tax($amount, $sales_tax_rate, $fraction);

    return [$amount, $sales_tax];
  }
}

if (!function_exists('calc_unit_price')) {
  /**
   * 単価を取得する
   *
   * @param float $sales_unit_price 売上単価
   * @param int $rate 掛率(%)
   * @param int $fraction 端数処理
   * @return float 単価
   */
  function calc_unit_price(float $sales_unit_price, int $rate, int $fraction) {
    $unit_price = bcmul($sales_unit_price, $rate, 2);
    switch ($fraction) {
      case 1:
        $unit_price = floor($unit_price);
        break;
      case 2:
        $unit_price = ceil($unit_price);
        break;
      case 3:
        $unit_price = round($unit_price);
        break;
    }
    return bcdiv($unit_price, 100, 2);
  }
}

if (!function_exists('calc_total_amount')) {
  /**
   * 合計を取得する
   *
   * @param float $shipping_amount 送料
   * @param float $fee 手数料
   * @param float $discount 値引
   * @param int $details_amount 合計金額
   * @return 合計金額
   */
  function calc_total_amount(float $shipping_amount, float $fee, float $discount, int $details_amount) {
    return bcadd(bcsub(bcadd($shipping_amount, $fee), $discount), $details_amount);
  }
}

if (!function_exists('get_shipping_amount')) {
  /**
   * 送料を取得する
   * 
   * @param float $detail_amount 明細の合計金額
   * @param int $rate 得意先の掛率
   * @param int $send_personal
   * @param int $send_trader
   * @param int $send_price
   * @return int 
   */
  function get_shipping_amount(
    float $detail_amount,
    int $rate,
    int $send_personal,
    int $send_trader,
    int $send_price) {
    $_amount = $rate === 100 ? $send_personal : $send_trader;
    if ($_amount > $detail_amount) {
      return $send_price;
    }
    return 0;
  }
}

if (!function_exists('add_month')) {
  /**
   * 月を加算する
   * 
   * @param string $month YYYY/MM
   * @return string YYYY/MM
   */
  function add_month(string $month) {
    $tmp = new Carbon($month."/01");
    $tmp->addMonth();
    return $tmp->format('Y/m');
  }
}
