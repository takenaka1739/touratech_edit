import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { usePlaceOrderListPage } from '../uses/usePlaceOrderListPage';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';

/**
 * 発注データ（一覧）画面 Component
 */
export const PlaceOrderListPage: React.VFC = () => {
  const title = '発注データ';
  const slug = 'place_order';
  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
  } = usePlaceOrderListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td className="text-center">{r.place_order_date}</td>
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
            <th className="col-date">注文日</th>
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
        <div className="flex">
          <div className="w-1/2 max-w-sm pr-4">
            <Forms.FormGroup labelText="注文日" removeOptionalLabel>
              <div className="flex">
                <Forms.FormInputDate
                  name="c_place_order_date_from"
                  value={conditions.c_place_order_date_from}
                  onChange={onChange}
                />
                <span className="mx-2">～</span>
                <Forms.FormInputDate
                  name="c_place_order_date_to"
                  value={conditions.c_place_order_date_to}
                  onChange={onChange}
                />
              </div>
            </Forms.FormGroup>
          </div>
          <div className="w-1/2 max-w-sm pr-4">
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
        <div className="mt-2">
          <Forms.FormGroupInputRadio
            labelText="仕入"
            name="c_is_purchased"
            value={conditions.c_is_purchased}
            onChange={onChange}
            items={[
              {
                labelText: 'すべて',
                id: 'c_is_purchased_none',
                value: 'none',
              },
              {
                labelText: '仕入済のみ',
                id: 'c_is_purchased_1',
                value: '1',
              },
              {
                labelText: '未仕入のみ',
                id: 'c_is_purchased_0',
                value: '0',
              },
            ]}
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
      </div>
    </PageWrapper>
  );
};
