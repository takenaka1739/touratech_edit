import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useSetItemListPage } from '../uses/useSetItemListPage';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';

/**
 * セット品マスタ（一覧）画面 Component
 */
export const SetItemListPage: React.VFC = () => {
  const title = 'セット品マスタ';
  const slug = 'set_item';
  const {
    isLoading,
    state,
    conditions,
    addDetail,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
  } = useSetItemListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>
          <div className="text-xs">{r.item_number}</div>
          <div>{r.name_jp}</div>
        </td>
        <td className="text-right">{numberFormat(r.sales_unit_price)}</td>
        <td className="text-right">{numberFormat(r.total_quantity, 0)}</td>
        <td className="col-btn">
          <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>セット品番・セット品名</th>
            <th className="col-amount">セット単価</th>
            <th className="w-24">総点数</th>
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
        bodyClassName="mt-0"
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
            labelText="表示："
            name="c_is_display"
            value={conditions.c_is_display}
            onChange={onChange}
            items={[
              {
                labelText: '指定なし',
                id: 'c_is_display_none',
                value: 'none',
              },
              {
                labelText: '表示のみ',
                id: 'c_is_display_1',
                value: '1',
              },
              {
                labelText: '非表示のみ',
                id: 'c_is_display_2',
                value: '2',
              },
            ]}
            groupClassName="max-w-sm"
            removeOptionalLabel
          />
        </div>
        <div className="w-40 mt-2">
          <div className="form-group">
            <Forms.FormInputCheck
              id="is_discontinued"
              name="c_has_discontinued"
              labelText="廃盤データを含む"
              value={'1'}
              checked={conditions.c_has_discontinued}
              onChange={onChange}
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
