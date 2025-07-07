import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useUserListPage } from '../uses/useUserListPage';
import { useComposing } from '@/uses';

/**
 * 担当者マスタ（一覧）画面 Component
 */
export const UserListPage: React.VFC = () => {
  const title = '担当者マスタ';
  const slug = 'user';
  const {
    isLoading,
    state,
    conditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
  } = useUserListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => {
      let roleName = '';
      switch (r.role) {
        case 0:
          roleName = '一般';
          break;
        case 1:
          roleName = '管理者';
          break;
        case 2:
          roleName = '外部';
          break;
      }
      return (
        <tr key={r.id}>
          <td>{r.name}</td>
          <td>{r.login_id}</td>
          <td className="text-center">{roleName}</td>
          <td className="col-btn">
            <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
          </td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th>担当者名</th>
            <th>ID</th>
            <th className="w-24">権限</th>
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
            removeOptionalLabel={true}
          />
          <Forms.FormGroupInputRadio
            labelText="権限："
            name="c_role"
            value={conditions.c_role}
            onChange={onChange}
            items={[
              {
                labelText: '指定なし',
                id: 'c_role_none',
                value: 'none',
              },
              {
                labelText: '一般',
                id: 'c_role_0',
                value: '0',
              },
              {
                labelText: '管理者',
                id: 'c_role_1',
                value: '1',
              },
              {
                labelText: '外部',
                id: 'c_role_2',
                value: '2',
              },
            ]}
            groupClassName="max-w-sm"
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
