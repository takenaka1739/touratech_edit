/**
 * ページ情報
 *
 * @param currentPage - 現在のページ番号
 * @param lastPage - 最後のページ番号
 * @param perPage - 1ページの行数
 * @param from - 現在のページの最初の行番号
 * @param to - 現在のページの最後の行番号
 * @param total - 総行数
 */
export interface Pager {
  currentPage: number;
  lastPage: number;
  perPage: number;
  from: number;
  to: number;
  total: number;
}
