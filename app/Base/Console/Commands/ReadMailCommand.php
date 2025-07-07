<?php

namespace App\Base\Console\Commands;

use App\Base\Console\Services\ReadMailService;
use App\Base\Console\Mail\ReadMailMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Exception;

class ReadMailCommand extends Command
{  /** @var string */
  protected $signature = 'command:read_mail {--test}';

  /** @var string */
  protected $description = 'Read Mail From stdin.';

  /** @var \App\Base\Console\Services\ReadMailService */
  protected $service;

  public function __construct(ReadMailService $service)
  {
    parent::__construct();

    $this->service = $service;
  }

  public function handle()
  {
    $test = $this->option("test");
    if ($test) {
      $data = Storage::get('test/console/test_mail');
    } else {
      $data = file_get_contents('php://stdin');
    }

    $mail = null;
    try {
      $mail = $this->service->parse($data);

      DB::transaction(function () use ($mail) {
        $orders = [];

        if ($this->service->isPatternA($mail)) {
          $orders = $this->service->createReceiveOrderA($mail);
        } else if ($this->service->isPatternB($mail)) {
          $orders[] = $this->service->createReceiveOrderB($mail);
        }

        if (!empty($orders)) {
          foreach ($orders as $order) {
            $this->service->store($order);
          }
        }
      });

    } catch (Exception $e) {
      $to = Config::get('const.mail.error.to');
      Mail::to($to)->send(new ReadMailMail($e->getMessage(), $mail));
      // throw $e;
    }
  }
}