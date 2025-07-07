<?php

namespace App\Base\Console\Commands;

use App\Base\Console\Services\MigrationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrationCommand extends Command
{
  /** @var string */
  protected $signature = 'command:migration';

  /** @var string */
  protected $description = 'Migrate old data to new database.';

  /** @var \App\Base\Console\Services\MigrationService */
  protected $service = null;

  public function __construct()
  {
    parent::__construct();

    $this->service = new MigrationService('mysql_old');
  }

  public function handle()
  {
    $this->info('migration start.');

    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    $this->service->migrate();

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    $this->info('migration complete.');
  }
}