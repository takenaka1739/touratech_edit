import { useCallback } from 'react';

type UseItemSalesPriceArgs = {
  setState: React.Dispatch<React.SetStateAction<any>>;
  setErrors: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * 商品マスタの「販売価格（税込）」用フックス。
 *
 * - 商品本体の販売価格のみを更新
 * - バリエーション価格は扱わない（責務分離）
 * - エラーメッセージのクリア
 */
export const useItemSalesPrice = ({
  setState,
  setErrors,
}: UseItemSalesPriceArgs) => {

  const salesPriceChange = useCallback(
    (value: string | number | boolean | undefined) => {
      const priceNumber =
        value === undefined || value === null || value === '' ? null : Number(value);

      // --------------------------------------------------------------
      // 商品本体の販売価格のみ更新（variItems は触らない）
      // --------------------------------------------------------------
      setState((prev: any) => ({
        ...prev,
        sales_price: priceNumber,
      }));

      // --------------------------------------------------------------
      // エラーメッセージのクリア
      // --------------------------------------------------------------
      setErrors((prev: any) => ({
        ...prev,
        sales_price: null,
      }));
    },
    [setState, setErrors]
  );

  return {
    salesPriceChange,
  };
};
