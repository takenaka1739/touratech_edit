<?php

namespace App\Base\Listeners;

use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Log;

class AppMessageSending
{
  public function handle(MessageSending $event)
  {
    $message = $event->message;

    Log::channel('maillog')->info($message->toString());
  }
}