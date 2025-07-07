<?php

namespace App\Base\Console\Services;

use App\Base\Models\Config;
use App\Base\Models\Customer;
use App\Base\Models\Item;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;

trait ReadMailServiceBTrait
{

  /**
   * パターンBの場合true
   *
   * @param array $mail
   * @return boolean
   */
  public function isPatternB(array $mail)
  {
    $config_from = config('const.mail.mail_b.from');
    if ($config_from === $mail["from"] && strpos($mail["subject"], "ショッパーカート からのご注文") !== false) {
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
  public function createReceiveOrderB(array $mail)
  {
    $body = $mail["body"];
    if (empty($body)) {
      throw new Exception("本文の取得に失敗しました");
    }

    $corporate_class = $this->getCorporateClassB($body);

    $customer = $this->getCustomerB($body);
    $c = $this->hasCustomerB($customer);
    if (!$c) {
      $c = $this->createCustomerB($customer, $corporate_class);
    }

    $receive_order_date = $this->getReceiveOrderDateB($body);
    $shipment_amount = $this->getShippingAmountB($body);
    $fee = $this->getFeeB($body);

    $config = Config::getSelf();
    $sales_tax_rate = $config->getSalesTaxRate($receive_order_date);

    $order_no = $this->getOrderNoB($body);
    $remarks = $this->getRemarksB($body);
    $details = $this->getDetailsB($body, $c->rate, $sales_tax_rate, $c->fraction);

    $ds = new Collection($details);
    $detail_amount = $ds->sum('amount');

    $total_amount = $detail_amount + $shipment_amount + $fee;

    return [
      "receive_order_date" => $receive_order_date,
      "customer_id" => $c->id,
      "customer_name" => $c->name,
      "send_flg" => 1,
      "name" => $c->name,
      "zip_code" => $c->zip_code,
      "address1" => $c->address1,
      "address2" => $c->address2,
      "tel" => $c->tel,
      "fax" => $c->fax,
      "corporate_class" => $corporate_class,
      "shipping_amount" => $shipment_amount,
      "fee" => $fee,
      "discount" => 0,
      "total_amount" => $total_amount,
      "order_no" => $order_no,
      "remarks" => $remarks,
      "rate" => $c->rate,
      "fraction" => $c->fraction,
      "details" => $details,
    ];
  }

  /**
   * 発注日を取得する
   *
   * @param string $body
   * @return string
   */
  private function getReceiveOrderDateB(string $body)
  {
    if (preg_match('/^発注日：\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日$/m', $body, $matches)) {
      return $matches[1] . "/" . $matches[2] . "/" . $matches[3];
    }
    return "";
  }

  /**
   * 得意先情報を取得する
   *
   * return [
   *  customer_name: string,
   *  customer_kana: string,
   *  zip_code: string,
   *  address1: string,
   *  address2: string,
   *  tel: string,
   *  email: string
   * ]
   *
   * @param string $body
   * @return array
   */
  private function getCustomerB(string $body)
  {
    return [
      "customer_name" => $this->getCustomerNameB($body),
      "customer_kana" => $this->getCustomerKanaB($body),
      "zip_code" => $this->getCustomerZipCodeB($body),
      "address1" => $this->getCustomerPrefB($body) . $this->getCustomerCityB($body),
      "address2" => $this->getCustomerAddress2B($body),
      "tel" => $this->getCustomerTelB($body),
      "email" => $this->getCustomerEmailB($body),
    ];
  }

  /**
   * 得意先名を取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerNameB(string $body)
  {
    if (preg_match('/^お届け先氏名：(.*)\s+様$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先カナを取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerKanaB(string $body)
  {
    if (preg_match('/^(?:ご購入者)?氏名かな：(.*)\s+様$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先郵便番号を取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerZipCodeB(string $body)
  {
    if (preg_match('/^お届け先郵便番号：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先都道府県を取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerPrefB(string $body)
  {
    if (preg_match('/^お届け先都道府県：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先市区町村を取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerCityB(string $body)
  {
    if (preg_match('/^お届け先郡・市町村・区・町名：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先建物名を取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerAddress2B(string $body)
  {
    if (preg_match('/^お届け先建物名・番地など：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先TELを取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerTelB(string $body)
  {
    if (preg_match('/^お届け先電話番号：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先Emailを取得する
   *
   * @param string $body
   * @return string
   */
  private function getCustomerEmailB(string $body)
  {
    if (preg_match('/^(?:ご購入者)?メールアドレス：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 得意先が登録されているか
   *
   * @param array
   * @return mixed
   */
  private function hasCustomerB(array $customer)
  {
    $customer_name = str_replace([" ", "　"], "", $customer["customer_name"]);
    $tel = str_replace("-", "", $customer["tel"]);

    $rows = Customer::get();
    foreach ($rows as $row) {
      $_name = str_replace([" ", "　"], "", $row->name);
      $_tel = str_replace("-", "", $row->tel);

      if ($customer_name == $_name && $tel == $_tel) {
        return $row;
      }
    }
    return null;
  }

  /**
   * 得意先を登録する
   *
   * @param array
   * @param int $corporate_class
   * @return mixed
   */
  private function createCustomerB(array $customer, int $corporate_class)
  {
    $m = Customer::create([
      "name" => $customer["customer_name"],
      "kana" => $customer["customer_kana"],
      "zip_code" => $customer["zip_code"],
      "address1" => $customer["address1"],
      "address2" => $customer["address2"],
      "tel" => $customer["tel"],
      "email" => $customer["email"],
      "fraction" => 3,
      "corporate_class" => $corporate_class,
      "bank_class" => 1,
      "cutoff_date" => 31,
      "rate" => 100,
    ]);
    return $m;
  }

  /**
   * 支払方法を取得する
   *
   * @param string $body
   * @return int
   */
  private function getCorporateClassB(string $body)
  {
    $nm = $this->getCorporateClassNameB($body);

    $corporate_class = "";
    switch ($nm) {
      case "宅配代引":
        $corporate_class = 3;
        break;
      case "銀行振込":
        $corporate_class = 4;
        break;
      case "クレジットカード":
        $corporate_class = 5;
        break;
      default:
        throw new Exception("支払方法の取得に失敗しました。");
    }
    return $corporate_class;
  }

  /**
   * 支払方法を取得する
   *
   * @param string $body
   * @return string
   */
  private function getCorporateClassNameB(string $body)
  {
    if (preg_match('/^お支払方法：(.*)$/m', $body, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 送料を取得する
   *
   * @param string $body
   * @return string
   */
  private function getShippingAmountB(string $body)
  {
    if (preg_match('/^送料\(税込\)\s+(.*)円\s*$/m', $body, $matches)) {
      return intval(str_replace(",", "", $matches[1]));
    }
    return 0;
  }

  /**
   * 手数料を取得する
   *
   * @param string $body
   * @return string
   */
  private function getFeeB(string $body)
  {
    if (preg_match('/^代引き手数料\(税込\)\s+(.*)円\s*$/m', $body, $matches)) {
      return intval(str_replace(",", "", $matches[1]));
    }
    return 0;
  }

  /**
   * 注文番号を取得する
   *
   * @param string $body
   * @return string
   */
  private function getOrderNoB(string $body)
  {
    if (preg_match('/^ご注文番号：(.*)$/m', $body, $matches)) {
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
  private function getRemarksB(string $body)
  {
    if (preg_match('/ご意見、ご要望等ありましたらご記入ください。 ：[\n|\r\n|\r]*(.*)/', $body, $matches)) {
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
  private function getDetailsB(
    string $body,
    int $rate,
    int $sales_tax_rate,
    int $fraction)
  {
    $item_area = $this->getItemAreasB($body);
    $areas = explode("\n", $item_area);

    $details = [];
    foreach ($areas as $line) {

      $arr = $this->getItemB($line);
      if (!$arr) {
        continue;
      }

      $item = Item::where('item_number', $arr["item_number"])->first();
      if (!$item) {
        throw new Exception("商品の取得に失敗しました");
      }

      $sales_unit_price = $item->sales_unit_price;
      $unit_price = $arr["unit_price"];
      $quantity = $arr["quantity"];
      $amount = $arr["amount"];
      $sales_tax = get_sales_tax($amount, $sales_tax_rate, $fraction);

      $details[] = [
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
      ];
    }

    return $details;
  }

  /**
   * 明細の部分を取得する
   *
   * @param string $body
   * @return string
   */
  private function getItemAreasB(string $body)
  {
    if (preg_match('/(?:-{10,}[\n|\r\n|\r])([\s\S]*)(?:[\n|\r\n|\r]-{10,})/', $body, $matches)) {
        return $matches[1];
    }
    return "";
  }

  /**
   * 商品情報を取得する
   *
   * @param string $line
   * @return array|null
   */
  private function getItemB(string $line)
  {
    $item_number = $this->getItemNumberB($line);
    if ($item_number) {
      return [
        "item_number" => $item_number,
        "unit_price" => $this->getUnitPriceB($line),
        "quantity" => $this->getQuantityB($line),
        "amount" => $this->getAmountB($line)
      ];
    }
    return null;
  }

  /**
   * 品番を取得する
   *
   * @param string $line
   * @return string
   */
  private function getItemNumberB(string $line)
  {
    if (preg_match('/^.*\s+([a-zA-Z0-9\-]+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*(?:\d+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*$/', $line, $matches)) {
      return $matches[1];
    }
    return "";
  }

  /**
   * 単価を取得する
   *
   * @param string $line
   * @return string
   */
  private function getUnitPriceB(string $line)
  {
    if (preg_match('/^.*\s+(?:[a-zA-Z0-9\-]+)\s+(\d{1,3}(?:,\d{3})*)\s*円\s*(?:\d+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*$/', $line, $matches)) {
      return intval(str_replace(",", "", $matches[1]));
    }
    return "";
  }

  /**
   * 数量を取得する
   *
   * @param string $line
   * @return string
   */
  private function getQuantityB(string $line)
  {
    if (preg_match('/^.*\s+(?:[a-zA-Z0-9\-]+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*(\d+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*$/', $line, $matches)) {
      return intval(str_replace(",", "", $matches[1]));
    }
    return "";
  }

  /**
   * 金額を取得する
   *
   * @param string $line
   * @return string
   */
  private function getAmountB(string $line)
  {
    if (preg_match('/^.*\s+(?:[a-zA-Z0-9\-]+)\s+(?:\d{1,3}(?:,\d{3})*)\s*円\s*(?:\d+)\s+(\d{1,3}(?:,\d{3})*)\s*円\s*$/', $line, $matches)) {
      return intval(str_replace(",", "", $matches[1]));
    }
    return "";
  }

}
