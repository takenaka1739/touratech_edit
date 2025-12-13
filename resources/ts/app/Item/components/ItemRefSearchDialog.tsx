import React, { useMemo } from 'react';
import { Item } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { AppActions } from '@/app/App/modules/appModule';

type ItemSearchDialogProps = {
  selectId:number | undefined;
  isShown: boolean;
  isSetItem?: boolean | undefined;
  onChangeState: (value: any) => void;
  onSelected: (props: Item) => Promise<boolean>;
  onCancel: () => void;
};

type ItemSearchDialogConditionsState = {
  c_keyword?: string;
  c_is_display: string;
  c_is_set_item?: boolean | undefined;
  page: number;
};

/**
 * 商品マスタ（検索）画面 Component
 *
 * @param props
 */
export const ItemRefSearchDialog: React.VFC<ItemSearchDialogProps> = ({
  onChangeState,
  isShown,
  isSetItem,
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
  } = useCommonSearchDialog<ItemSearchDialogConditionsState, Item>(
    {
      c_keyword: '',
      c_is_display: '1',
      c_is_set_item: isSetItem,
      page: 1,
    },
    '/api/item/refdialog',
    isShown,
    onSelected,
    onCancel
  );

  const { composing, onCompositionStart, onCompositionEnd } = useComposing();
  const dispatch = useDispatch();

  const onClickDetail:(id : number | undefined) => Promise<void> = async id => {
    const res = await axios.get(`/api/item/edit/${id}`);
    if (res.status === 200) {
      dispatch(AppActions.success());
      onChangeState(res.data.data);
      onClickCancel();
    } else {
      dispatch(AppActions.success());
    }
  }

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>
          <span data-id={r.id} onClick={onClickSelect} className="link">
            <div className="text-xs">{r.item_number}</div>
            <div>{r.name}</div>
            <div>{r.name_note}</div>
          </span>
        </td>
        <td className="text-right">{numberFormat(r.sales_unit_price)}</td>
        <td className="text-right">{numberFormat(r.purchase_unit_price)}</td>
        <td className="text-right">{numberFormat(r.domestic_stocks ?? 0, 0)}</td>
        <td className="text-right">{numberFormat(r.overseas_stocks ?? 0, 0)}</td>
        <td className="col-btn">
          <span data-id={r.id} onClick={() => onClickDetail(r.id)}>
            選択
          </span>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>品番・商品名</th>
            <th className="col-amount">売上単価</th>
            <th className="col-amount">仕入単価</th>
            <th className="w-24">国内</th>
            <th className="w-24">国外</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <DialogWrapper title="商品検索" isShown={isShown && !isLoading} onClickCancel={onClickCancel}>
      <BoxConditions
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <Forms.FormGroupInputText
          labelText="文字列"
          name="c_keyword"
          value={conditions.c_keyword}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' && !composing) {
              onClickSearchButton();
            }
          }}
          maxLength={30}
          groupClassName="max-w-sm mr-4"
          removeOptionalLabel
        />
      </BoxConditions>
      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
    </DialogWrapper>
  );
};
