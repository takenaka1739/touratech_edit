import React, { useMemo } from 'react';
import { useInquiryReplyListPage } from '../uses/useInquiryReplyListPage';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useComposing } from '@/uses';
import { IndividualReplyDialog } from '../components/IndividualReplyDialog';

/**
 * お問い合わせ（一覧）画面 Component
 */
export const InquiryReplyListPage: React.VFC = () => {

  //const slug = 'calendar';
  const slug = 'calendar';
  const title = 'お問い合わせ一覧';

  const {
    isLoading,
    state,
    onChange,
    onChangeRefState,
    onChangePage,
    onClickSearchButton,
    onClickClearButton,
    addDetail,
    openIndividualReplyDialog,
    individualReplyDialogProps,
    conditions,
    isDisabled,
  } = useInquiryReplyListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map((r:any) => (
      <tr key={r.id}>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="text-right">{}</td>
        <td className="col-btn">
          <Link to={`/inquiry_mail/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th className="col-amount">売上形態</th>
            <th className="col-amount">状態</th>
            <th className="col-amount">伝票番号</th>
            <th className="col-amount">合計金額</th>
            <th className="col-amount">請求日</th>
            <th className="col-amount">入金日</th>
            <th className="col-amount">会員氏名</th>
            <th className="col-amount">購入者氏名</th>
            <th className="col-amount">支払種別</th>
            <th className="col-amount">発送日</th>
            <th className="col-amount">取消日</th>
            <th className="col-amount">編集</th>
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

      <div className="mt-2">
        <button className="btn ml-5" onClick={openIndividualReplyDialog}>
          お問い合わせ一覧
        </button>
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
      <div className="mt-2">
        <button className="btn" onClick={addDetail} disabled={isDisabled}>
          新規追加
        </button>
      </div>
    </PageWrapper>
  );
};
