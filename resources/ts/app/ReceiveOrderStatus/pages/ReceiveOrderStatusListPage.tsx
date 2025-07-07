import React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, Forms } from '@/components';
import { useReceiveOrderStatusListPage } from '../uses/useReceiveOrderStatusListPage';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';

/**
 * 受注一覧／処理画面 Component
 */
export const ReceiveOrderStatusListPage: React.VFC = () => {
  const title = '受注一覧／処理';
  const slug = 'receive_order_status';
  const {
    isLoading,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
  } = useReceiveOrderStatusListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(
    () =>
      state.rows.map(r => {
        return (
          <tr key={r.receive_order_detail_id}>
            <td className="text-center">{r.receive_order_date}</td>
            <td>{r.customer_name ?? '上様'}</td>
            <td>
              <div>{r.item_number}</div>
              <div>{r.item_name}</div>
              <div>{r.item_name_jp}</div>
            </td>
            <td>{r.answer_date}</td>
            <td className="w-16 text-right">{numberFormat(r.quantity, 0)}</td>
            <td className="w-20 text-right">{numberFormat(r.domestic_stock ?? 0, 0)}</td>
            <td className="col-btn">
              {r.place_completed != 1 && (
                <Link to={`/place_order/detail_by_receive_id/${r.id}`}>発注</Link>
              )}
            </td>
            <td className="col-btn">
              {((r.sales_completed != 1 && (r.domestic_stock ?? 0) != 0) || r.item_kind == 2) && (
                <Link to={`/sales/detail_by_receive_id/${r.id}`}>売上</Link>
              )}
            </td>
          </tr>
        );
      }),
    [state.rows]
  );

  return (
    <PageWrapper prefix="receive-order-status" title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroup labelText="受注日" removeOptionalLabel>
          <div className="flex">
            <Forms.FormInputDate
              name="c_receive_order_date_from"
              value={conditions.c_receive_order_date_from}
              onChange={onChange}
            />
            <span className="mx-2">～</span>
            <Forms.FormInputDate
              name="c_receive_order_date_to"
              value={conditions.c_receive_order_date_to}
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

      <div className="table">
        {!isLoading && (
          <table>
            <thead>
              <tr>
                <th className="col-date">受注日</th>
                <th className="w-48">得意先</th>
                <th>品番・商品名</th>
                <th className="w-28">回答納期</th>
                <th className="w-16 col-quantity">注文数</th>
                <th className="w-20">在庫数</th>
                <th className="col-btn">発注</th>
                <th className="col-btn">売上</th>
              </tr>
            </thead>
            <tbody>{tables}</tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
};
