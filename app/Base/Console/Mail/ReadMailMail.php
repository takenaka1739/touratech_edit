<?php

namespace App\Base\Console\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * メール読み込みエラー
 */
class ReadMailMail extends Mailable
{
  use Queueable, SerializesModels;

  private $error_message;
  private $mail;

  public function __construct(
    $error_message,
    $mail
  )
  {
    $this->error_message = $error_message;
    $this->mail = !empty($mail) ? $mail : [
      "from" => "",
      "subject" => "",
      "body" => "",
    ];
  }

  public function build()
  {
    return $this->subject('【自動メール登録エラー】' . $this->mail["subject"])
      ->text('emails.read_mail_mail')
      ->with([
        'error_message' => $this->error_message,
        'mail' => $this->mail,
      ]);
  }
}