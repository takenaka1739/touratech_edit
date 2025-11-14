import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
//import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
//import { PageWrapper, TableWrapper } from '@/components';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
//import { numberFormat } from '@/utils/numberFormat';
//import { useComposing } from '@/uses';
import { useCalendarListPage } from '../uses/useCalendarListPage';
import { useComposing } from '@/uses';
import dayjs from 'dayjs';

/**
 * 商品マスタ（一覧）画面 Component
 */
export const CalendarListPage: React.VFC = () => {
  const title = 'カレンダーマスタ';
  const slug = 'calendar';
  const {
    isLoading,
    state,
    onChange,
    onChangePage,
    onClickSearchButton,
    onClickClearButton,
    addDetail,
    conditions,
    isDisabled,
  } = useCalendarListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>
          <div>{r.name}</div>
        </td>
        <td className="text-right">{dayjs(r.start_at).format('YYYY-MM-DD')}</td>
        <td className="text-right">{dayjs(r.end_at).format('YYYY-MM-DD')}</td>
        <td className="text-right" style={{padding: '10px'}}>
          <div style={{backgroundColor: r.back_color, width: '75px', height: '50px', color: r.font_color,
                       display: 'flex', alignItems: 'center', justifyContent: 'center', // 水平方向の中央揃え
}}>
            サンプル
          </div>
        </td>
        <td className="col-btn">
          <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>イベント名</th>
            <th className="col-amount">開始日</th>
            <th className="col-amount">終了日</th>
            <th className="w-24">配色サンプル</th>
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
      <div className="mt-2">
        <button className="btn" onClick={addDetail} disabled={isDisabled}>
          新規追加
        </button>
      </div>
    </PageWrapper>
  );
};
