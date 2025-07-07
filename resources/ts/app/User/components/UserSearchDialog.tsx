import React, { useMemo } from 'react';
import { User } from '@/types';
import { TableWrapper, BoxConditions, DialogWrapper, Forms } from '@/components';
import { useCommonSearchDialog } from '@/app/App/uses/useCommonSearchDialog';
import { useComposing } from '@/uses';

type UserSearchDialogProps = {
  isShown: boolean;
  onSelected: (props: User) => void;
  onCancel: () => void;
};

type UserSearchDialogConditionsState = {
  c_keyword?: string;
  c_role: string;
  page: number;
};

/**
 * 担当者マスタ（検索）画面 Component
 */
export const UserSearchDialog: React.VFC<UserSearchDialogProps> = ({
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
  } = useCommonSearchDialog<UserSearchDialogConditionsState, User>(
    {
      c_keyword: '',
      c_role: 'none',
      page: 1,
    },
    '/api/user/dialog',
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
            <th>担当者名</th>
            <th className="col-btn">選択</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <DialogWrapper title="担当者検索" isShown={isShown && !isLoading} onClickCancel={onClickCancel}>
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
          removeOptionalLabel={true}
        />
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
    </DialogWrapper>
  );
};
