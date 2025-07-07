import React, { useMemo } from 'react';
import { Supplier } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { useComposing } from '@/uses';

type SupplierSearchDialogProps = {
  isShown: boolean;
  onSelected: (props: Supplier) => void;
  onCancel: () => void;
};

type SupplierSearchDialogConditionsState = {
  c_keyword?: string;
  page: number;
};

/**
 * 仕入先マスタ（検索）画面 Component
 */
export const SupplierSearchDialog: React.VFC<SupplierSearchDialogProps> = ({
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
  } = useCommonSearchDialog<SupplierSearchDialogConditionsState, Supplier>(
    {
      c_keyword: '',
      page: 1,
    },
    '/api/supplier/dialog',
    isShown,
    onSelected,
    onCancel
  );
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>
          <span data-id={r.id} onClick={onClickSelect} className="link">
            {r.name}
          </span>
        </td>
        <td>
          <div>〒{r.zip_code}</div>
          <div>
            {r.address1}
            {r.address2}
          </div>
        </td>
        <td>
          <div>TEL:{r.tel}</div>
          {r.fax && <div>FAX:{r.fax}</div>}
        </td>
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
            <th>仕入先名</th>
            <th>住所</th>
            <th className="w-40">連絡先</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <DialogWrapper title="仕入先検索" isShown={isShown && !isLoading} onClickCancel={onClickCancel}>
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
          groupClassName="max-w-sm"
          removeOptionalLabel
        />
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
    </DialogWrapper>
  );
};
