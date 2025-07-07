<?php

namespace App\Api\Hiden\Services;

use App\Base\Models\Config;
use App\Base\Models\Sales;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Exception;

/**
 * 売上飛伝出力サービス
 */
class HidenService
{
  /** @var string */
  protected $base_path;

  public function __construct()
  {
    $this->base_path = config('const.paths.hiden.output_path');
  }

  /**
   * CSVを作成する(ヤマトB2)
   *
   * @param array $cond 条件
   * @return string
   */
  public function createB2Csv(array $cond)
  {
    // 売上データCSVを取得する
    $csv = $this->getSalesB2Csv($cond);

    $prefix = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path = $this->getStoragePath($file_id);
    if (Storage::put($path, $csv)) {
      return $file_id;
    } else {
      throw new Exception("CSVファイルの作成に失敗しました。");
    }
  }

  /**
   * CSVを作成する(e飛伝2)
   *
   * @param array $cond 条件
   * @return string
   */
  public function createHidenCsv(array $cond)
  {
    // 売上データCSVを取得する
    $csv = $this->getSalesHidenCsv($cond);

    $prefix = Carbon::now()->format('Ymd');
    $file_id = $this->getFileId($prefix);
    $path = $this->getStoragePath($file_id);
    if (Storage::put($path, $csv)) {
      return $file_id;
    } else {
      throw new Exception("CSVファイルの作成に失敗しました。");
    }
  }

  /**
   * パスを取得する
   *
   * @param string $file_id
   * @return string
   */
  public function getStoragePath(string $file_id)
  {
    if (!strpos($file_id, '_')) {
      throw new Exception("Failed get path.");
    }

    list($path, $file_name) = explode('_', $file_id);
    return $this->base_path . $path . DIRECTORY_SEPARATOR . $file_name;
  }

  /**
   * ファイルIDを取得する
   *
   * @param string $prefix
   * @return string
   */
  private function getFileId(string $prefix)
  {
    return $prefix . "_" . Str::random(32);
  }

  /**
   * 売上データCSVを取得する(ヤマトB2)
   *
   * @param array $cond
   * @return string
   */
  private function getSalesB2Csv(array $cond)
  {
    $cond = new Collection($cond);
    $sales_date_from = $cond->get('c_sales_date_from');
    $sales_date_to = $cond->get('c_sales_date_to');

    $sales_date_to = new Carbon($sales_date_to);

    $config = Config::getSelf();

    $rows = Sales::select([
      'name',
      'zip_code',
      'address1',
      'address2',
      'tel',
      'corporate_class',
    ])
      ->where('sales_date', '>=', $sales_date_from)
      ->where('sales_date', '<', $sales_date_to->addDay())
      ->where('send_flg', 1)
      ->orderBy('id')
      ->get();

    $dt = new Carbon();
    $today = $dt->format("Y/m/d");

    $csv = "\n";
    foreach ($rows as $row) {
      $csv .= ",";                                    // 01:お客様管理番号
      $csv .= "0,";                                   // 02:送り状種類 ※必須
      $csv .= ",";                                    // 03:クール区分
      $csv .= ",";                                    // 04:伝票番号
      $csv .= $today . ",";                           // 05:出荷予定日 ※必須
      $csv .= ",";                                    // 06:お届け予定日
      $csv .= ",";                                    // 07:配達時間帯
      $csv .= ",";                                    // 08:お届け先コード
      $csv .= ($row->tel ?? "") . ",";                // 09:お届け先電話番号 ※必須
      $csv .= ",";                                    // 10:お届け先電話番号枝番
      $csv .= ($row->zip_code ?? "") . ",";           // 11:お届け先郵便番号 ※必須
      $csv .= ($row->address1 ?? "") . ",";           // 12:お届け先住所 ※必須
      $csv .= ($row->address2 ?? "") . ",";           // 13:お届け先アパートマンション名
      $csv .= ",";                                    // 14:お届け先会社・部門１
      $csv .= ",";                                    // 15:お届け先会社・部門２
      $csv .= ($row->name ?? "") . ",";               // 16:お届け先名 ※必須
      $csv .= ",";                                    // 17:お届け先名(ｶﾅ)
      $csv .= ",";                                    // 18:敬称
      $csv .= ",";                                    // 19:ご依頼主コード
      $csv .= ($config->tel ?? "") . ",";             // 20:ご依頼主電話番号 ※必須
      $csv .= ",";                                    // 21:ご依頼主電話番号枝番
      $csv .= ($config->zip_code ?? "") . ",";        // 22:ご依頼主郵便番号 ※必須
      $csv .= ($config->address1 ?? "") . ",";        // 23:ご依頼主住所 ※必須
      $csv .= ",";                                    // 24:ご依頼主アパートマンション
      $csv .= ($config->company_name ?? "") . ",";    // 25:ご依頼主名 ※必須
      $csv .= ",";                                    // 26:ご依頼主名(ｶﾅ)
      $csv .= ",";                                    // 27:品名コード１
      $csv .= "バイクパーツ,";                         // 28:品名１ ※必須
      $csv .= ",";                                    // 29:品名コード２
      $csv .= ",";                                    // 30:品名２
      $csv .= ",";                                    // 31:荷扱い１
      $csv .= ",";                                    // 32:荷扱い２
      $csv .= ",";                                    // 33:記事
      $csv .= ",";                                    // 34:ｺﾚｸﾄ代金引換額（税込)
      $csv .= ",";                                    // 35:内消費税額等
      $csv .= ",";                                    // 36:止置き
      $csv .= ",";                                    // 37:営業所コード
      $csv .= ",";                                    // 38:発行枚数
      $csv .= ",";                                    // 39:個数口表示フラグ
      $csv .= "042850479001,";                        // 40:請求先顧客コード ※必須
      $csv .= ",";                                    // 41:請求先分類コード
      $csv .= "01,";                                  // 42:運賃管理番号 ※必須
      $csv .= ",";                                    // 43:クロネコwebコレクトデータ登録
      $csv .= ",";                                    // 44:クロネコwebコレクト加盟店番号
      $csv .= ",";                                    // 45:クロネコwebコレクト申込受付番号１
      $csv .= ",";                                    // 46:クロネコwebコレクト申込受付番号２
      $csv .= ",";                                    // 47:クロネコwebコレクト申込受付番号３
      $csv .= ",";                                    // 48:お届け予定ｅメール利用区分
      $csv .= ",";                                    // 49:お届け予定ｅメールe-mailアドレス
      $csv .= ",";                                    // 50:入力機種
      $csv .= ",";                                    // 51:お届け予定ｅメールメッセージ
      $csv .= ",";                                    // 52:お届け完了ｅメール利用区分
      $csv .= ",";                                    // 53:お届け完了ｅメールe-mailアドレス
      $csv .= ",";                                    // 54:お届け完了ｅメールメッセージ
      $csv .= ",";                                    // 55:クロネコ収納代行利用区分
      $csv .= ",";                                    // 56:予備
      $csv .= ",";                                    // 57:収納代行請求金額(税込)
      $csv .= ",";                                    // 58:収納代行内消費税額等
      $csv .= ",";                                    // 59:収納代行請求先郵便番号
      $csv .= ",";                                    // 60:収納代行請求先住所
      $csv .= ",";                                    // 61:収納代行請求先住所（アパートマンション名）
      $csv .= ",";                                    // 62:収納代行請求先会社・部門名１
      $csv .= ",";                                    // 63:収納代行請求先会社・部門名２
      $csv .= ",";                                    // 64:収納代行請求先名(漢字)
      $csv .= ",";                                    // 65:収納代行請求先名(カナ)
      $csv .= ",";                                    // 66:収納代行問合せ先名(漢字)
      $csv .= ",";                                    // 67:収納代行問合せ先郵便番号
      $csv .= ",";                                    // 68:収納代行問合せ先住所
      $csv .= ",";                                    // 69:収納代行問合せ先住所（アパートマンション名）
      $csv .= ",";                                    // 70:収納代行問合せ先電話番号
      $csv .= ",";                                    // 71:収納代行管理番号
      $csv .= ",";                                    // 72:収納代行品名
      $csv .= ",";                                    // 73:収納代行備考
      $csv .= ",";                                    // 74:複数口くくりキー
      $csv .= ",";                                    // 75:検索キータイトル1
      $csv .= ",";                                    // 76:検索キー1
      $csv .= ",";                                    // 77:検索キータイトル2
      $csv .= ",";                                    // 78:検索キー2
      $csv .= ",";                                    // 79:検索キータイトル3
      $csv .= ",";                                    // 80:検索キー3
      $csv .= ",";                                    // 81:検索キータイトル4
      $csv .= ",";                                    // 82:検索キー4
      $csv .= ",";                                    // 83:検索キータイトル5
      $csv .= ",";                                    // 84:検索キー5
      $csv .= ",";                                    // 85:予備
      $csv .= ",";                                    // 86:予備
      $csv .= ",";                                    // 87:投函予定メール利用区分
      $csv .= ",";                                    // 88:投函予定メールe-mailアドレス
      $csv .= ",";                                    // 89:投函予定メールメッセージ
      $csv .= ",";                                    // 90:投函完了メール（お届け先宛）利用区分
      $csv .= ",";                                    // 91:投函完了メール（お届け先宛）e-mailアドレス
      $csv .= ",";                                    // 92:投函完了メール（お届け先宛）メールメッセージ
      $csv .= ",";                                    // 93:投函完了メール（ご依頼主宛）利用区分
      $csv .= ",";                                    // 94:投函完了メール（ご依頼主宛）e-mailアドレス
      $csv .= "";                                     // 95:投函完了メール（ご依頼主宛）メールメッセージ
      $csv .= "\n";
    }
    $csv = mb_convert_encoding($csv, "SJIS-win");
    return $csv;
  }

  /**
   * 売上データCSVを取得する(e飛伝2)
   *
   * @param array $cond
   * @return string
   */
  private function getSalesHidenCsv(array $cond)
  {
    $cond = new Collection($cond);
    $sales_date_from = $cond->get('c_sales_date_from');
    $sales_date_to = $cond->get('c_sales_date_to');

    $sales_date_to = new Carbon($sales_date_to);

    $config = Config::getSelf();

    $rows = Sales::select([
      'name',
      'zip_code',
      'address1',
      'address2',
      'tel',
      'corporate_class',
    ])
      ->where('sales_date', '>=', $sales_date_from)
      ->where('sales_date', '<', $sales_date_to->addDay())
      ->where('send_flg', 1)
      ->orderBy('id')
      ->get();

    $csv = "";
    foreach ($rows as $row) {
      // $csv .= ",";  // 1
      $csv .= ($row->tel ?? "") . ",";  // 2
      $csv .= ($row->zip_code ?? "") . ",";  // 3
      $csv .= ($row->address1 ?? "") . ",";  // 4
      $csv .= ($row->address2 ?? "") . ",";  // 5
      $csv .= ",";  // 6
      $csv .= ($row->name ?? "") . ","; // 7
      $csv .= ",";  //8
      $csv .= ",";  // 9
      $csv .= ",";  // 10
      $csv .= ",";  // 11
      $csv .= ",";  // 12
      $csv .= ($config->tel ?? "") . ",";  // 13
      $csv .= ($config->zip_code ?? "") . ",";  // 14
      $csv .= ($config->address1 ?? "") . ",";  // 15
      $csv .= ($config->address2 ?? "") . ",";  // 16
      $csv .= ($config->company_name ?? "") . ",";  // 17
      $csv .= ",";  // 18
      $csv .= ",";  // 19
      $csv .= "商品,";  // 20
      $csv .= ",";  // 21
      $csv .= ",";  // 22
      $csv .= ",";  // 23
      $csv .= ",";  // 24
      $csv .= "1,";  // 25
      $csv .= ",";  // 26
      $csv .= ",";  // 27
      $csv .= ",";  // 28
      $csv .= ",";  // 29
      $csv .= ",";  // 30
      $csv .= ($row->corporate_class == 2 ? $row->fee : "") . ",";  // 31
      $csv .= ",";  // 32
      $csv .= "0,";  // 33
      $csv .= ",";  // 34
      $csv .= ",";  // 35
      $csv .= ",";  // 36
      $csv .= ",";  // 37
      $csv .= ",";  // 38
      $csv .= ",";  // 39
      $csv .= ",";  // 40
      $csv .= ",";  // 41
      $csv .= "1";  // 42
      $csv .= "\n";
    }
    $csv = mb_convert_encoding($csv, "SJIS-win");
    return $csv;
  }
}