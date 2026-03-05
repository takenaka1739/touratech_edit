// 更新: resources/ts/app/Inquiry/pages/InquiryReplyListPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';
import { BoxConditions, TableWrapper, Forms } from '@/components';
import { useComposing } from '@/uses';
import { MailPageWrapper } from '../components/detail/MailPageWrapper';
import { useInquiryReplyListPage } from '../uses/useInquiryReplyListPage';


type EcRow = {
  sales_form?: number | null;
  sale_type: string;
  order_state?: string;
  status?: any;

  slip_no: string;
  total_amount: number;
  invoice_date: string | null;
  paid_date: string | null;
  member_name: string | null;
  buyer_name: string | null;

  payment_name?: string | null;
  payment_type?: any;

  shipped_date: string | null;
  canceled_date: string | null;

  send_count: number;
  receive_order_id: number;
  sales_id: number | null;
};

type PagerLike = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const TabButton: React.VFC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    className={`btn ${active ? 'btn-primary' : ''}`}
    onClick={onClick}
    style={{ minWidth: 180 }}
  >
    {children}
  </button>
);

/** YYYY/MM/DD だけに整形（ISO/DB timestamp でもOK） */
const toYmd = (v: any): string => {
  const s = (v ?? '').toString().trim();
  if (!s) return '';
  // "2026-02-27 06:00:00" / "2026-02-27T06:00:00" / "2026/02/27 ..." を想定
  const m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (!m) return s; // 想定外はそのまま
  return `${m[1]}/${m[2]}/${m[3]}`;
};

const salesFormLabel = (v: any): string => {
  const n = Number(v);
  if (n === 1) return 'PC';
  if (n === 2) return 'スマフォ';
  if (n === 3) return 'タブレット';
  return '';
};

/** 伝票番号を2行にする（可能なら 先頭/末尾 を分割、無理なら中央で改行） */
const renderSlipNo2Lines = (slipNo: string) => {
  const s = (slipNo ?? '').toString();
  if (!s) return '';

  // よくある "YYYYMMDDHHMMSS-?-??" 形式を想定して最後の "-xx" などを2行目へ
  const idx = s.lastIndexOf('-');
  if (idx > 0 && idx < s.length - 1) {
    const a = s.slice(0, idx);
    const b = s.slice(idx + 1);
    return (
      <span style={{ display: 'inline-block', lineHeight: 1.15 }}>
        <span style={{ display: 'block' }}>{a}</span>
        <span style={{ display: 'block' }}>{b}</span>
      </span>
    );
  }

  // "-" が無い場合：半分で分割
  const mid = Math.ceil(s.length / 2);
  return (
    <span style={{ display: 'inline-block', lineHeight: 1.15 }}>
      <span style={{ display: 'block' }}>{s.slice(0, mid)}</span>
      <span style={{ display: 'block' }}>{s.slice(mid)}</span>
    </span>
  );
};

// ===== 表示スタイル =====
const tableStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
};


const replyBadgeStyle = (isReplied: any): React.CSSProperties => {
  const n = Number(isReplied);

  if (n === 1) {
    return {
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac',
      whiteSpace: 'nowrap',
    };
  }

  return {
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    whiteSpace: 'nowrap',
  };
};

const replyLabel = (isReplied: any) =>
  Number(isReplied) === 1 ? '返信済' : '未返信';

const thStyle: React.CSSProperties = {
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const tdCenter: React.CSSProperties = {
  textAlign: 'center',
  verticalAlign: 'middle',
};

const tdCenterNoWrap: React.CSSProperties = {
  ...tdCenter,
  whiteSpace: 'nowrap',
};

const nameSmallOneLine: React.CSSProperties = {
  ...tdCenter,
  fontSize: 11, // 会員/購入者氏名だけ少し小さく
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 180, // ここは列幅に合わせて調整
};

export const InquiryReplyListPage: React.VFC = () => {
  const slug = 'shop-mail';
  const title = 'お問い合わせ一覧';

  const location = useLocation();
  const history = useHistory();

  const initialTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return t === 'ec' ? 'ec' : 'inquiry';
  }, [location.search]);

  const changeTab = async (next: 'inquiry' | 'ec') => {
    setTab(next);
    history.replace(`/inquiry?tab=${next}`);

    if (next === 'ec' && ecRows.length === 0) {
      await fetchEc(1);
    }
  };

  const [tab, setTab] = useState<'inquiry' | 'ec'>(initialTab);
  // ===== inquiry tab =====
  const inquiry = useInquiryReplyListPage(slug);

  // ===== ec tab =====
  const [ecLoading, setEcLoading] = useState(false);
  const [ecRows, setEcRows] = useState<EcRow[]>([]);
  const [ecPager, setEcPager] = useState<PagerLike | undefined>(undefined);
  const [ecKeyword, setEcKeyword] = useState('');

  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const fetchEc = async (page = 1) => {
    setEcLoading(true);
    try {
      const res = await axios.get('/api/shop-mail/ec-mail-histories', {
        params: {
          keyword: ecKeyword || undefined,
          page,
          per_page: 20,
        },
      });

      setEcRows(res.data?.rows ?? []);
      setEcPager(res.data?.pager ?? undefined);
    } finally {
      setEcLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'ec' && ecRows.length === 0) {
      fetchEc(1);
    }
  }, [tab]);

  const onClickEcSearch = async () => {
    await fetchEc(1);
  };

  const onClickEcClear = async () => {
    setEcKeyword('');
    setTimeout(() => fetchEc(1), 0);
  };

  const onChangeEcPage = async (page: number) => {
    await fetchEc(page);
  };

  // ===== tables =====
  const inquiryTable = useMemo(() => {
    const tbody = (inquiry.state.rows ?? []).map((r: any) => (
      <tr key={r.id}>
        <td style={tdCenterNoWrap}>{r.content ?? ''}</td>
        <td style={tdCenterNoWrap}>{toYmd(r.created_at ?? '')}</td>
        <td style={tdCenter}>{r.customer_name ?? ''}</td>
        <td style={tdCenter}>{r.email ?? ''}</td>
        <td className="col-btn" style={tdCenterNoWrap}>
          <Link to={`/inquiry/detail/${r.id}`}>詳細</Link>
        </td>
        <td style={tdCenter}>
          <span style={replyBadgeStyle(r.is_replied)}>
            {replyLabel(r.is_replied)}
          </span>
        </td>
      </tr>
    ));

    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th className="col-amount" style={thStyle}>
              問い合わせ種別
            </th>
            <th className="col-amount" style={thStyle}>
              問い合わせ日
            </th>
            <th style={thStyle}>問い合わせ氏名</th>
            <th style={thStyle}>email</th>
            <th className="col-amount" style={{ ...thStyle, width: '90px' }}>
              詳細
            </th>
            <th className="col-amount" style={thStyle}>
              返信状態
            </th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [inquiry.state.rows]);

  const ecTable = useMemo(() => {
    const tbody = (ecRows ?? []).map((r) => (
      <tr key={`${r.receive_order_id}-${r.sales_id ?? 0}`}>
        <td style={tdCenterNoWrap}>
          {salesFormLabel(r.sales_form) || r.sale_type || ''}
        </td>
        <td style={tdCenterNoWrap}>{r.order_state ?? r.status ?? ''}</td>

        {/* 伝票番号：2行表示 */}
        <td style={tdCenter}>{renderSlipNo2Lines(r.slip_no ?? '')}</td>

        <td style={tdCenterNoWrap}>{r.total_amount ?? 0}</td>

        {/* 日付はYYYY/MM/DDのみ */}
        <td style={tdCenterNoWrap}>{toYmd(r.invoice_date ?? '')}</td>
        <td style={tdCenterNoWrap}>{toYmd(r.paid_date ?? '')}</td>

        {/* 会員/購入者氏名：さらに小さく、1行固定（省略） */}
        <td style={nameSmallOneLine} title={r.member_name ?? ''}>
          {r.member_name ?? ''}
        </td>
        <td style={nameSmallOneLine} title={r.buyer_name ?? ''}>
          {r.buyer_name ?? ''}
        </td>

        <td style={nameSmallOneLine} title={String(r.payment_name ?? r.payment_type ?? '')}>
          {(r.payment_name ?? r.payment_type ?? '') as any}
        </td>

        <td style={tdCenterNoWrap}>{toYmd(r.shipped_date ?? '')}</td>
        <td style={tdCenterNoWrap}>{toYmd(r.canceled_date ?? '')}</td>

        <td className="col-btn" style={tdCenterNoWrap}>
          <Link to={`/inquiry_mail/receive_order/${r.receive_order_id}`}>
            {r.send_count ?? 0}件
          </Link>
        </td>

        <td className="col-btn" style={tdCenterNoWrap}>
          {r.sales_id ? (
            // 売上があれば売上詳細へ
            <Link to={`/sales/detail/${r.sales_id}`}>詳細</Link>
          ) : r.receive_order_id ? (
            // 売上未作成なら受注詳細へ
            <Link to={`/receive_order/detail/${r.receive_order_id}`}>詳細</Link>
          ) : (
            <span>なし</span>
          )}
        </td>
      </tr>
    ));

    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th className="col-amount" style={thStyle}>
              売上形態
            </th>
            <th className="col-amount" style={thStyle}>
              状態
            </th>
            <th className="col-amount" style={thStyle}>
              伝票番号
            </th>
            <th className="col-amount" style={thStyle}>
              合計金額
            </th>
            <th className="col-amount" style={thStyle}>
              請求日
            </th>
            <th className="col-amount" style={thStyle}>
              入金日
            </th>
            <th className="col-amount" style={thStyle}>
              会員氏名
            </th>
            <th className="col-amount" style={thStyle}>
              購入者氏名
            </th>
            <th className="col-amount" style={thStyle}>
              支払種別
            </th>
            <th className="col-amount" style={thStyle}>
              発送日
            </th>
            <th className="col-amount" style={thStyle}>
              取消日
            </th>
            <th className="col-amount" style={{ ...thStyle, width: '90px' }}>
              送信件数
            </th>
            <th className="col-amount" style={{ ...thStyle, width: '90px' }}>
              詳細
            </th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [ecRows]);

  return (
    <MailPageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        <TabButton active={tab === 'inquiry'} onClick={() => changeTab('inquiry')}>
          問い合わせ
        </TabButton>
        <TabButton active={tab === 'ec'} onClick={() => changeTab('ec')}>
          EC購入メール履歴
        </TabButton>
      </div>

      {/* Conditions */}
      {tab === 'inquiry' ? (
        <BoxConditions
          onClickSearchButton={inquiry.onClickSearchButton}
          onClickClearButton={inquiry.onClickClearButton}
        >
          <Forms.FormGroupInputText
            labelText="文字列"
            name="c_keyword"
            value={(inquiry.conditions as any).c_keyword ?? ''}
            onChange={(name, value) => {
              try {
                (inquiry.onChange as any)(name, value);
              } catch {
                // noop
              }
            }}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !composing) {
                inquiry.onClickSearchButton();
              }
            }}
            maxLength={100}
            groupClassName="max-w-sm"
            removeOptionalLabel
          />
        </BoxConditions>
      ) : (
        <BoxConditions onClickSearchButton={onClickEcSearch} onClickClearButton={onClickEcClear}>
          <Forms.FormGroupInputText
            labelText="文字列"
            name="ec_keyword"
            value={ecKeyword}
            onChange={(_name, value) => setEcKeyword(String(value ?? ''))}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !composing) {
                onClickEcSearch();
              }
            }}
            maxLength={100}
            groupClassName="max-w-sm"
            removeOptionalLabel
          />
        </BoxConditions>
      )}

      {/* Table */}
      {tab === 'inquiry' ? (
        <TableWrapper
          pager={inquiry.state.pager}
          onChangePage={inquiry.onChangePage}
          isLoading={inquiry.isLoading}
        >
          {inquiryTable}
        </TableWrapper>
      ) : (
        <TableWrapper pager={ecPager as any} onChangePage={onChangeEcPage} isLoading={ecLoading}>
          {ecTable}
        </TableWrapper>
      )}
    </MailPageWrapper>
  );
};