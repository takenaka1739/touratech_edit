import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { usePurchaseListPage } from '../uses/usePurchaseListPage';
import { numberFormat } from '@/utils';
import { useComposing } from '@/uses';

/**
 * 仕入データ（一覧）画面 Component
 */
export const PurchaseListPage: React.VFC = () => {
  const title = '仕入データ';
  const slug = 'purchase';
  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  } = usePurchaseListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td className="text-center">{r.purchase_date}</td>
        <td>{r.user_name}</td>
        <td className="text-right">{numberFormat(r.total_amount, 0)}</td>
        <td className="col-btn">
          <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th className="col-date">仕入日</th>
            <th>担当者</th>
            <th className="col-amount">金額</th>
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
        <Forms.FormGroup labelText="仕入日" removeOptionalLabel>
          <div className="flex">
            <Forms.FormInputDate
              name="c_purchase_date_from"
              value={conditions.c_purchase_date_from}
              onChange={onChange}
            />
            <span className="mx-2">～</span>
            <Forms.FormInputDate
              name="c_purchase_date_to"
              value={conditions.c_purchase_date_to}
              onChange={onChange}
            />
          </div>
        </Forms.FormGroup>
        <div className="flex">
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
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
      <div className="mt-2">
        <button className="btn" onClick={addDetail}>
          新規追加
        </button>
      </div>
    </PageWrapper>
  );
};
