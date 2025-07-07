/**
 * ヘッダーのmeta情報からcsrf用のトークンを取得する
 */
export const getCsrfToken: () => string = () => {
  return document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
};
