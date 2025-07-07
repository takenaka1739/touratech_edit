import React, { useMemo } from 'react';
import { PlaceOrder } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { numberFormat } from '@/utils/numberFormat';

type PlaceOrderSearchDialogProps = {
  isShown: boolean;
  onSelected: (props: PlaceOrder) => void;
  onCancel: () => void;
};

type PlaceOrderSearchDialogConditionsState = {
  c_place_order_date_from?: string;
  c_place_order_date_to?: string;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  c_is_purchased: string;
  page: number;
};

/**
 * 発注データ（検索）画面 Component
 */
export const PlaceOrderSearchDialog: React.VFC<PlaceOrderSearchDialogProps> = ({
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
  } = useCommonSearchDialog<PlaceOrderSearchDialogConditionsState, PlaceOrder>(
    {
      c_place_order_date_from: '',
      c_place_order_date_to: '',
      c_user_name: '',
      c_item_number: '',
      c_name: '',
      c_is_purchased: 'none',
      page: 1,
    },
    '/api/place_order/dialog',
    isShown,
    onSelected,
    onCancel
  );

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td className="text-center">
          <span data-id={r.id} onClick={onClickSelect} className="link">
            {r.place_order_date}
          </span>
        </td>
        <td>{r.user_name}</td>
        <td className="text-right">{numberFormat(r.total_amount, 0)}</td>
        <td className="col-btn">
          <span data-id={r.id} onClick={onClickSelect}>
            選択
          </span>
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
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <DialogWrapper
      title="発注データ検索"
      isShown={isShown && !isLoading}
      onClickCancel={onClickCancel}
    >
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <div className="w-full">
          <div className="flex">
            <div className="w-1/2 max-w-sm pr-4">
              <div className="flex items-center form-group max-w-md">
                <label className="label w-16 mr-2 text-right">注文日</label>
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
            </div>
            <div className="w-1/2 max-w-sm pr-4">
              <div className="flex items-center form-group">
                <label className="label w-16 mr-2 text-right">担当者</label>
                <div className="flex-grow">
                  <Forms.FormInputText
                    name="c_user_name"
                    className="input w-full"
                    value={conditions.c_user_name}
                    onChange={onChange}
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
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="w-82 mt-2">
              <div className="form-group items-center">
                <label className="label w-16 mr-2 text-right">仕入</label>
                <div className="flex items-center">
                  <Forms.FormInputRadio
                    labelText="すべて"
                    id="c_is_purchased_none"
                    name="c_is_purchased"
                    value={'none'}
                    checked={conditions.c_is_purchased === 'none'}
                    onChange={onChange}
                  />
                  <Forms.FormInputRadio
                    labelText="仕入済のみ"
                    id="c_is_purchased_1"
                    name="c_is_purchased"
                    value={'1'}
                    checked={conditions.c_is_purchased === '1'}
                    onChange={onChange}
                  />
                  <Forms.FormInputRadio
                    labelText="未仕入のみ"
                    id="c_is_purchased_0"
                    name="c_is_purchased"
                    value={'0'}
                    checked={conditions.c_is_purchased === '0'}
                    onChange={onChange}
                  />
                </div>
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
