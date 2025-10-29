<?php

namespace App\Api\Hiden\Services;

use App\Base\Models\Config;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Exception;

class HidenService
{
  protected $base_path;

  private $table         = 't_sales';
  private $salesAlias    = 'ts';

  private $addrTable     = 'm_delivery_addresses';
  private $addrAlias     = 'mda';

  private $paymentTable  = 'm_payments';
  private $paymentAlias  = 'mp';

  public function __construct()
  {
    $this->base_path = config('const.paths.hiden.output_path');

    // Debugbar 等の HTML 差し込みを抑止
    try {
      if (app()->bound('debugbar')) {
        app('debugbar')->disable();
      } elseif (class_exists(\Barryvdh\Debugbar\Facades\Debugbar::class)) {
        \Barryvdh\Debugbar\Facades\Debugbar::disable();
      }
    } catch (\Throwable $e) { /* noop */ }
  }

  public function createB2Csv(array $cond)
  {
    $rows = $this->fetchSalesRows($cond);
    $csv  = $this->buildB2Csv($rows);
    $this->assertNoHtml($csv);

    $prefix  = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path    = $this->getStoragePath($file_id);
    if (!Storage::put($path, $csv)) {
      throw new Exception("CSVファイルの作成に失敗しました。");
    }
    return $file_id;
  }

  public function createHidenCsv(array $cond)
  {
    $rows = $this->fetchSalesRows($cond);
    $csv  = $this->buildHidenCsv($rows);
    $this->assertNoHtml($csv);

    $prefix  = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path    = $this->getStoragePath($file_id);
    if (!Storage::put($path, $csv)) {
      throw new Exception("CSVファイルの作成に失敗しました。");
    }
    return $file_id;
  }

  public function getStoragePath(string $file_id)
  {
    if (!strpos($file_id, '_')) {
      throw new Exception("Failed get path.");
    }
    [$path, $file_name] = explode('_', $file_id);
    return $this->base_path . $path . DIRECTORY_SEPARATOR . $file_name;
  }

  private function getFileId(string $prefix)
  {
    return $prefix . "_" . Str::random(32);
  }

  private function normalizePeriod(array $cond): array
  {
    $c    = new Collection($cond);
    $from = Carbon::parse($c->get('c_sales_date_from'))->startOfDay();
    $to   = Carbon::parse($c->get('c_sales_date_to'))->addDay()->startOfDay(); // 半開区間 [from, to)
    return [$from, $to];
  }

  /** 指定テーブルに存在する候補列だけを修飾名で返す（例: ["mda.recipient_name"]） */
  private function pickExistingQualified(string $tableName, string $alias, array $candidates): array
  {
    $out = [];
    foreach ($candidates as $col) {
      if (Schema::hasColumn($tableName, $col)) {
        $out[] = "{$alias}.{$col}";
      }
    }
    return $out;
  }

  /** t_sales 用（エイリアス付き） */
  private function pickExistingTS(array $candidates): array
  {
    return $this->pickExistingQualified($this->table, $this->salesAlias, $candidates);
  }

  /** COALESCE(expr1,expr2,...,default) as `alias` を生成（expr は "table.col" の修飾名） */
  private function buildCoalesceAliasFromQualified(string $alias, array $qualifiedExprs, string $default = "''")
  {
    if (empty($qualifiedExprs)) {
      return DB::raw("$default as `{$alias}`");
    }
    $exprs = implode(', ', $qualifiedExprs);
    return DB::raw("COALESCE({$exprs}, {$default}) as `{$alias}`");
  }

  /**
   * 期間＝売上日(sales_at)、発送済み＝shipped_at に値あり の AND 条件で抽出
   * お届け先：
   *   - delivery_id が NOT NULL のときは m_delivery_addresses から
   *       address1 = prefectures + municipality
   *       address2 = number
   *   - delivery_id が NULL のときは t_sales の ship_* → 従来候補にフォールバック
   * 支払方法：t_sales.payment_id → m_payments.name を payment_name として取得
   */
  private function fetchSalesRows(array $cond): \Illuminate\Support\Collection
  {
    [$from, $to] = $this->normalizePeriod($cond);

    // 必須：sales_at / shipped_at
    if (!Schema::hasColumn($this->table, 'sales_at')) {
      throw new Exception("必須カラム sales_at が存在しません。");
    }
    if (!Schema::hasColumn($this->table, 'shipped_at')) {
      throw new Exception("必須カラム shipped_at が存在しません。");
    }

    $ts  = $this->salesAlias; // ts
    $mda = $this->addrAlias;  // mda
    $mp  = $this->paymentAlias; // mp

    // 並び順
    $orderCol = Schema::hasColumn($this->table, 'id') ? "{$ts}.id" : "{$ts}.sales_at";

    // ▼ m_delivery_addresses 側（氏名・郵便・TEL はこれまで通り優先）
    $mdaNameCols  = $this->pickExistingQualified($this->addrTable, $mda, ['recipient_name']);
    $mdaZipCols   = $this->pickExistingQualified($this->addrTable, $mda, ['zip_code','zipcode','postal_code','post_code','zip']);
    $mdaTelCols   = $this->pickExistingQualified($this->addrTable, $mda, ['tel','phone','phone_number','telephone','tel1','mobile']);

    // ▼ t_sales 側 ship_* と従来候補（存在チェックしてから使用）
    $tsShipName  = $this->pickExistingTS(['ship_name','shipping_name','ship_to_name']);
    $tsShipZip   = $this->pickExistingTS(['ship_zip','shipping_zip','ship_to_zip','shipping_zip_code','ship_zip_code']);
    $tsShipAddr1 = $this->pickExistingTS(['ship_address1','shipping_address1','ship_to_address1']);
    $tsShipAddr2 = $this->pickExistingTS(['ship_address2','shipping_address2','ship_to_address2']);
    $tsShipTel   = $this->pickExistingTS(['ship_tel','shipping_tel','ship_to_tel']);

    $tsName  = $this->pickExistingTS(['name','customer_name','delivery_name','receiver_name','recipient_name','to_name','consignee_name']);
    $tsZip   = $this->pickExistingTS(['zip_code','zipcode','post_code','delivery_zip_code','receiver_zip_code','to_zip']);
    $tsAddr1 = $this->pickExistingTS(['address1','delivery_address1','receiver_address1','to_address1','address']);
    $tsAddr2 = $this->pickExistingTS(['address2','delivery_address2','receiver_address2','to_address2','address_line2']);
    $tsTel   = $this->pickExistingTS(['tel','phone','phone_number','telephone','delivery_tel','receiver_tel','to_tel','tel1','mobile','contact_tel']);

    // ▼ 氏名・TEL・郵便番号（mda → ship_* → 従来）
    $nameExpr = $this->buildCoalesceAliasFromQualified('name', array_merge($mdaNameCols, $tsShipName, $tsName));
    $zipExpr  = $this->buildCoalesceAliasFromQualified('zip_code', array_merge($mdaZipCols, $tsShipZip, $tsZip));
    $telExpr  = $this->buildCoalesceAliasFromQualified('tel', array_merge($mdaTelCols, $tsShipTel, $tsTel));

    // ▼ 住所1/2 は「delivery_id が入っていれば mda.prefectures + mda.municipality / mda.number」を強制採用
    $hasPref  = Schema::hasColumn($this->addrTable, 'prefectures');
    $hasCity  = Schema::hasColumn($this->addrTable, 'municipality');
    $hasNum   = Schema::hasColumn($this->addrTable, 'number');

    if ($hasPref && $hasCity && $hasNum) {
      // delivery_id が NOT NULL のとき mda から、NULL のときは従来のCOALESCEにフォールバック
      $addr1Else = $this->buildCoalesceAliasFromQualified('address1', array_merge([], $tsShipAddr1, $tsAddr1));
      $addr2Else = $this->buildCoalesceAliasFromQualified('address2', array_merge([], $tsShipAddr2, $tsAddr2));
      // ただし上の$addr1Else/$addr2Elseは DB::raw なので文字列で再構築
      $addr1ElseSql = str_replace([' as `address1`',' AS `address1`'], '', $addr1Else->getValue(DB::connection()->getQueryGrammar()));
      $addr2ElseSql = str_replace([' as `address2`',' AS `address2`'], '', $addr2Else->getValue(DB::connection()->getQueryGrammar()));

      $addr1Expr = DB::raw(
        "CASE WHEN {$ts}.delivery_id IS NOT NULL " .
        "THEN TRIM(CONCAT(COALESCE({$mda}.prefectures,''), COALESCE({$mda}.municipality,''))) " .
        "ELSE {$addr1ElseSql} END as `address1`"
      );
      $addr2Expr = DB::raw(
        "CASE WHEN {$ts}.delivery_id IS NOT NULL " .
        "THEN COALESCE({$mda}.number,'') " .
        "ELSE {$addr2ElseSql} END as `address2`"
      );
    } else {
      // mda に必要3列が無い環境は、従来のCOALESCE（mda.address1/address2等があればそれも拾う）にフォールバック
      $mdaAddr1Cols = $this->pickExistingQualified($this->addrTable, $mda, ['address1','address_line1','line1','street1','address','prefectures','municipality']);
      $mdaAddr2Cols = $this->pickExistingQualified($this->addrTable, $mda, ['address2','address_line2','line2','street2','building','apartment','room','number']);
      $addr1Expr    = $this->buildCoalesceAliasFromQualified('address1', array_merge($mdaAddr1Cols, $tsShipAddr1, $tsAddr1));
      $addr2Expr    = $this->buildCoalesceAliasFromQualified('address2', array_merge($mdaAddr2Cols, $tsShipAddr2, $tsAddr2));
    }

    // ▼ 支払方法名（payment_name）：t_sales.payment_id → m_payments.name
    $paymentNameExpr = DB::raw("{$mp}.`name` as `payment_name`");

    // ▼ 手数料（fee）は t_sales から（存在する列のみで COALESCE）
    $feeCols  = $this->pickExistingTS(['fee','cod_fee','collect_fee','daibiki_fee']);
    $feeExpr  = $this->buildCoalesceAliasFromQualified('fee', $feeCols, 'NULL');

    // クエリ構築：LEFT JOIN（delivery_id / payment_id が NULL でも ts 側だけで拾える）
    $q = DB::table($this->table . " as {$ts}")
      ->leftJoin($this->addrTable    . " as {$mda}", "{$mda}.id", '=', "{$ts}.delivery_id")
      ->leftJoin($this->paymentTable . " as {$mp}",  "{$mp}.id",  '=', "{$ts}.payment_id")
      ->select([$nameExpr, $zipExpr, $addr1Expr, $addr2Expr, $telExpr, $paymentNameExpr, $feeExpr])
      ->whereBetween("{$ts}.sales_at", [$from->toDateTimeString(), $to->toDateTimeString()])
      ->whereNotNull("{$ts}.shipped_at")
      ->whereRaw("CAST(`{$ts}`.`shipped_at` AS CHAR) <> ''")
      ->whereRaw("CAST(`{$ts}`.`shipped_at` AS CHAR) <> '0000-00-00 00:00:00'")
      ->orderBy($orderCol);

    return $q->get();
  }

  private function toSjisWin(string $s): string
  {
    return mb_convert_encoding($s, "SJIS-win", "UTF-8");
  }

  private function assertNoHtml(string $csv): void
  {
    $lower = strtolower(substr($csv, 0, 4000));
    if (strpos($lower, '<html') !== false || strpos($lower, '<script') !== false || strpos($lower, '<link') !== false) {
      throw new Exception('CSV生成中にHTMLコンテンツが混入しました。Debugbar/dump出力を無効化してください。');
    }
  }

  private function buildB2Csv(\Illuminate\Support\Collection $rows): string
  {
    $config = Config::getSelf();
    $today  = Carbon::now()->format("Y/m/d");

    $csv = "\n";
    foreach ($rows as $row) {
      $csv .= ",";                       // 01
      $csv .= "0,";                      // 02
      $csv .= ",";                       // 03
      $csv .= ",";                       // 04
      $csv .= $today . ",";              // 05
      $csv .= ",";                       // 06
      $csv .= ",";                       // 07
      $csv .= ",";                       // 08
      $csv .= $this->excelText($row->tel ?? "") . ",";          // 09: お届け先電話番号
      $csv .= ",";                       // 10
      $csv .= $this->excelText($row->zip_code ?? "") . ",";     // 11: お届け先郵便番号
      $csv .= (($row->address1) ?: "") . ",";    // 12
      $csv .= $this->excelText($row->address2 ?? "") . ",";     // 13: お届け先アパートマンション名
      $csv .= ",";                       // 14
      $csv .= ",";                       // 15
      $csv .= (($row->name) ?: "") . ",";       // 16
      $csv .= ",";                       // 17
      $csv .= ",";                       // 18
      $csv .= ",";                       // 19
      $csv .= (($config->tel ?? "") ?: "") . ",";      // 20
      $csv .= ",";                       // 21
      $csv .= (($config->zip_code ?? "") ?: "") . ","; // 22
      $csv .= (($config->address1 ?? "") ?: "") . ","; // 23
      $csv .= ",";                       // 24
      $csv .= (($config->company_name ?? "") ?: "") . ","; // 25
      $csv .= ",";                       // 26
      $csv .= ",";                       // 27
      $csv .= "バイクパーツ,";            // 28
      $csv .= ",";                       // 29
      $csv .= ",";                       // 30
      $csv .= ",";                       // 31
      $csv .= ",";                       // 32
      $csv .= ",";                       // 33
      $csv .= ",";                       // 34
      $csv .= ",";                       // 35
      $csv .= ",";                       // 36
      $csv .= ",";                       // 37
      $csv .= ",";                       // 38
      $csv .= ",";                       // 39
      $csv .= "042850479001,";           // 40
      $csv .= ",";                       // 41
      $csv .= "01,";                     // 42
      $csv .= ",";                       // 43
      $csv .= ",";                       // 44
      $csv .= ",";                       // 45
      $csv .= ",";                       // 46
      $csv .= ",";                       // 47
      $csv .= ",";                       // 48
      $csv .= ",";                       // 49
      $csv .= ",";                       // 50
      $csv .= ",";                       // 51
      $csv .= ",";                       // 52
      $csv .= ",";                       // 53
      $csv .= ",";                       // 54
      $csv .= ",";                       // 55
      $csv .= ",";                       // 56
      $csv .= ",";                       // 57
      $csv .= ",";                       // 58
      $csv .= ",";                       // 59
      $csv .= ",";                       // 60
      $csv .= ",";                       // 61
      $csv .= ",";                       // 62
      $csv .= ",";                       // 63
      $csv .= ",";                       // 64
      $csv .= ",";                       // 65
      $csv .= ",";                       // 66
      $csv .= ",";                       // 67
      $csv .= ",";                       // 68
      $csv .= ",";                       // 69
      $csv .= ",";                       // 70
      $csv .= ",";                       // 71
      $csv .= ",";                       // 72
      $csv .= ",";                       // 73
      $csv .= ",";                       // 74
      $csv .= ",";                       // 75
      $csv .= ",";                       // 76
      $csv .= ",";                       // 77
      $csv .= ",";                       // 78
      $csv .= ",";                       // 79
      $csv .= ",";                       // 80
      $csv .= ",";                       // 81
      $csv .= ",";                       // 82
      $csv .= ",";                       // 83
      $csv .= ",";                       // 84
      $csv .= ",";                       // 85
      $csv .= ",";                       // 86
      $csv .= ",";                       // 87
      $csv .= ",";                       // 88
      $csv .= ",";                       // 89
      $csv .= ",";                       // 90
      $csv .= ",";                       // 91
      $csv .= ",";                       // 92
      $csv .= ",";                       // 93
      $csv .= ",";                       // 94
      $csv .= "";                        // 95
      $csv .= "\n";
    }
    return $this->toSjisWin($csv);
  }

  private function buildHidenCsv(\Illuminate\Support\Collection $rows): string
  {
    $config = Config::getSelf();

    $csv = "";
    foreach ($rows as $row) {
      $csv .= $this->excelText($row->tel ?? "") . ",";
      $csv .= $this->excelText($row->zip_code ?? "") . ",";
      $csv .= (($row->address1) ?: "") . ",";            // 4
      $csv .= $this->excelText($row->address2 ?? "") . ",";
      $csv .= ",";                                       // 6
      $csv .= (($row->name) ?: "") . ",";                // 7
      $csv .= ",";                                       // 8
      $csv .= ",";                                       // 9
      $csv .= ",";                                       // 10
      $csv .= ",";                                       // 11
      $csv .= ",";                                       // 12
      $csv .= (($config->tel ?? "") ?: "") . ",";        // 13
      $csv .= (($config->zip_code ?? "") ?: "") . ",";   // 14
      $csv .= (($config->address1 ?? "") ?: "") . ",";   // 15
      $csv .= (($config->address2 ?? "") ?: "") . ",";   // 16
      $csv .= (($config->company_name ?? "") ?: "") . ","; // 17
      $csv .= ",";                                       // 18
      $csv .= ",";                                       // 19
      $csv .= "商品,";                                    // 20
      $csv .= ",";                                       // 21
      $csv .= ",";                                       // 22
      $csv .= ",";                                       // 23
      $csv .= ",";                                       // 24
      $csv .= "1,";                                      // 25
      $csv .= ",";                                       // 26
      $csv .= ",";                                       // 27
      $csv .= ",";                                       // 28
      $csv .= ",";                                       // 29
      $csv .= ",";                                       // 30

      // 31列目：支払方法が「代引/代金引換/COD」のときのみ fee を出力
      $isCod = false;
      if (isset($row->payment_name)) {
        $n = (string)$row->payment_name;
        $isCod = (mb_strpos($n, '代引') !== false)
              || (mb_strpos($n, '代金引換') !== false)
              || (preg_match('/\bCOD\b/i', $n) === 1);
      }
      $csv .= ($isCod ? (($row->fee ?? "")) : "") . ","; // 31

      $csv .= ",";                                       // 32
      $csv .= "0,";                                      // 33
      $csv .= ",";                                       // 34
      $csv .= ",";                                       // 35
      $csv .= ",";                                       // 36
      $csv .= ",";                                       // 37
      $csv .= ",";                                       // 38
      $csv .= ",";                                       // 39
      $csv .= ",";                                       // 40
      $csv .= ",";                                       // 41
      $csv .= "1";                                       // 42
      $csv .= "\n";
    }
    return $this->toSjisWin($csv);
  }

  private function excelText(?string $v): string
  {
    $s = (string)($v ?? '');
    if ($s === '') return '';
    // 先頭'でテキスト扱いにする（Excel上では表示されません）
    return "'" . $s;
  }
}
