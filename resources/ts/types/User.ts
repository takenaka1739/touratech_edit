/**
 * 担当者
 *
 * @param id - ID
 * @param name - 担当者名
 * @param login_id - ログインID
 * @param password - パスワード
 * @param role - 権限 0:一般、1:管理者
 */
export interface User {
  id: number | undefined;
  name: string | undefined;
  login_id: string | undefined;
  password: string | undefined;
  role: number | undefined;
}
