import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { useComposing } from '@/uses';
import { useMailListPage } from '../uses/useMailListPage';

const ynLabel = (v: any, yes = '表示', no = '非表示') => (Number(v ?? 0) === 1 ? yes : no);
const ynLabel2 = (v: any, yes = '有', no = '無') => (Number(v ?? 0) === 1 ? yes : no);

const TYPE_AUTO = 1;  // 自動返信
const TYPE_INDIV = 2; // 個別返信

export const MailListPage: React.VFC = () => {
  const title = 'メールテンプレ一覧';

  const {
    isLoading,
    isDeleting,
    state,
    conditions,
    onChange,
    onChangePage,
    onClickSearchButton,
    onClickClearButton,
    deleteTemplate,
  } = useMailListPage();

  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const { autoRows, indivRows } = useMemo(() => {
    const autoRows = (state.rows ?? []).filter((r: any) => Number(r.template_type) === TYPE_AUTO);
    const indivRows = (state.rows ?? []).filter((r: any) => Number(r.template_type) === TYPE_INDIV);
    return { autoRows, indivRows };
  }, [state.rows]);

  const renderTable = (rows: any[]) => {
    const tbody = rows.map((r: any) => (
      <tr key={r.id}>
        <td>{r.title ?? ''}</td>
        <td className="text-center">{ynLabel(r.detail_mode, '表示', '非表示')}</td>
        <td className="text-center">{ynLabel2(r.payment_url_enabled, '有', '無')}</td>

        <td className="text-center">
          <Link to={`/mail/detail/${r.id}`}>編集</Link>
        </td>

        <td className="text-center">
          <button
            className="btn"
            type="button"
            disabled={isDeleting}
            onClick={async () => {
              const ok = window.confirm('このメールテンプレを削除します。よろしいですか？');
              if (!ok) return;
              await deleteTemplate(Number(r.id));
            }}
          >
            削除
          </button>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>題名</th>
            <th className="text-center">明細</th>
            <th className="text-center">支払いURL</th>
            <th className="text-center">編集</th>
            <th className="text-center">削除</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  };

  // 自動返信は「1件のみ」にしたいので、作成ボタンは 0件の時だけ表示
  const autoCreateButton =
    autoRows.length === 0 ? (
      <Link className="btn" to={`/mail/detail?template_type=${TYPE_AUTO}`} style={{ marginTop: '10px' }}>
        自動返信テンプレを作成
      </Link>
    ) : null;

  // 個別返信は複数可なので常に新規追加OK
  const indivCreateButton = (
    <Link className="btn" to={`/mail/detail?template_type=${TYPE_INDIV}`} style={{ marginTop: '10px' }}>
      個別返信テンプレを追加
    </Link>
  );

  return (
    <PageWrapper prefix="mail" title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions onClickSearchButton={onClickSearchButton} onClickClearButton={onClickClearButton}>
        <Forms.FormGroupInputText
          labelText="文字列"
          name="c_keyword"
          value={conditions.c_keyword}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' && !composing) onClickSearchButton();
          }}
          maxLength={30}
          groupClassName="max-w-sm"
          removeOptionalLabel
        />
      </BoxConditions>

      {/* ===== 自動返信 ===== */}
      <div className="mt-4">
        <h2 className="text-lg font-bold">自動返信メール</h2>
        <div className="text-sm text-gray-600">
          ※ 自動返信テンプレは1つのみ作成できます。
        </div>

        <div className="mt-2">
          {autoRows.length === 0 ? (
            <div className="p-3">自動返信テンプレが未作成です。</div>
          ) : null}
          <TableWrapper pager={undefined} onChangePage={onChangePage} isLoading={isLoading}>
            {renderTable(autoRows)}
          </TableWrapper>
          <div className="flex justify-between">{autoCreateButton}</div>
        </div>
      </div>

      {/* ===== 個別返信 ===== */}
      <div className="mt-8">
        <h2 className="text-lg font-bold">個別返信メール</h2>
        <div className="text-sm text-gray-600">
          ※ 個別返信テンプレは複数作成できます。
        </div>

        <div className="mt-2">
          <TableWrapper pager={undefined} onChangePage={onChangePage} isLoading={isLoading}>
            {renderTable(indivRows)}
          </TableWrapper>
          <div className="flex justify-between">{indivCreateButton}</div>
        </div>
      </div>
    </PageWrapper>
  );
};