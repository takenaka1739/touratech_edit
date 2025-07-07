import React, { useMemo } from 'react';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useInvoiceListPage } from '../uses/useInvoiceListPage';
import { numberFormat } from '@/utils/numberFormat';

/**
 * 請求データ一覧画面 Component
 */
export const InvoiceListPage: React.VFC = () => {
  const title = '請求データ一覧';
  const slug = 'invoice';
  const {
    isLoading,
    state,
    errors,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickClosing,
    onClickPrintInvoice,
    onClickPrintList,
    onChangeSelected,
    onClickSelectButton,
    onClickUnSelectButton,
    onClickCancelClosing,
  } = useInvoiceListPage(slug);

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td className="text-center">{r.invoice_month}</td>
        <td>{r.customer_name}</td>
        <td className="text-right">{numberFormat(r.pre_amount, 0)}</td>
        <td className="text-right">{numberFormat(r.total_receipt, 0)}</td>
        <td className="text-right">{numberFormat(r.total_amount, 0)}</td>
        <td className="text-right">{numberFormat(r.total_invoice, 0)}</td>
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
            <th className="col-date">請求月</th>
            <th>得意先</th>
            <th className="col-amount">前回請求額</th>
            <th className="col-amount">入金額</th>
            <th className="col-amount">買上計</th>
            <th className="col-amount">今回請求額</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows, state.selected, onChangeSelected]);
  const disabled = (state.pager?.total ?? 0) === 0;

  return (
    <PageWrapper prefix="purchase-schedule" title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <div className="flex">
          <div>
            <Forms.FormGroupInputMonth
              labelText="請求月"
              name="c_invoice_month"
              value={conditions.c_invoice_month}
              error={errors?.c_invoice_month}
              onChange={onChange}
              required
            />
          </div>
          <div>
            <Forms.FormGroupInputNumber
              labelText="締日"
              name="c_cutoff_date"
              value={conditions.c_cutoff_date}
              error={errors?.c_cutoff_date}
              onChange={onChange}
              precision={0}
              className="max-w-5"
              groupClassName="mt-0"
              min={1}
              max={31}
            />
          </div>
        </div>
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>

      <div className="flex justify-between mt-2">
        <div>
          <button className="btn" onClick={onClickClosing}>
            月締処理
          </button>
          <button className="btn ml-6" onClick={onClickPrintInvoice} disabled={disabled}>
            請求書発行
          </button>
          <button className="btn ml-6" onClick={onClickPrintList} disabled={disabled}>
            一覧出力
          </button>
        </div>
        <div>
          <button className="btn ml-6" onClick={onClickSelectButton} disabled={disabled}>
            全選択
          </button>
          <button className="btn ml-6" onClick={onClickUnSelectButton} disabled={disabled}>
            全解除
          </button>
          <button className="btn ml-6" onClick={onClickCancelClosing} disabled={disabled}>
            締取消
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
