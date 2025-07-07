import React, { useMemo } from 'react';
import { Estimate } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';
import { addMonths, format, startOfMonth } from 'date-fns';

const c_estimate_date_from = format(startOfMonth(addMonths(new Date(), -1)), 'yyyy/MM/dd');

type EstimateSearchDialogProps = {
  isShown: boolean;
  onSelected: (props: Estimate) => void;
  onCancel: () => void;
};

type EstimateSearchDialogConditionsState = {
  c_estimate_date_from?: string;
  c_estimate_date_to?: string;
  c_customer_name?: string | undefined;
  c_user_name?: string | undefined;
  c_item_number?: string | undefined;
  c_name?: string | undefined;
  c_order_no?: string | undefined;
  c_not_receive_order?: boolean | undefined;
  page: number;
};

/**
 * 見積データ（検索）画面 Component
 */
export const EstimateSearchDialog: React.VFC<EstimateSearchDialogProps> = ({
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
  } = useCommonSearchDialog<EstimateSearchDialogConditionsState, Estimate>(
    {
      c_estimate_date_from: c_estimate_date_from,
      c_estimate_date_to: '',
      c_customer_name: '',
      c_user_name: '',
      c_item_number: '',
      c_name: '',
      c_order_no: '',
      c_not_receive_order: true,
      page: 1,
    },
    '/api/estimate/dialog',
    isShown,
    onSelected,
    onCancel
  );
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td className="text-center">
          <span data-id={r.id} onClick={onClickSelect} className="link">
            {r.estimate_date}
          </span>
        </td>
        <td>{r.customer_name ?? '上様'}</td>
        <td>{r.user_name}</td>
        <td className="text-right">{numberFormat(r.total_amount, 0)}</td>
        <td className="text-center">{r.has_receive_order ? '〇' : ''}</td>
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
            <th className="col-date">見積日</th>
            <th>得意先</th>
            <th className="w-40">担当者</th>
            <th className="col-amount">金額</th>
            <th className="w-16">受注</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <DialogWrapper
      title="見積データ検索"
      isShown={isShown && !isLoading}
      onClickCancel={onClickCancel}
    >
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroup labelText="見積日" removeOptionalLabel>
          <div className="flex">
            <Forms.FormInputDate
              name="c_estimate_date_from"
              value={conditions.c_estimate_date_from}
              onChange={onChange}
            />
            <span className="mx-2">～</span>
            <Forms.FormInputDate
              name="c_estimate_date_to"
              value={conditions.c_estimate_date_to}
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
        <div className="flex">
          <div className="w-1/2 max-w-sm mt-2 pr-4">
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
          <div className="w-1/2 max-w-sm mt-2 pr-4">
            <Forms.FormInputCheck
              labelText="未受注のみ"
              id="c_not_receive_order"
              name="c_not_receive_order"
              checked={conditions.c_not_receive_order}
              onChange={onChange}
            />
          </div>
        </div>
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
    </DialogWrapper>
  );
};
