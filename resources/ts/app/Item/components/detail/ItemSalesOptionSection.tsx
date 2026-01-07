import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  salesPriceChange: (value: string | number | boolean | undefined) => void;
  backColor: string;
  onChangePayment: (name: string, value: boolean) => void;
};

/**
 * 商品マスタの「販売オプション」入力セクション。
 *
 * - 販売価格（税込）
 * - 仕入価格
 * - 予約受付数
 * - 送料適用 / 送料 / 追加送料
 * - 代引手数料適用
 * - ポイント還元
 * - 支払い方法（現金 / 売掛 / 宅配代引 / 銀行振込 / クレジットカード）
 */
export const ItemSalesOptionSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
  salesPriceChange,
  backColor,
  onChangePayment,
}) => {
  return (
    <>
      {/* 販売価格（税込） */}
      <div className="price-erea" style={{ marginLeft: '1px', marginTop: '10px' }}>
        <Forms.FormGroupInputNumber
          labelText="販売価格（税込）"
          name="sales_price"
          value={state.sales_price}
          error={errors?.sales_price}
          onChange={(_name, value) => salesPriceChange(value)}
          precision={2}
          className="max-w-8"
          min={0}
          disabled={state.isVariationEditable}
          style={{ backgroundColor: backColor }}
          required
        />
      </div>

      {/* 仕入価格 */}
      <Forms.FormGroupInputNumber
        labelText="仕入価格"
        name="purchase_price"
        value={state.purchase_price}
        error={errors?.purchase_price}
        onChange={onChange}
        precision={2}
        className="max-w-8"
        min={0}
      />

      {/* 予約受付数 */}
      <Forms.FormGroupInputNumber
        labelText="予約受付数"
        name="number_reservations"
        value={state.number_reservations}
        error={errors?.number_reservations}
        onChange={onChange}
        precision={2}
        className="max-w-8"
        min={0}
      />

      {/* 送料適用 */}
      <Forms.FormGroup
        labelText="送料適用"
        error={errors?.is_shipping_fee}
        groupClassName="items-center my-1"
      >
        <Forms.FormInputCheck
          id="is_shipping_fee"
          name="is_shipping_fee"
          checked={state.is_shipping_fee}
          onChange={onChange}
        />
      </Forms.FormGroup>

      {/* 送料 */}
      <Forms.FormGroupInputNumber
        labelText="送料"
        name="shipping_pay"
        value={state.shipping_pay}
        error={errors?.shipping_pay}
        onChange={onChange}
        precision={2}
        className="max-w-8"
        min={0}
      />

      {/* 別途追加送料 */}
      <Forms.FormGroupInputNumber
        labelText="別途追加送料"
        name="additional_shipping_fee"
        value={state.additional_shipping_fee}
        error={errors?.additional_shipping_fee}
        onChange={onChange}
        precision={2}
        className="max-w-8"
        min={0}
      />

      {/* 代引手数料適用 */}
      <Forms.FormGroup
        labelText="代引手数料適用"
        error={errors?.is_cash_delivery_fee}
        groupClassName="items-center my-1"
      >
        <Forms.FormInputCheck
          id="is_cash_delivery_fee"
          name="is_cash_delivery_fee"
          checked={state.is_cash_delivery_fee}
          onChange={onChange}
        />
      </Forms.FormGroup>

      {/* ポイント還元 */}
      <Forms.FormGroup
        labelText="ポイント還元"
        error={errors?.is_point_rebates}
        groupClassName="items-center mt-4"
      >
        <Forms.FormInputCheck
          id="is_point_rebates"
          name="is_point_rebates"
          checked={state.is_point_rebates}
          onChange={onChange}
        />
      </Forms.FormGroup>

      {/* 支払い方法 */}
      <Forms.FormGroup
        labelText="支払い方法"
        groupClassName="items-start mt-4"
        required={true}
        error={errors?.payErrorMessage}
      >
        <div className="payment-kind" style={{ display: 'flex' }}>
          <Forms.FormInputCheck
            id="is_payment_id1"
            name="is_payment_id1"
            labelText="現金"
            checked={state.is_payment_id1}
            onChange={(name, value) => onChangePayment(name, value === true || value === "true")}
          />
          <Forms.FormInputCheck
            id="is_payment_id2"
            name="is_payment_id2"
            labelText="売掛"
            checked={state.is_payment_id2}
            onChange={(name, value) => onChangePayment(name, value === true)}
          />
          <Forms.FormInputCheck
            id="is_payment_id3"
            name="is_payment_id3"
            labelText="宅配代引"
            checked={state.is_payment_id3}
            onChange={(name, value) => onChangePayment(name, value === true)}
          />
          <Forms.FormInputCheck
            id="is_payment_id4"
            name="is_payment_id4"
            labelText="銀行振込"
            checked={state.is_payment_id4}
            onChange={(name, value) => onChangePayment(name, value === true)}
          />
          <Forms.FormInputCheck
            id="is_payment_id5"
            name="is_payment_id5"
            labelText="クレジットカード"
            checked={state.is_payment_id5}
            onChange={(name, value) => onChangePayment(name, value === true)}
          />
        </div>
      </Forms.FormGroup>
    </>
  );
};
