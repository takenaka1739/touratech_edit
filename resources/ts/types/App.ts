import { Config } from '@/types';

/**
 * アプリケーション
 *
 * @param auth - 権限情報
 * @param config - 環境設定
 */
export type App = {
  auth:
    | {
        name: string;
        role: number;
      }
    | undefined;
  config: Config | undefined;
  initCustomer:
    | {
        name: string;
        fraction: number;
        corporate_class: number;
      }
    | undefined;
};
