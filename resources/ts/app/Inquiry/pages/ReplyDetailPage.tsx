//import React, { useMemo } from 'react';
import React from 'react';
//import { useInquiryReplyListPage } from '../uses/useInquiryReplyListPage';
//import { Link } from 'react-router-dom';
//import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
//import { PageWrapper, TableWrapper } from '@/components';
import { PageWrapper } from '@/components';
//import { useComposing } from '@/uses';
//import { IndividualReplyDialog } from '../components/IndividualReplyDialog';

/**
 * お問い合わせ（一覧）画面 Component
 */
export const ReplyDetailPage: React.VFC = () => {

  //const slug = 'calendar';
  const slug = 'calendar';
  const title = '個別返信メール詳細';

  //const {
  //  isLoading,
  //  state,
  //  //onChange,
  //  //onChangeRefState,
  //  onChangePage,
  //  //onClickSearchButton,
  //  //onClickClearButton,
  //  //individualReplyDialogProps,
  //  //conditions,
  //} = useInquiryReplyListPage(slug);
  //const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  //const tables = useMemo(() => {
  //  const tbody = state.rows.map((r:any) => (
  //    <tr key={r.id}>
  //      <td className="text-right">{}</td>
  //      <td className="text-right">{}</td>
  //      <td className="text-right">{}</td>
  //    </tr>
  //  ));
//
  //  return (
  //    <table>
  //      <thead className="vertical-th">
  //        <tr style={{display: 'block'}}>
  //          <th style={{display: 'block'}}>題名</th>
  //          <th style={{display: 'block'}}>送信日時</th>
  //          <th style={{display: 'block'}}>送信先メールアドレス</th>
  //          <th style={{display: 'block'}}>BCCメールアドレス</th>
  //        </tr>
  //      </thead>
  //      <tbody>{tbody}</tbody>
  //    </table>
//
  //  );
  //}, [state.rows]);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: 'お問い合わせ一覧', url: `/inquiry` },
                                                          { name: '返信一覧', url: `/inquiry/reply/${8}`},
                                                          { name: '個別返信メール詳細' }]}>
      <span style={{ display: 'block', width: '950px', margin: '0 auto' }}>
        <div style={{display: 'flex'}}>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', backgroundColor: '#EDF2F7', width: '200px' }}>題名</label>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', width: '712px' }}></label>
        </div>
        <div style={{display: 'flex'}}>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', backgroundColor: '#EDF2F7', width: '200px' }}>送信日時</label>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', width: '712px' }}></label>
        </div>
        <div style={{display: 'flex'}}>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', backgroundColor: '#EDF2F7', width: '200px' }}>送信先メールアドレス</label>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', width: '712px' }}></label>
        </div>
        <div style={{display: 'flex'}}>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', backgroundColor: '#EDF2F7', width: '200px' }}>BCCメールアドレス</label>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', width: '712px' }}></label>
        </div>
        <div style={{display: 'flex'}}>
          <label style={{ border: '1px solid #ccc', padding: '4px 8px', backgroundColor: '#EDF2F7', width: '200px' }}>本文</label>
          <textarea style={{ border: '1px solid #ccc', padding: '4px 8px', width: '712px', height: '550px' }}></textarea>
        </div>
      </span>
      {/*<TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>*/}
    </PageWrapper>
  );
};
