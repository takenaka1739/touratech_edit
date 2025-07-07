<?php

namespace App\Base\Console\Services;

use App\Base\Models\ReceiveOrder;
use App\Base\Models\ReceiveOrderDetail;
use Illuminate\Support\Facades\Log;
use Exception;
use ezcMailParser;
use ezcMailVariableSet;

class ReadMailService
{
  use ReadMailServiceATrait, ReadMailServiceBTrait;

  /**
   * メールを解析する
   *
   * @param string $data
   * @return array
   */
  public function parse($data)
  {
    try {
      $set = new ezcMailVariableSet($data);
      $parser = new ezcMailParser();
      $mail = $parser->parseMail($set);
      return [
        'from' => $mail[0]->from->email,
        'subject' => $mail[0]->subject,
        'body' => isset($mail[0]->body->text) ? $mail[0]->body->text : ''
      ];
    } catch (Exception $e) {
      Log::error($e->getMessage());
      throw new Exception("メールの解析に失敗しました。");
    }
  }

  /**
   * 登録
   * 
   * @param array $data
   */
  public function store(array $data)
  {
    try {
      $order_no = $data['order_no'];
      if ($order_no) {
        if (ReceiveOrder::where('order_no', '=', $order_no)->exists()) {
          return;
        }
      }

      $m = ReceiveOrder::create($data);

      $details = $data['details'];
      if ($details) {
        $no = 0;
        foreach ($details as $d) {
          $no++;
          ReceiveOrderDetail::create([
            'id' => null,
            'receive_order_id' => $m->id,
            'no' => $no,
            'item_kind' => $d["item_kind"],
            'item_id' => $d["item_id"],
            'item_number' => $d["item_number"],
            'item_name' => $d["item_name"],
            'item_name_jp' => $d["item_name_jp"],
            'sales_unit_price' => $d["sales_unit_price"],
            'fraction' => $d["fraction"],
            'rate' => $d["rate"],
            'unit_price' => $d["unit_price"],
            'quantity' => $d["quantity"],
            'amount' => $d["amount"],
            'sales_tax_rate' => $d["sales_tax_rate"],
            'sales_tax' => $d["sales_tax"],
          ]);
        }
      }
    } catch (Exception $e) {
      Log::error($e->getMessage());
      throw new Exception("受注データの保存に失敗しました。");
    }
  }
}
