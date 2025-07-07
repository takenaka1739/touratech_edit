import React, { useMemo } from 'react';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useShipmentPlanListPage } from '../uses/useShipmentPlanListPage';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';

/**
 * 発送予定一覧画面 Component
 */
export const ShipmentPlanListPage: React.VFC = () => {
  const title = '発送予定一覧';
  const slug = 'shipment_plan';
  const {
    isLoading,
    state,
    errors,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickBulkPurchase,
    onClickPrint,
    onClickPrintNoPrice,
    onChangeSelected,
    onClickSelectButton,
    onClickUnSelectButton,
  } = useShipmentPlanListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td className="text-center">{r.shipment_plan_date}</td>
        <td>
          <div>{r.item_number}</div>
          <div>{r.name}</div>
        </td>
        <td className="text-right">{numberFormat(r.unit_price, 2)}</td>
        <td className="text-right">{numberFormat(r.quantity, 0)}</td>
        <td className="text-right">{numberFormat(r.amount, 2)}</td>
        <td className="text-center"></td>
        <td className="col-btn">
          <input
            type="checkbox"
            name="selected[]"
            checked={state.selected.includes(r.id ?? 0)}
            onChange={onChangeSelected}
            data-id={r.id}
          />
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th className="col-date">到着予定日</th>
            <th>品番・商品名</th>
            <th className="col-amount">単価</th>
            <th className="col-quantity">数量</th>
            <th className="col-amount">金額</th>
            <th className="w-20">仕入データ</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows, state.selected]);
  const disabled = (state.pager?.total ?? 0) === 0;

  return (
    <PageWrapper prefix="purchase-schedule" title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroup
          labelText="到着予定日"
          error={[errors?.c_shipment_plan_date_from ?? '', errors?.c_shipment_plan_date_to ?? '']}
          groupClassName="mt-0"
          required
        >
          <div className="flex">
            <Forms.FormInputDate
              name="c_shipment_plan_date_from"
              value={conditions.c_shipment_plan_date_from}
              error={errors?.c_shipment_plan_date_from}
              onChange={onChange}
            />
            <span className="mx-2">～</span>
            <Forms.FormInputDate
              name="c_shipment_plan_date_to"
              value={conditions.c_shipment_plan_date_to}
              error={errors?.c_shipment_plan_date_to}
              onChange={onChange}
            />
          </div>
        </Forms.FormGroup>
        <div className="max-w-sm mt-2">
          <Forms.FormGroupInputText
            labelText="品番"
            name="c_item_number"
            value={conditions.c_item_number}
            onChange={onChange}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={e => {
              if (e.key === 'Enter' && !composing) {
                onClickSearchButton();
              }
            }}
            maxLength={20}
          />
        </div>
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>

      <div className="flex justify-between mt-2">
        <div>
          <button className="btn" onClick={onClickBulkPurchase} disabled={disabled}>
            一括仕入
          </button>
          <button className="btn ml-6" onClick={onClickPrint} disabled={disabled}>
            ラベル発行
          </button>
          <button className="btn ml-6" onClick={onClickPrintNoPrice} disabled={disabled}>
            ラベル発行(金額なし)
          </button>
        </div>
        <div>
          <button className="btn ml-6" onClick={onClickSelectButton} disabled={disabled}>
            全選択
          </button>
          <button className="btn ml-6" onClick={onClickUnSelectButton} disabled={disabled}>
            全解除
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
