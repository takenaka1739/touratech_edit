import React, { useMemo } from 'react';
import { ReceiveOrder } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';
import { addMonths, format, startOfMonth } from 'date-fns';

const c_receive_order_date_from = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM/dd');

type ReceiveOrderSearchDialogProps = {
  isShown: boolean;
  onSelected: (props: ReceiveOrder) => void;
  onCancel: () => void;
};

type ReceiveOrderSearchDialogConditionsState = {
  c_receive_order_date_from?: string;
  c_receive_order_date_to?: string;
  c_customer_name?: string | undefined;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  c_order_no?: string | undefined;
  page: number;
};

/**
 * 受注検索画面 Component
 */
export const ReceiveOrderSearchDialog: React.VFC<ReceiveOrderSearchDialogProps> = ({
  isShown,
  onSelected,
  onCancel,
}) => {
  const {
    state,
    conditions,
    isLoading,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    onClickSelect,
    onClickCancel,
  } = useCommonSearchDialog<ReceiveOrderSearchDialogConditionsState, ReceiveOrder>(
    {
      c_receive_order_date_from: c_receive_order_date_from,
      c_receive_order_date_to: '',
      c_customer_name: '',
      c_user_name: '',
      c_item_number: '',
      c_name: '',
      c_order_no: '',
      page: 1,
    },
    '/api/receive_order/dialog',
    isShown,
    onSelected,
    onCancel
  );
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => {
      let sales_name = '';
      switch (r.has_sales) {
        case 1:
          sales_name = '〇';
          break;
        case 2:
          sales_name = '△';
          break;
      }
      return (
        <tr key={r.id}>
          <td className="text-center">
            <span data-id={r.id} onClick={onClickSelect} className="link">
              {r.receive_order_date}
            </span>
          </td>
          <td>{r.customer_name ?? '上様'}</td>
          <td>{r.user_name}</td>
          <td className="text-right">{numberFormat(r.total_amount, 0)}</td>
          <td className="text-center">{sales_name}</td>
          <td className="col-btn">
            <span data-id={r.id} onClick={onClickSelect}>
              選択
            </span>
          </td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th className="col-date">受注日</th>
            <th>得意先</th>
            <th className="w-40">担当者</th>
            <th className="col-amount">金額</th>
            <th className="w-16">売上</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <DialogWrapper title="受注検索" isShown={isShown && !isLoading} onClickCancel={onClickCancel}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <div className="w-full">
          <div className="flex items-center form-group max-w-md mt-2">
            <label className="label w-16 mr-2 text-right">受注日</label>
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
          <div className="flex">
            <div className="w-1/2 max-w-sm mt-2 pr-4">
              <div className="flex items-center form-group">
                <label className="label w-16 mr-2 text-right">得意先</label>
                <div className="flex-grow">
                  <Forms.FormInputText
                    name="c_customer_name"
                    className="input w-full"
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
                  />
                </div>
              </div>
            </div>
            <div className="w-1/2 max-w-sm mt-2 pr-4">
              <div className="flex items-center form-group">
                <label className="label w-16 mr-2 text-right">担当者</label>
                <div className="flex-grow">
                  <Forms.FormInputText
                    name="c_user_name"
                    className="input w-full"
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
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="w-1/2 max-w-sm mt-2 pr-4">
              <div className="flex items-center form-group">
                <label className="label w-16 mr-2 text-right">品番</label>
                <div className="flex-grow">
                  <Forms.FormInputText
                    name="c_item_number"
                    className="input w-full"
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
              </div>
            </div>
            <div className="w-1/2 max-w-sm mt-2 pr-4">
              <div className="flex items-center form-group">
                <label className="label w-16 mr-2 text-right">品名</label>
                <div className="flex-grow">
                  <Forms.FormInputText
                    name="c_name"
                    className="input w-full"
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
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-sm mt-2 pr-4">
            <div className="flex items-center form-group">
              <label className="label w-16 mr-2 text-right">注文番号</label>
              <div className="flex-grow">
                <Forms.FormInputText
                  name="c_order_no"
                  className="input w-full"
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
                />
              </div>
            </div>
          </div>
        </div>
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
    </DialogWrapper>
  );
};
