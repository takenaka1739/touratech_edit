type MenuItem = {
  name: string;
  url: string;
  className?: string | undefined;
};

/**
 * メニュー定数
 */
export const APP_MENU: {
  slip: MenuItem[];
  capture: MenuItem[];
  monthClosing: MenuItem[];
  inventory: MenuItem[];
  master: MenuItem[];
} = {
  slip: [
    { name: '見積データ', url: '/estimate' },
    { name: '受注詳細／編集', url: '/receive_order' },
    { name: '受注一覧／処理', url: '/receive_order_status' },
    { name: '売上データ', url: '/sales' },
    { name: '売上出力', url: '/hiden' },
    { name: '発注データ', url: '/place_order' },
    { name: '発注CSV出力', url: '/place_order_export' },
    { name: '発送予定取込', url: '/shipment_plan_import' },
    { name: '発送予定一覧', url: '/shipment_plan' },
    { name: '仕入データ', url: '/purchase' },
  ],
  capture: [{ name: '本国商品データ取込', url: '/home_data_import' }],
  monthClosing: [
    { name: '請求データ', url: '/invoice' },
    { name: '入金データ', url: '/receipt' },
  ],
  inventory: [
    { name: '棚卸処理', url: '/inventory_import' },
    { name: '在庫表印刷', url: '/inventory_printing' },
  ],
  master: [
    { name: '担当者マスタ', url: '/user' },
    { name: '仕入先マスタ', url: '/supplier' },
    { name: '得意先マスタ', url: '/customer' },
    { name: '商品分類マスタ', url: '/item_classification' },
    { name: '商品マスタ', url: '/item' },
    { name: 'セット品マスタ', url: '/set_item' },
    { name: '環境設定', url: '/config', className: 'pt-4' },
  ],
};
