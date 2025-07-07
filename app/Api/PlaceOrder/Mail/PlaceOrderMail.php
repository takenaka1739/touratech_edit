<?php

namespace App\Api\PlaceOrder\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * 発注メール
 */
class PlaceOrderMail extends Mailable
{
  use Queueable, SerializesModels;

  private $customer_name;
  private $receive_order_id;
  private $receive_order_date;
  private $delivery_day;
  private $company_name;

  public function __construct(
    $customer_name,
    $receive_order_id,
    $receive_order_date,
    $delivery_day,
    $company_name
  )
  {
    $this->customer_name = $customer_name;
    $this->receive_order_id = $receive_order_id;
    $this->receive_order_date = $receive_order_date;
    $this->delivery_day = $delivery_day;
    $this->company_name = $company_name;
  }

  public function build()
  {
    return $this->subject((config('app.debug') ? "【テスト】" : "") . '商品の発送について')
      ->text('emails.place_order_mail')
      ->from(config('mail.from.address'), 'ツアラテックジャパン')
      ->with([
        'customer_name' => $this->customer_name,
        'receive_order_id' => $this->receive_order_id,
        'receive_order_date' => $this->receive_order_date,
        'delivery_day' => $this->delivery_day,
        'company_name' => $this->company_name,
      ]);
  }
}