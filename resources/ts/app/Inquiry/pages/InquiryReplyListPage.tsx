// 更新: resources/ts/app/Inquiry/pages/InquiryReplyListPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  buyer_address?: string | null;

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

type EcConditions = {
  sales_form: string;
  buyer_name: string;
  buyer_email: string;
  shipped_status: string;
  buyer_tel: string;
  invoice_date_from: string;
  invoice_date_to: string;
  paid_date_from: string;
  paid_date_to: string;
  shipped_date_from: string;
  shipped_date_to: string;
  slip_no: string;
  total_amount_min: string;
  total_amount_max: string;
  payment_type: string;
  paid_status: string;
  reply_mail_status: string;
  cancel_status: string;
  order_state: string;
};

const toYmd = (v: any): string => {
  const s = (v ?? '').toString().trim();
  if (!s) return '';
  const m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (!m) return s;
  return `${m[1]}/${m[2]}/${m[3]}`;
};

const salesFormLabel = (v: any): string => {
  const n = Number(v);
  if (n === 1) return 'PC';
  if (n === 2) return 'スマフォ';
  if (n === 3) return 'タブレット';
  return '';
};

const renderSlipNo2Lines = (slipNo: string) => {
  const s = (slipNo ?? '').toString();
  if (!s) return '';

  const idx = s.lastIndexOf('-');
  if (idx > 0 && idx < s.length - 1) {
    const a = s.slice(0, idx);
    const b = s.slice(idx + 1);
    return (
      <span className="shop-mail-slip-no">
        <span>{a}</span>
        <span>{b}</span>
      </span>
    );
  }

  const mid = Math.ceil(s.length / 2);
  return (
    <span className="shop-mail-slip-no">
      <span>{s.slice(0, mid)}</span>
      <span>{s.slice(mid)}</span>
    </span>
  );
};

const normalizeParam = (v: any) => {
  const s = `${v ?? ''}`.trim();
  return s === '' ? undefined : s;
};

const pad2 = (v: string | number) => String(v).padStart(2, '0');

const splitDateParts = (value: string) => {
  const s = `${value ?? ''}`.trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    return { year: '', month: '', day: '' };
  }
  return {
    year: m[1],
    month: m[2],
    day: m[3],
  };
};

const buildDateValue = (year: string, month: string, day: string) => {
  if (!year || !month || !day) return '';
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const years = (() => {
  const currentYear = new Date().getFullYear();
  const arr: string[] = [];
  for (let y = currentYear + 1; y >= currentYear - 15; y -= 1) {
    arr.push(String(y));
  }
  return arr;
})();

const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

type DateSelectRangeProps = {
  fromName: keyof EcConditions;
  toName: keyof EcConditions;
  fromValue: string;
  toValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

const DateSelectRange: React.VFC<DateSelectRangeProps> = ({
  fromName,
  toName,
  fromValue,
  toValue,
  onChange,
}) => {
  const from = splitDateParts(fromValue);
  const to = splitDateParts(toValue);

  const emit = (name: string, value: string) => {
    onChange({
      target: { name, value },
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>);
  };

  return (
    <div className="shop-mail-date-range">
      <select
        value={from.year}
        onChange={(e) =>
          emit(String(fromName), buildDateValue(e.target.value, from.month, from.day))
        }
        className="shop-mail-date-select shop-mail-date-select-year"
      >
        <option value="">-</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <span className="shop-mail-date-unit">年</span>

      <select
        value={from.month ? String(Number(from.month)) : ''}
        onChange={(e) =>
          emit(String(fromName), buildDateValue(from.year, e.target.value, from.day))
        }
        className="shop-mail-date-select shop-mail-date-select-md"
      >
        <option value="">-</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <span className="shop-mail-date-unit">月</span>

      <select
        value={from.day ? String(Number(from.day)) : ''}
        onChange={(e) =>
          emit(String(fromName), buildDateValue(from.year, from.month, e.target.value))
        }
        className="shop-mail-date-select shop-mail-date-select-md"
      >
        <option value="">-</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <span className="shop-mail-date-unit">日</span>

      <span className="shop-mail-date-separator">～</span>

      <select
        value={to.year}
        onChange={(e) =>
          emit(String(toName), buildDateValue(e.target.value, to.month, to.day))
        }
        className="shop-mail-date-select shop-mail-date-select-year"
      >
        <option value="">-</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <span className="shop-mail-date-unit">年</span>

      <select
        value={to.month ? String(Number(to.month)) : ''}
        onChange={(e) =>
          emit(String(toName), buildDateValue(to.year, e.target.value, to.day))
        }
        className="shop-mail-date-select shop-mail-date-select-md"
      >
        <option value="">-</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <span className="shop-mail-date-unit">月</span>

      <select
        value={to.day ? String(Number(to.day)) : ''}
        onChange={(e) =>
          emit(String(toName), buildDateValue(to.year, to.month, e.target.value))
        }
        className="shop-mail-date-select shop-mail-date-select-md"
      >
        <option value="">-</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <span className="shop-mail-date-unit">日</span>
    </div>
  );
};

const createInitialEcConditions = (): EcConditions => ({
  sales_form: '',
  buyer_name: '',
  buyer_email: '',
  shipped_status: '',
  buyer_tel: '',
  invoice_date_from: '',
  invoice_date_to: '',
  paid_date_from: '',
  paid_date_to: '',
  shipped_date_from: '',
  shipped_date_to: '',
  slip_no: '',
  total_amount_min: '',
  total_amount_max: '',
  payment_type: '',
  paid_status: '',
  reply_mail_status: '',
  cancel_status: '',
  order_state: '',
});

export const InquiryReplyListPage: React.VFC = () => {
  const slug = 'shop-mail';

  const location = useLocation();

  const initialTab = useMemo(() => {
    if (location.pathname.startsWith('/inquiry_mail')) {
      return 'ec';
    }

    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return t === 'ec' ? 'ec' : 'inquiry';
  }, [location.pathname, location.search]);

  const [tab, setTab] = useState<'inquiry' | 'ec'>(initialTab);
  const title = tab === 'ec' ? 'EC購入メール履歴' : 'お問い合わせ一覧';
  const inquiry = useInquiryReplyListPage(slug);

  const [ecLoading, setEcLoading] = useState(false);
  const [ecRows, setEcRows] = useState<EcRow[]>([]);
  const [ecPager, setEcPager] = useState<PagerLike | undefined>(undefined);
  const [ecConditions, setEcConditions] = useState<EcConditions>(createInitialEcConditions());

  const { onCompositionStart, onCompositionEnd } = useComposing();

  useEffect(() => {
    if (tab !== initialTab) {
      setTab(initialTab);
      if (initialTab === 'ec' && ecRows.length === 0) {
        fetchEc(1);
      }
    }
  }, [initialTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEc = async (page = 1, conditions?: EcConditions) => {
    const c = conditions ?? ecConditions;

    setEcLoading(true);
    try {
      const res = await axios.get('/api/shop-mail/ec-mail-histories', {
        params: {
          sales_form: normalizeParam(c.sales_form),
          buyer_name: normalizeParam(c.buyer_name),
          buyer_email: normalizeParam(c.buyer_email),
          shipped_status: normalizeParam(c.shipped_status),
          buyer_tel: normalizeParam(c.buyer_tel),
          invoice_date_from: normalizeParam(c.invoice_date_from),
          invoice_date_to: normalizeParam(c.invoice_date_to),
          paid_date_from: normalizeParam(c.paid_date_from),
          paid_date_to: normalizeParam(c.paid_date_to),
          shipped_date_from: normalizeParam(c.shipped_date_from),
          shipped_date_to: normalizeParam(c.shipped_date_to),
          slip_no: normalizeParam(c.slip_no),
          total_amount_min: normalizeParam(c.total_amount_min),
          total_amount_max: normalizeParam(c.total_amount_max),
          payment_type: normalizeParam(c.payment_type),
          paid_status: normalizeParam(c.paid_status),
          reply_mail_status: normalizeParam(c.reply_mail_status),
          cancel_status: normalizeParam(c.cancel_status),
          order_state: normalizeParam(c.order_state),
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

  const onChangeEcCondition = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEcConditions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onClickEcSearch = async () => {
    await fetchEc(1);
  };

  const onClickEcClear = async () => {
    const cleared = createInitialEcConditions();
    setEcConditions(cleared);
    setTimeout(() => fetchEc(1, cleared), 0);
  };

  const onChangeEcPage = async (page: number) => {
    await fetchEc(page);
  };

  const inquiryTable = useMemo(() => {
    const tbody = (inquiry.state.rows ?? []).map((r: any) => (
      <tr key={r.id}>
        <td className="shop-mail-cell-center-nowrap">{r.content ?? ''}</td>
        <td className="shop-mail-cell-center-nowrap">{toYmd(r.created_at ?? '')}</td>
        <td className="shop-mail-cell-center">{r.customer_name ?? ''}</td>
        <td className="shop-mail-cell-center">{r.email ?? ''}</td>
        <td className="col-btn shop-mail-cell-center-nowrap">
          <Link to={`/inquiry/detail/${r.id}`}>詳細</Link>
        </td>
        <td className="shop-mail-cell-center">
          <span
            className={`shop-mail-reply-badge ${
              Number(r.is_replied) === 1 ? 'is-replied' : 'is-unreplied'
            }`}
          >
            {Number(r.is_replied) === 1 ? '返信済' : '未返信'}
          </span>
        </td>
      </tr>
    ));

    return (
      <table className="shop-mail-list-table">
        <thead>
          <tr>
            <th className="col-amount shop-mail-th-center">問い合わせ種別</th>
            <th className="col-amount shop-mail-th-center">問い合わせ日</th>
            <th className="shop-mail-th-center">問い合わせ氏名</th>
            <th className="shop-mail-th-center">email</th>
            <th className="col-amount shop-mail-th-center shop-mail-col-detail">詳細</th>
            <th className="col-amount shop-mail-th-center">返信状態</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [inquiry.state.rows]);

  const ecTable = useMemo(() => {
    const tbody = (ecRows ?? []).map((r) => (
      <tr key={`${r.receive_order_id}-${r.sales_id ?? 0}`}>
        <td className="shop-mail-cell-center-nowrap shop-mail-col-sales-form">
          {salesFormLabel(r.sales_form) || r.sale_type || ''}
        </td>
        <td className="shop-mail-cell-center-nowrap shop-mail-col-order-state">
          {r.order_state ?? r.status ?? ''}
        </td>
        <td className="shop-mail-cell-center shop-mail-col-slip-no">
          {renderSlipNo2Lines(r.slip_no ?? '')}
        </td>
        <td className="shop-mail-cell-center-nowrap shop-mail-col-total-amount">
          {r.total_amount ?? 0}
        </td>
        <td className="shop-mail-cell-center-nowrap shop-mail-col-invoice-date">
          {toYmd(r.invoice_date ?? '')}
        </td>
        <td className="shop-mail-cell-center-nowrap shop-mail-col-paid-date">
          {toYmd(r.paid_date ?? '')}
        </td>
        <td className="shop-mail-cell-name-one-line shop-mail-col-member-name">
          {r.member_name ?? ''}
        </td>
        <td className="shop-mail-cell-name-one-line shop-mail-col-buyer-name">
          <div>{r.buyer_name ?? ''}</div>
          {r.buyer_address && (
            <div className="shop-mail-buyer-address">{r.buyer_address}</div>
          )}
        </td>
        <td className="shop-mail-cell-name-one-line shop-mail-col-payment-name">
          {r.payment_name ?? ''}
        </td>
        <td className="shop-mail-cell-center-nowrap shop-mail-col-shipped-date">
          {toYmd(r.shipped_date ?? '')}
        </td>
        <td className="shop-mail-cell-center-nowrap shop-mail-col-canceled-date">
          {toYmd(r.canceled_date ?? '')}
        </td>
        <td className="col-btn shop-mail-cell-center-nowrap shop-mail-col-send-count">
          <Link to={`/inquiry_mail/receive_order/${r.receive_order_id}`}>
            {r.send_count ?? 0}件
          </Link>
        </td>
        <td className="col-btn shop-mail-cell-center-nowrap shop-mail-col-detail">
          {r.sales_id ? (
            <Link to={`/sales/detail/${r.sales_id}`}>詳細</Link>
          ) : (
            <Link to={`/receive_order/detail/${r.receive_order_id}`}>詳細</Link>
          )}
        </td>
      </tr>
    ));

    return (
      <table className="shop-mail-list-table shop-mail-ec-list-table">
        <thead>
          <tr>
            <th className="shop-mail-th-center shop-mail-col-sales-form">売上形態</th>
            <th className="shop-mail-th-center shop-mail-col-order-state">状態</th>
            <th className="shop-mail-th-center shop-mail-col-slip-no">伝票番号</th>
            <th className="shop-mail-th-center shop-mail-col-total-amount">合計金額</th>
            <th className="shop-mail-th-center shop-mail-col-invoice-date">請求日</th>
            <th className="shop-mail-th-center shop-mail-col-paid-date">入金日</th>
            <th className="shop-mail-th-center shop-mail-col-member-name">会員氏名</th>
            <th className="shop-mail-th-center shop-mail-col-buyer-name">購入者氏名</th>
            <th className="shop-mail-th-center shop-mail-col-payment-name">支払種別</th>
            <th className="shop-mail-th-center shop-mail-col-shipped-date">発送日</th>
            <th className="shop-mail-th-center shop-mail-col-canceled-date">取消日</th>
            <th className="shop-mail-th-center shop-mail-col-send-count">送信件数</th>
            <th className="shop-mail-th-center shop-mail-col-detail">詳細</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [ecRows]);

  return (
    <MailPageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        onClickSearchButton={tab === 'inquiry' ? inquiry.onClickSearchButton : onClickEcSearch}
        onClickClearButton={tab === 'inquiry' ? inquiry.onClickClearButton : onClickEcClear}
      >
        {tab === 'inquiry' ? (
          <>
            <Forms.FormGroup labelText="日付" removeOptionalLabel>
              <div className="flex">
                <Forms.FormInputDate
                  name="c_sales_date_from"
                  value={(inquiry.conditions as any).c_sales_date_from ?? ''}
                  onChange={inquiry.onChange as any}
                />
                <span className="mx-2">～</span>
                <Forms.FormInputDate
                  name="c_sales_date_to"
                  value={(inquiry.conditions as any).c_sales_date_to ?? ''}
                  onChange={inquiry.onChange as any}
                />
              </div>
            </Forms.FormGroup>

            <div className="flex">
              <div className="w-1/2 max-w-sm mt-2 pr-4">
                <Forms.FormGroupInputText
                  labelText="得意先"
                  name="c_customer_name"
                  value={(inquiry.conditions as any).c_customer_name ?? ''}
                  onChange={inquiry.onChange as any}
                  maxLength={20}
                  removeOptionalLabel
                />
              </div>

              <div className="w-1/2 max-w-sm mt-2 pr-4">
                <Forms.FormGroupInputText
                  labelText="担当者"
                  name="c_user_name"
                  value={(inquiry.conditions as any).c_user_name ?? ''}
                  onChange={inquiry.onChange as any}
                  onCompositionStart={onCompositionStart}
                  onCompositionEnd={onCompositionEnd}
                  maxLength={20}
                  removeOptionalLabel
                />
              </div>
            </div>

            <div className="flex">
              <div className="w-1/2 max-w-sm mt-2 pr-4">
                <Forms.FormGroupInputText
                  labelText="品番"
                  name="c_item_number"
                  value={(inquiry.conditions as any).c_item_number ?? ''}
                  onChange={inquiry.onChange as any}
                  maxLength={20}
                  removeOptionalLabel
                />
              </div>

              <div className="w-1/2 max-w-sm mt-2 pr-4">
                <Forms.FormGroupInputText
                  labelText="品名"
                  name="c_name"
                  value={(inquiry.conditions as any).c_name ?? ''}
                  onChange={inquiry.onChange as any}
                  maxLength={20}
                  removeOptionalLabel
                />
              </div>
            </div>

            <div className="max-w-sm mt-2 pr-4">
              <Forms.FormGroupInputText
                labelText="注文番号"
                name="c_order_no"
                value={(inquiry.conditions as any).c_order_no ?? ''}
                onChange={inquiry.onChange as any}
                maxLength={20}
                removeOptionalLabel
              />
            </div>
          </>
        ) : (
          <div className="shop-mail-ec-search">
            <div className="shop-mail-ec-search-grid">
              <div className="shop-mail-ec-label">伝票状態</div>
              <div className="shop-mail-ec-field">
                <select
                  name="order_state"
                  value={ecConditions.order_state}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                >
                  <option value="">-</option>
                  <option value="受注">受注</option>
                  <option value="売上">売上</option>
                </select>
              </div>

              <div className="shop-mail-ec-label">伝票番号</div>
              <div className="shop-mail-ec-field">
                <input
                  type="text"
                  name="slip_no"
                  value={ecConditions.slip_no}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                />
              </div>

              <div className="shop-mail-ec-label">売上形態</div>
              <div className="shop-mail-ec-field">
                <select
                  name="sales_form"
                  value={ecConditions.sales_form}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                >
                  <option value="">-</option>
                  <option value="1">PC</option>
                  <option value="2">スマフォ</option>
                  <option value="3">タブレット</option>
                </select>
              </div>

              <div className="shop-mail-ec-label">合計金額</div>
              <div className="shop-mail-ec-field">
                <div className="shop-mail-range">
                  <input
                    type="number"
                    name="total_amount_min"
                    value={ecConditions.total_amount_min}
                    onChange={onChangeEcCondition}
                    className="shop-mail-form-control shop-mail-range-input"
                  />
                  <span className="shop-mail-range-suffix">円</span>
                  <span className="shop-mail-range-separator">～</span>
                  <input
                    type="number"
                    name="total_amount_max"
                    value={ecConditions.total_amount_max}
                    onChange={onChangeEcCondition}
                    className="shop-mail-form-control shop-mail-range-input"
                  />
                  <span className="shop-mail-range-suffix">円</span>
                </div>
              </div>

              <div className="shop-mail-ec-label">氏名</div>
              <div className="shop-mail-ec-field">
                <input
                  type="text"
                  name="buyer_name"
                  value={ecConditions.buyer_name}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                />
              </div>

              <div className="shop-mail-ec-label" />
              <div className="shop-mail-ec-field" />

              <div className="shop-mail-ec-label">購入者メールアドレス</div>
              <div className="shop-mail-ec-field">
                <input
                  type="text"
                  name="buyer_email"
                  value={ecConditions.buyer_email}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                />
              </div>

              <div className="shop-mail-ec-label">支払い種別</div>
              <div className="shop-mail-ec-field">
                <select
                  name="payment_type"
                  value={ecConditions.payment_type}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                >
                  <option value="">-</option>
                  <option value="3">宅配代引き</option>
                  <option value="4">銀行振り込み</option>
                  <option value="5">クレジットカード</option>
                </select>
              </div>

              <div className="shop-mail-ec-label">発送状況</div>
              <div className="shop-mail-ec-field">
                <select
                  name="shipped_status"
                  value={ecConditions.shipped_status}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                >
                  <option value="">-</option>
                  <option value="0">未発送</option>
                  <option value="1">発送済み</option>
                </select>
              </div>

              <div className="shop-mail-ec-label">入金状況</div>
              <div className="shop-mail-ec-field">
                <select
                  name="paid_status"
                  value={ecConditions.paid_status}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                >
                  <option value="">-</option>
                  <option value="0">未入金</option>
                  <option value="1">入金済み</option>
                </select>
              </div>

              <div className="shop-mail-ec-label">購入者電話番号</div>
              <div className="shop-mail-ec-field">
                <input
                  type="text"
                  name="buyer_tel"
                  value={ecConditions.buyer_tel}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                />
              </div>

              <div className="shop-mail-ec-label">個別返信メール送信状況</div>
              <div className="shop-mail-ec-field">
                <select
                  name="reply_mail_status"
                  value={ecConditions.reply_mail_status}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                >
                  <option value="">-</option>
                  <option value="0">未送信</option>
                  <option value="1">送信</option>
                </select>
              </div>

              <div className="shop-mail-ec-label">取消状況</div>
              <div className="shop-mail-ec-field">
                <select
                  name="cancel_status"
                  value={ecConditions.cancel_status}
                  onChange={onChangeEcCondition}
                  className="shop-mail-form-control"
                >
                  <option value="">-</option>
                  <option value="0">未取り消し</option>
                  <option value="1">取り消し済み</option>
                </select>
              </div>

              <div className="shop-mail-ec-label" />
              <div className="shop-mail-ec-field" />

              <div className="shop-mail-ec-date-line">
                <div className="shop-mail-ec-date-line-label">請求日</div>
                <div className="shop-mail-ec-date-line-field">
                  <DateSelectRange
                    fromName="invoice_date_from"
                    toName="invoice_date_to"
                    fromValue={ecConditions.invoice_date_from}
                    toValue={ecConditions.invoice_date_to}
                    onChange={onChangeEcCondition}
                  />
                </div>
              </div>

              <div className="shop-mail-ec-date-line">
                <div className="shop-mail-ec-date-line-label">入金日</div>
                <div className="shop-mail-ec-date-line-field">
                  <DateSelectRange
                    fromName="paid_date_from"
                    toName="paid_date_to"
                    fromValue={ecConditions.paid_date_from}
                    toValue={ecConditions.paid_date_to}
                    onChange={onChangeEcCondition}
                  />
                </div>
              </div>

              <div className="shop-mail-ec-date-line">
                <div className="shop-mail-ec-date-line-label">発送日</div>
                <div className="shop-mail-ec-date-line-field">
                  <DateSelectRange
                    fromName="shipped_date_from"
                    toName="shipped_date_to"
                    fromValue={ecConditions.shipped_date_from}
                    toValue={ecConditions.shipped_date_to}
                    onChange={onChangeEcCondition}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </BoxConditions>

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
