import React, { useMemo } from 'react';
import { useReplyListPage } from '../uses/useReplyListPage';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useComposing } from '@/uses';
import { IndividualReplyDialog } from '../components/IndividualReplyDialog';

/**
 * お問い合わせ（一覧）画面 Component
 */
export const ReplyListPage: React.VFC = () => {

  //const slug = 'calendar';
  const slug = 'calendar';
  const title = '返信一覧';

  const {
    isLoading,
    state,
    onChange,
    onChangeRefState,
    onChangePage,
    onClickSearchButton,
    onClickClearButton,
    individualReplyDialogProps,
    conditions,
  } = useReplyListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map((r:any) => (
      <tr key={r.id}>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="col-btn">
          <Link to={`/inquiry/reply/detail/${r.id}`}>確認</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th className="col-amount">題名</th>
            <th className="col-amount">送信先メールアドレス</th>
            <th className="col-amount">送信日時</th>
            <th className="col-amount">確認</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: 'お問い合わせ一覧', url: `/inquiry` },
                                                          { name: '返信一覧' }]}>
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

      <div className="mt-2">
        <IndividualReplyDialog
          //selectId={state.id}
          selectId={1}
          onChangeState={onChangeRefState}
          {...individualReplyDialogProps}
        />
      </div>
      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
    </PageWrapper>
  );
};
