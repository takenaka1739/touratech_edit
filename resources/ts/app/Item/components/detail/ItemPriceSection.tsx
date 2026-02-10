import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: string | number | boolean | undefined) => void;
};

/**
 * 商品マスタの「価格情報」入力セクション。
 *
 * - 売上単価
 * - 仕入単価
 * - サンプル品単価
 */
export const ItemPriceSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap max-w-2xl">
      {/* 不要なので削除しても構わないとの顧客要望（削除の場合は影響確認が必要なためコメントアウトで対応
      <div className="w-1/2">
        <Forms.FormGroupInputNumber
          labelText="売上単価"
          name="sales_unit_price"
          value={state.sales_unit_price}
          error={errors?.sales_unit_price}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
        />
      </div>
      */}

      <div className="w-1/2">
        <Forms.FormGroupInputNumber
          labelText="仕入単価"
          name="purchase_unit_price"
          value={state.purchase_unit_price}
          error={errors?.purchase_unit_price}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
          required
        />
      </div>

      <div className="w-1/2">
        <Forms.FormGroupInputNumber
          labelText="サンプル品単価"
          name="sample_price"
          value={state.sample_price}
          error={errors?.sample_price}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
        />
      </div>
    </div>
  );
};
