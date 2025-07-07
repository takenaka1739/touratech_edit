/**
 * 商品の国外、国内URLテンプレート
 *
 * #item_number# の部分は品番に置換
 */
export const TEMPLATE_ITEM_URLS: {
  template_domestic_url: string;
  template_overseas_url: string;
} = {
  template_domestic_url:
    'https://www.touratechjapan.com/e-commex/cgi-bin/ex_disp_item_detail/id/#item_number#/',
  template_overseas_url: 'https://www.touratech.com/catalogsearch/result/?q=#item_number#',
};
