import React, { useMemo } from 'react';
import { useInquiryReplyListPage } from '../uses/useInquiryReplyListPage';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useComposing } from '@/uses';
import { IndividualReplyDialog } from '../components/IndividualReplyDialog';

/**
 * お問い合わせ（一覧）画面 Component
 */
export const ShopMailListPage: React.VFC = () => {

  //const slug = 'calendar';
  const slug = 'calendar';
  const title = '自動返信一覧';

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
  } = useInquiryReplyListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map((r:any) => (
      <tr key={r.id}>
        <td className="text-right">{}</td>
        <td className="col-btn">
          {/*<Link to={`/shop_mail/${r.id}`}>編集</Link>*/}
          <Link to={`/shop_mail_list/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th className="col-amount">メール題名</th>
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
      <div className="flex justify-between">
        {/*<button className="btn" onClick={saveClick}>保存</button>*/}
        {/*<button className="btn" style={{marginTop: '5px'}}>新規追加</button>*/}
        <Link className="btn" to={`/shop_mail_list/detail`} style={{marginTop: '10px'}}>新規追加</Link>
      </div>
    </PageWrapper>
    
  );
};
