import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useSalesListPage } from '@/app/Sales/uses/useSalesListPage';
import { numberFormat } from '@/utils';
import { useComposing } from '@/uses';

/**
 * 売上データ（一覧）画面 Component
 */
export const SalesListPage: React.VFC = () => {
  const title = '売上データ';
  const slug = 'sales';
  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
    onClickOutput,
    isDisabled,
  } = useSalesListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td className="text-center">{r.sales_date}</td>
        <td>{r.customer_name ?? '上様'}</td>
        <td>{r.user_name}</td>
        <td className="text-right">{numberFormat(r.total_amount, 0)}</td>
        <td className="text-center">{r.has_invoice ? '〇' : ''}</td>
        <td className="col-btn">
          <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th className="col-date">売上日</th>
            <th>得意先</th>
            <th className="w-40">担当者</th>
            <th className="col-amount">金額</th>
            <th className="w-16">請求</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroup labelText="売上日" removeOptionalLabel>
          <div className="flex">
            <Forms.FormInputDate
              name="c_sales_date_from"
              value={conditions.c_sales_date_from}
              onChange={onChange}
            />
            <span className="mx-2">～</span>
            <Forms.FormInputDate
              name="c_sales_date_to"
              value={conditions.c_sales_date_to}
              onChange={onChange}
            />
          </div>
        </Forms.FormGroup>
        <div className="flex">
          <div className="w-1/2 max-w-sm mt-2 pr-4">
            <Forms.FormGroupInputText
              labelText="得意先"
              name="c_customer_name"
              value={conditions.c_customer_name}
              onChange={onChange}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={e => {
                if (e.key === 'Enter' && !composing) {
                  onClickSearchButton();
                }
              }}
              maxLength={20}
              removeOptionalLabel
            />
          </div>
          <div className="w-1/2 max-w-sm mt-2 pr-4">
            <Forms.FormGroupInputText
              labelText="担当者"
              name="c_user_name"
              value={conditions.c_user_name}
              onChange={onChange}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={e => {
                if (e.key === 'Enter' && !composing) {
                  onClickSearchButton();
                }
              }}
              maxLength={20}
              removeOptionalLabel
            />
          </div>
        </div>
        <div className="flex">
          <div className="w-1/2 max-w-sm mt-2 pr-4">
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
              removeOptionalLabel
            />
          </div>
          <div className="w-1/2 max-w-sm mt-2 pr-4">
            <Forms.FormGroupInputText
              labelText="品名"
              name="c_name"
              value={conditions.c_name}
              onChange={onChange}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={e => {
                if (e.key === 'Enter' && !composing) {
                  onClickSearchButton();
                }
              }}
              maxLength={20}
              removeOptionalLabel
            />
          </div>
        </div>
        <div className="max-w-sm mt-2 pr-4">
          <Forms.FormGroupInputText
            labelText="注文番号"
            name="c_order_no"
            value={conditions.c_order_no}
            onChange={onChange}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={e => {
              if (e.key === 'Enter' && !composing) {
                onClickSearchButton();
              }
            }}
            maxLength={20}
            removeOptionalLabel
          />
        </div>
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
      <div className="mt-2">
        <button className="btn" onClick={addDetail}>
          新規追加
        </button>
        <button className="btn ml-6" onClick={onClickOutput} disabled={isDisabled}>
          エクセル出力
        </button>
      </div>
    </PageWrapper>
  );
};
