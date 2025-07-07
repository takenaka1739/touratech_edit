<?php

namespace App\Base\Console\Services;

use App\Base\Models\Config;
use App\Base\Models\Customer;
use App\Base\Models\Item;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;

trait ReadMailServiceATrait
{

  /**
   * パターンAの場合true
   *
   * @param array $mail
   * @return boolean
   */
  public function isPatternA(array $mail)
  {
    $config_from = config('const.mail.mail_a.from');
    if ($config_from === $mail["from"] && strpos($mail["subject"], "発注依頼") !== false) {
      return true;
    }

    return false;
  }

  /**
   * 受注データを作成する
   *
   * @param array $mail
   * @return array
   */
  public function createReceiveOrderA(array $mail)
  {
    $body = $mail["body"];
    if (empty($body)) {
      throw new Exception("本文の取得に失敗しました");
    }

    $customer_id = config('const.mail.customer_id.rivercrane');
    $c = Customer::find($customer_id);

    $today = Carbon::now()->format('Y/m/d');
    $config = Config::getSelf();
    $sales_tax_rate = $config->getSalesTaxRate($today);

    $items = $this->getItemsA($body);
    $arr = [];
    foreach ($items as $t) {
      $order_no = $this->getOrderNoA($t);
      $remarks = $this->getRemarksA($t);
      $details = $this->getDetailsA($t, $c->rate, $sales_tax_rate, $c->fraction);

      $ds = new Collection($details);
      $detail_amount = $ds->sum('amount');

      $shipping_amount = get_shipping_amount($detail_amount, $c->rate, $config->send_personal, $config->send_trader, $config->send_price);

      $total_amount = $detail_amount + $shipping_amount;

      $arr[] = [
        "receive_order_date" => $today,
        "customer_id" => $customer_id,
        "customer_name" => $c->name,
        "send_flg" => 1,
        "name" => $c->name,
        "zip_code" => $c->zip_code,
        "address1" => $c->address1,
        "address2" => $c->address2,
        "tel" => $c->tel,
        "fax" => $c->fax,
        "corporate_class" => $c->corporate_class,
        "shipping_amount" => $shipping_amount,
        "fee" => 0,
        "discount" => 0,
        "total_amount" => $total_amount,
        "order_no" => $order_no,
        "remarks" => $remarks,
        "rate" => $c->rate,
        "fraction" => $c->fraction,
        "details" => $details,
      ];
    }
    return $arr;
  }

  /**
   * 注文番号を取得する
   *
   * @param string $body
   * @return string
   */
  private function getOrderNoA(string $body)
  {
    if (preg_match('/^SCM\s?コード：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 備考を取得する
   *
   * @param string $body
   * @return string
   */
  private function getRemarksA(string $body)
  {
    if (preg_match('/^(納期★.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 明細を取得する
   *
   * @param string $body
   * @param int $rate
   * @param int $sales_tax_rate
   * @param int $fraction
   * @return array
   */
  private function getDetailsA(
    string $body,
    int $rate,
    int $sales_tax_rate,
    int $fraction)
  {
    $item_number = $this->getItemNumberA($body);
    $item = Item::where('item_number', $item_number)->first();
    if (!$item) {
      throw new Exception("商品の取得に失敗しました");
    }

    $sales_unit_price = $item->sales_unit_price;
    $unit_price = calc_unit_price($sales_unit_price, $rate, $fraction);
    $quantity = $this->getQuantityA($body);
    [$amount, $sales_tax] = calc_amount($unit_price, $quantity, $sales_tax_rate, $fraction);

    return [
      [
        'item_kind' => $item->is_set_item ? 2 : 1,
        'item_id' => $item->id,
        'item_number' => $item->item_number,
        'item_name' => $item->name,
        'item_name_jp' => $item->name_jp,
        'sales_unit_price' => $sales_unit_price,
        'fraction' => $fraction,
        'rate' => $rate,
        'unit_price' => $unit_price,
        'quantity' => $quantity,
        'amount' => $amount,
        'sales_tax_rate' => $sales_tax_rate,
        'sales_tax' => $sales_tax,
      ],
    ];
  }

  /**
   * @param string $body
   * @return array
   */
  private function getItemsA(string $body)
  {
    $lines = explode("\n", $body);
    $arr = [];
    $index = -1;
    $text = "";
    foreach ($lines as $line) {
      if (preg_match_all('/^(SCM\s?コード：.*)$/m', $line, $matches)) {
        if ($index > -1) {
          $arr[$index] = $text;
        }
        $index++;
        $text = "";
      }

      if ($index >= 0) {
        $text .= $line . "\n";
      }
    }
    if ($text != "") {
      $arr[$index] = $text;
    }
    return $arr;
  }

  /**
   * 数量を取得する
   *
   * @param string $body
   * @return int
   */
  private function getQuantityA(string $body)
  {
    if (preg_match('/^定価\(税込\).*★([0-9]+)\s+.*★$/m', $body, $matches)) {
      return intval($matches[1]);
    }
    return "";
  }

  /**
   * 品番を取得する
   *
   * @param string $body
   * @return string
   */
  private function getItemNumberA(string $body)
  {
    if (preg_match('/^品番\[([\w\-]+)\].*$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }
}