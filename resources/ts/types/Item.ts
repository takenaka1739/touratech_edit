/**
 * 
 * 商品 m_items
 // データベースカラム
 * @param id                      - 管理ID
 * @param supplier_id             - 仕入先ID
 * @param supplier_name           - 仕入先名
 * @param code                    - 商品コード
 * @param name                    - 商品名
 * @param item_number             - 品番
 * @param variations1             - バリエーション1
 * @param variations2             - バリエーション2
 * @param variations3             - バリエーション3
 * @param variations4             - バリエーション4
 * @param explanation             - 商品説明
 * @param explanation_details     - 商品説明（詳細）
 * @param name_note               - 商品名（納品書）
 * @param name_label              - 商品名（ラベル用）
 * @param is_sell                 - 販売フラグ
 * @param purchase_price          - 仕入価格
 * @param sales_price             - 販売価格（税込み）
 * @param special_sale_id         - 特売ID
 * @param sales_unit_price        - 売上単価
 * @param purchase_unit_price     - 仕入単価
 * @param sample_price            - サンプル品単価
 * @param is_discontinued         - 廃盤有無
 * @param discontinued_at         - 廃盤日
 * @param is_display              - 確認フラグ
 * @param is_point_rebates        - ポイント還元フラグ
 * @param number_reservations     - 予約可能数
 * @param shipping_pay            - 送料
 * @param is_shipping_fee         - 送料適用フラグ
 * @param is_cash_delivery_fee    - 代引き手数料適用フラグ
 * @param additional_shipping_fee - 別途追加送料
 * @param is_payment_id1          - 支払い方法1フラグ
 * @param is_payment_id2          - 支払い方法2フラグ
 * @param is_payment_id3          - 支払い方法3フラグ
 * @param is_payment_id4          - 支払い方法4フラグ
 * @param is_payment_id5          - 支払い方法5フラグ
 * @param domestic_stocks         - 国内在庫数
 * @param overseas_stocks         - 国外在庫数
 * @param domestic_url            - 国内リンク
 * @param overseas_url            - 国外リンク
 * @param display_status          - 在庫表示
 * @param remarks                 - 備考
 * @param is_set_item             - セット品フラグ
 * @param send_trader             - 業者の送料
 * @param send_personal           - 一般の送料
 // 関連変数
 * @param item_id                 - 商品ID（管理IDと同義、商品を複数扱う際に商品ID格納用）
 * @param variItems               - 管理ID毎のバリエーション配列
 * @param backVariItems           - ユーザー表示用バリエーション配列
 * @param codeList                - 同一商品コードの商品情報リスト

 商品分類 m_categories 関連
 // データベースカラム
 * @param category_id             - 商品分類ID
 * @param category_name           - 商品分類名
 // 関連変数
 * @param categoryList            - 選択された商品の商品分類リスト
 * @param categoryListAll         - 同一商品コードの商品ID全ての商品分類リスト
 
 商品IDと商品分類IDの紐づけテーブル t_category_item_combinations 関連
 // データベースカラム
 * @param combination_id          - 商品IDと商品分類IDの紐づけテーブルの管理ID

 画像 m_images 関連
 // 関連変数
 * @param imageList               - ID毎の画像リスト
 * @param preImageList            - 変更比較用初期値リスト

 特売設定 t_special_sales 関連
 // データベースカラム
 * @param is_sales_members_only   - 会員専用販売フラグ
 * @param start_at                - 特売開始日
 * @param end_at                  - 特売終了日
 * @param special_sale_price      - 特売期間販売価格
 * @param refund_rate             - 還元率の設定（ポイント）
 // 関連変数
 * @param specialSalesList        - 特売設定の初期値
 * @param specialSalesDelFlag     - 特売設定の削除フラグ

 // 取扱説明書設定 m_documents 関連
 // 関連変数
 * @param document_id             - 管理ID
 * @param type_status             - 題目のステータス（0:なし, 1:取扱説明書, 2:サイズ表, 3:その他）
 * @param type_name               - 題目名（0:なし, 1:取扱説明書, 2:サイズ表, 3:任意の名前）
 * @param file_name               - フォイル名
 * @param pdf                     - 備考
 * @param documentFileList        - 商品ID毎のファイルリスト
 */

export interface Item {
  id: number | undefined;
  supplier_id?: number | undefined;
  code: string | undefined;
  name: string | undefined;
  item_number: string | undefined;
  variations1: string | undefined;
  variations2: string | undefined;
  variations3: string | undefined;
  variations4: string | undefined;
  explanation?: string | undefined;
  explanation_details?: string | undefined;
  name_note?: string | undefined;
  name_label?: string | undefined;
  is_sell?: boolean | undefined;
  purchase_price?: number | undefined;
  sales_price: number | undefined;
  special_sale_id?: number | undefined;
  sales_unit_price?: number | undefined;
  purchase_unit_price?: number | undefined;
  sample_price?: number | undefined;
  is_discontinued?: boolean | undefined;
  discontinued_at: string | undefined;
  is_display?: boolean | undefined;
  is_point_rebates?: boolean | undefined;
  number_reservations?: number | undefined;
  shipping_pay?: number | undefined;
  is_shipping_fee?: boolean | undefined;
  is_cash_delivery_fee?: boolean | undefined;
  additional_shipping_fee?: number | undefined;
  is_payment_id1?: boolean | undefined;
  is_payment_id2?: boolean | undefined;
  is_payment_id3?: boolean | undefined;
  is_payment_id4?: boolean | undefined;
  is_payment_id5?: boolean | undefined;
  variItems: string[][];
  backVariItems: string[][];

  category_id?: number | undefined;
  category_name?: string | undefined;
  supplier_name?: string | undefined;
  domestic_stocks?: number | undefined;
  overseas_stocks?: number | undefined;
  domestic_url?: string | undefined;
  overseas_url?: string | undefined;
  display_status: number |undefined;
  remarks?: string | undefined;
  is_set_item: boolean | undefined;
  imageList: any[][];

  item_id: number | undefined;
  is_sales_members_only: boolean | undefined;
  start_at?: string | undefined;
  end_at?: string | undefined;
  special_sale_price?: number | undefined;
  refund_rate?: number | undefined;

  categoryList: any[];
  categoryListAll: any[];
  codeList: any[];
  specialSalesList: any[];
  specialSalesDelFlag: boolean | undefined;
  preImageList: any[][];
  combination_id: number | undefined;
  combIdList: any[];

  send_trader?: number | undefined;
  send_personal?: number | undefined;

  document_id?: number | undefined;
  type_status?: number | undefined;
  type_name?: string | undefined;
  file_name?: string | undefined;
  pdf?: File;
  documentFileList?: any[];
}
