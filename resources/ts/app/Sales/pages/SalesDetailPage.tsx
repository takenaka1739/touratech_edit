// resources/ts/app/Sales/pages/SalesDetailPage.tsx
// [UPDATE] resources/ts/app/Sales/pages/SalesDetailPage.tsx
import React, { useMemo, useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { CommonDataDetailDialog } from '@/app/App/components/CommonDataDetailDialog';
import { useSalesDetailPage } from '../uses/useSalesDetailPage';
import { CustomerSearchDialog } from '@/app/Customer/components/CustomerSearchDialog';
import { UserSearchDialog } from '@/app/User/components/UserSearchDialog';
import { ReceiveOrderSearchDialog } from '@/app/ReceiveOrder/components/ReceiveOrderSearchDialog';
import { numberFormat, getItemKindName } from '@/utils';
import { useComposing } from '@/uses';
import classNames from 'classnames';
import { useZipcodeAddress } from '@/app/App/uses/useZipcodeAddress';
import axios from 'axios';

export type DetailPageProps = {
  from_receive: boolean;
} & RouteComponentProps<{ id: string }>;

/**
 * 売上データ（詳細）画面 Component
 */
export const SalesDetailPage: React.VFC<DetailPageProps> = ({ from_receive }) => {
  const title = '売上データ';
  const slug = 'sales';
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();
  const {
    isLoading,
    id,
    state,
    errors,
    customerSearchDialogProps,
    userSearchDialogProps,
    receiveOrderSearchDialogProps,
    detailDialogProps,
    openCustomerDialog,
    openUserDialog,
    openReceiveOrderDialog,
    onChange,
    onChangeShippingAmount,
    onChangeFee,
    onChangeDiscount,
    onClickAddDetail,
    onClickEditDetail,
    onClickSave,
    onClickPrintDelivery,
    onClickPrintInvoice,
    onClickDelete,
    onClickBarcode,
    onClickCreateCustomer,
  } = useSalesDetailPage(slug, from_receive);

  const { searchAddressByZip, loading: isSearchingZip } = useZipcodeAddress();

  /**
   * CSRF 対策 + Sales API 送信payloadログ（discountがどこで消えるか確定する）
   */
  useEffect(() => {
    axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
    axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
    axios.defaults.withCredentials = true;

    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='));
    if (cookie) {
      const raw = cookie.split('=')[1] ?? '';
      try {
        const token = decodeURIComponent(raw);
        axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
      } catch {
        axios.defaults.headers.common['X-XSRF-TOKEN'] = raw;
      }
    }
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    // ===== 追加：Sales API への送信payloadを確定ログ =====
    const interceptorId = axios.interceptors.request.use((config) => {
      const url = config.url ?? '';
      const method = (config.method ?? '').toLowerCase();

      const isSalesApi =
        url.includes('/api/sales/') ||
        url.includes(`/api/${slug}/`);

      const isTargetMethod = method === 'post' || method === 'put';

      if (isSalesApi && isTargetMethod) {
        const data: any = config.data;

        const parsed = (() => {
          if (!data) return undefined;
          if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return { __raw: data }; }
          }
          return data;
        })();

        const details = Array.isArray(parsed?.details) ? parsed.details : [];

        console.log('[SalesDetailPage][axios request]', {
          method,
          url,
          header: {
            id: parsed?.id,
            sales_at: parsed?.sales_at,
            customer_id: parsed?.customer_id,
            sales_tax_rate: parsed?.sales_tax_rate,
          },
          details_len: details.length,
          details_preview: details.slice(0, 5).map((d: any) => ({
            id: d?.id,
            no: d?.no,
            item_id: d?.item_id,
            discount: d?.discount,
            unit_price: d?.unit_price,
            quantity: d?.quantity,
            amount: d?.amount,
            sales_tax: d?.sales_tax,
            sales_tax_rate: d?.sales_tax_rate,
          })),
        });
      }

      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * state snapshot ログ
   */
  useEffect(() => {
    console.log('[SalesDetailPage] state snapshot', {
      id,
      from_receive,
      isLoading,
      sales_tax_rate: state?.sales_tax_rate,
      fraction: state?.fraction,
      corporate_class: state?.corporate_class,
      payment_id: (state as any)?.payment_id,
      details_len: Array.isArray((state as any)?.details) ? (state as any).details.length : 0,
      details_discount_preview: Array.isArray((state as any)?.details)
        ? (state as any).details.slice(0, 5).map((d: any) => ({
            no: d?.no,
            id: d?.id,
            item_id: d?.item_id,
            discount: d?.discount,
          }))
        : [],
    });
  }, [id, from_receive, isLoading, state?.sales_tax_rate, state?.fraction, (state as any)?.details]);

  /**
   * モーダルprops ログ
   */
  useEffect(() => {
    console.log('[SalesDetailPage] props for CommonDataDetailDialog', {
      fraction: state?.fraction,
      salesTaxRateProp: state?.sales_tax_rate ?? 0,
      detailDialogPropsKeys: detailDialogProps ? Object.keys(detailDialogProps as any) : [],
    });
  }, [state?.fraction, state?.sales_tax_rate, detailDialogProps]);

  const setFieldValue = (name: string, value: any) => {
    onChange(name, value);
  };

  const handleSearchAddressByZip = async () => {
    const address = await searchAddressByZip(state.zip_code ?? '');
    if (address) {
      setFieldValue('address1', address);
    }
  };

  const details = useMemo(
    () => (Array.isArray(state?.details) ? state.details : []),
    [state?.details],
  );
  const safeNumber = (v: number | string | undefined, p: number = 0) =>
    numberFormat((v as number) ?? 0, p);

  /**
   * details監視ログ（discount確認用）
   */
  useEffect(() => {
    console.log('[SalesDetailPage] details changed', {
      len: details.length,
      first: details[0]
        ? {
            no: (details[0] as any)?.no,
            id: (details[0] as any)?.id,
            item_id: (details[0] as any)?.item_id,
            discount: (details[0] as any)?.discount,
            amount: (details[0] as any)?.amount,
          }
        : null,
      preview: details.slice(0, 10).map((d: any) => ({
        no: d?.no,
        id: d?.id,
        item_id: d?.item_id,
        discount: d?.discount,
        unit_price: d?.unit_price,
        quantity: d?.quantity,
        amount: d?.amount,
      })),
    });
  }, [details]);

  /**
   * detailDialogProps callback をラップ（onSelected/onDeletedでdiscountが入っているか確認）
   */
  const detailDialogPropsWithLog = useMemo(() => {
    const p: any = detailDialogProps ?? {};

    const wrapSelected = (orig?: (d: any) => void) => (d: any) => {
      console.log('[SalesDetailPage] detailDialogProps.onSelected RECEIVED', {
        no: d?.no,
        id: d?.id,
        item_id: d?.item_id,
        discount: d?.discount,
        amount: d?.amount,
        sales_tax: d?.sales_tax,
        sales_tax_rate: d?.sales_tax_rate,
        keys: d ? Object.keys(d) : [],
      });

      const before = Array.isArray((state as any)?.details) ? (state as any).details : [];
      console.log('[SalesDetailPage] BEFORE onSelected (state.details)', {
        len: before.length,
        preview: before.slice(0, 10).map((x: any) => ({
          no: x?.no,
          id: x?.id,
          item_id: x?.item_id,
          discount: x?.discount,
          amount: x?.amount,
        })),
      });

      orig?.(d);

      setTimeout(() => {
        const after = Array.isArray((state as any)?.details) ? (state as any).details : [];
        console.log('[SalesDetailPage] AFTER onSelected (state.details)', {
          len: after.length,
          preview: after.slice(0, 10).map((x: any) => ({
            no: x?.no,
            id: x?.id,
            item_id: x?.item_id,
            discount: x?.discount,
            amount: x?.amount,
          })),
        });
      }, 0);
    };

    const wrapDeleted = (orig?: (no: number) => void) => (no: number) => {
      console.log('[SalesDetailPage] detailDialogProps.onDeleted RECEIVED', { no });
      orig?.(no);
      setTimeout(() => {
        const after = Array.isArray((state as any)?.details) ? (state as any).details : [];
        console.log('[SalesDetailPage] AFTER onDeleted (state.details)', {
          len: after.length,
          preview: after.slice(0, 10).map((x: any) => ({
            no: x?.no,
            id: x?.id,
            item_id: x?.item_id,
            discount: x?.discount,
            amount: x?.amount,
          })),
        });
      }, 0);
    };

    return {
      ...p,
      onSelected: wrapSelected(p.onSelected),
      onDeleted: wrapDeleted(p.onDeleted),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailDialogProps, state]);

  /**
   * 保存直前ログ + 元の保存処理
   */
  const onClickSaveWithLog = async () => {
    console.log('[SalesDetailPage] BEFORE onClickSave payload snapshot', {
      header: {
        id,
        sales_at: state?.sales_at,
        customer_id: state?.customer_id,
        sales_tax_rate: state?.sales_tax_rate,
      },
      details_len: details.length,
      details_preview: details.slice(0, 5).map((d: any) => ({
        id: d?.id,
        no: d?.no,
        item_id: d?.item_id,
        discount: d?.discount,
        unit_price: d?.unit_price,
        quantity: d?.quantity,
        amount: d?.amount,
        sales_tax: d?.sales_tax,
        sales_tax_rate: d?.sales_tax_rate,
      })),
    });

    await onClickSave();
  };

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={`${title}詳細`}
      breadcrumb={[
        { name: state.prev_title ?? title, url: state.prev_url },
        { name: `${title}詳細` },
      ]}
      isLoading={isLoading}
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          {!id && (
            <>
              <button className="btn" onClick={openReceiveOrderDialog}>
                受注取得
              </button>
              <ReceiveOrderSearchDialog {...receiveOrderSearchDialogProps} />
            </>
          )}
          <div className="flex items-center ml-6">
            <label className="label w-12">受注ID</label>
            <div className="w-20">
              <Forms.FormInputText
                name="receive_order_id"
                value={state.receive_order_id ?? ''}
                className="text-right"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <div className="form-group-wrapper">
        {errors?.has_invoice && (
          <div className="bg-red-200 py-2 px-4 text-sm">{errors?.has_invoice}</div>
        )}

        <div className="flex max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputDate
              labelText="売上日"
              name="sales_at"
              value={
                state.sales_at
                  ? state.sales_at.substring(0, 10).replace(/-/g, '/')
                  : ''
              }
              error={errors?.sales_at}
              onChange={onChange}
              groupClassName="mt-0"
              required
            />
          </div>
          <div className="w-2/5"></div>
          <div className="w-1/5">
            {state.has_invoice && (
              <div className=" bg-red-100 border border-red-500 text-red-500 px-2 text-center">
                請求済
              </div>
            )}
          </div>
        </div>

        <div>
          <Forms.FormGroup labelText="得意先" error={errors?.customer_id}>
            <div className="flex">
              <Forms.FormInputText
                name="customer_name"
                value={state.customer_name ?? '上様'}
                error={errors?.customer_id}
                className="max-w-lg"
                readOnly
              />
              <input
                type="hidden"
                name="customer_id"
                value={state.customer_id ?? ''}
              />
              <button className="btn ml-2 py-0 px-2" onClick={openCustomerDialog}>
                ...
              </button>
            </div>
          </Forms.FormGroup>
          <CustomerSearchDialog {...customerSearchDialogProps} />
        </div>

        <div className="flex max-w-4xl">
          <div className="w-4/6">
            <Forms.FormGroupInputText
              labelText="届け先名"
              name="name"
              value={state.name ?? ''}
              error={errors?.name}
              onChange={onChange}
              className="max-w-lg"
              required={state.send_flg}
            />
          </div>
          <div className="w-1/6 mt-4 ml-4">
            <Forms.FormInputCheck
              labelText="発送"
              id="send_flg"
              name="send_flg"
              value={1}
              checked={!!state.send_flg}
              onChange={onChange}
            />
          </div>
          <div className="w-1/6 mt-4">
            <button className="btn" onClick={onClickCreateCustomer}>
              得意先追加
            </button>
          </div>
        </div>

        <div className="flex items-end max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputZipCode
              labelText="郵便番号"
              name="zip_code"
              value={state.zip_code ?? ''}
              error={errors?.zip_code}
              onChange={onChange}
              required={state.send_flg}
            />
          </div>
          <div className="ml-2" style={{ position: 'relative', top: '1px' }}>
            <button
              type="button"
              className="btn"
              onClick={handleSearchAddressByZip}
              disabled={isSearchingZip}
            >
              {isSearchingZip ? '検索中...' : '住所検索'}
            </button>
          </div>
        </div>

        <Forms.FormGroupInputText
          labelText="住所1"
          name="address1"
          value={state.address1 ?? ''}
          error={errors?.address1}
          onChange={onChange}
          className="max-w-lg"
          required={state.send_flg}
          maxLength={30}
        />
        <Forms.FormGroupInputText
          labelText="住所2"
          name="address2"
          value={state.address2 ?? ''}
          error={errors?.address2}
          onChange={onChange}
          className="max-w-lg"
          maxLength={30}
        />

        <div className="flex max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputTel
              labelText="TEL"
              name="tel"
              value={state.tel ?? ''}
              error={errors?.tel}
              onChange={onChange}
              required
            />
          </div>
          <div className="w-2/5">
            <Forms.FormGroupInputTel
              labelText="FAX"
              name="fax"
              value={state.fax ?? ''}
              error={errors?.fax}
              onChange={onChange}
            />
          </div>
        </div>

        <Forms.FormCorporateClass
          corporateClass={state.corporate_class}
          error={errors?.corporate_class}
          required
          onChange={onChange}
        />

        <div>
          <Forms.FormGroup labelText="担当者" error={errors?.user_id}>
            <div className="flex">
              <Forms.FormInputText
                name="user_name"
                value={state.user_name}
                error={errors?.user_id}
                className="max-w-lg"
                readOnly
              />
              <input type="hidden" name="user_id" value={state.user_id ?? ''} />
              <button className="btn ml-2 py-0 px-2" onClick={openUserDialog}>
                ...
              </button>
            </div>
          </Forms.FormGroup>
          <UserSearchDialog {...userSearchDialogProps} />
        </div>

        <Forms.FormGroupInputText
          labelText="注文番号"
          name="order_no"
          value={state.order_no ?? ''}
          error={errors?.order_no}
          onChange={onChange}
          className="max-w-xs"
          maxLength={20}
        />

        <hr className="border-dashed border-gray-400 mt-6" />
        <div className="p-6">
          <div className="flex items-center">
            <div>
              <div className="flex items-center form-group py-2">
                <label className="label mr-2">バーコード</label>
                <div className="flex-grow">
                  <Forms.FormInputText
                    name="barcode"
                    className="input w-full"
                    value={state.barcode ?? ''}
                    onChange={onChange}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !composing) {
                        onClickBarcode();
                      }
                    }}
                    maxLength={50}
                  />
                </div>
              </div>
              {errors?.barcode && (
                <div className="form-error">{errors.barcode}</div>
              )}
            </div>
            <div className="ml-auto flex justify-end items-center">
              <p className="text-xs flex-shrink-0 mr-2">
                ※金額は全て税込価格です
              </p>
              {!state.receive_order_id && (
                <button className="btn" onClick={onClickAddDetail}>
                  新規追加
                </button>
              )}
            </div>
          </div>

          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-6">&nbsp;</th>
                <th className="w-20">種類</th>
                <th>品番・商品名</th>
                <th className="w-24">定価</th>
                <th className="w-16">掛率</th>
                <th className="w-24">単価</th>
                <th className="w-16">数量</th>
                <th className="w-24">割引</th>
                <th className="w-28">金額</th>
                <th className="w-16">編集</th>
              </tr>
            </thead>

            <tbody>
              {details.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-sm text-gray-500">
                    明細がありません。バーコード入力または「新規追加」から追加してください。
                  </td>
                </tr>
              )}

              {details.map((r: any, idx: number) => {
                const key = `${r?.id ?? 'tmp'}-${r?.no ?? idx}`;
                return (
                  <tr key={key}>
                    <td className="text-center">{r?.id ?? r?.no}</td>
                    <td>{getItemKindName(r?.item_kind)}</td>
                    <td>
                      <div className="text-xs">{r?.item_number}</div>
                      <div>{r?.item_name}</div>
                      <div>{r?.item_name_note}</div>
                    </td>
                    <td className="text-right">{safeNumber(r?.sales_unit_price, 2)}</td>
                    <td className="text-right">{r?.rate ?? ''}</td>
                    <td className="text-right">{safeNumber(r?.unit_price, 2)}</td>
                    <td
                      className={classNames(
                        'text-right',
                        errors && (`quantity_${r?.id ?? r?.no}` in errors) ? 'bg-red-200' : '',
                      )}
                    >
                      {r?.quantity}
                    </td>
                    <td className="text-right">{numberFormat((r as any).discount ?? 0, 0)}</td>
                    <td className="text-right">{safeNumber(r?.amount, 0)}</td>
                    <td className="col-btn">
                      <button type="button" onClick={onClickEditDetail} data-no={r?.no} className="underline">
                        編集
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {errors?.details && <div className="form-error ml-2">{errors.details}</div>}
          {errors?.quantity && <div className="form-error ml-2">{errors.quantity}</div>}

          <CommonDataDetailDialog
            title={title}
            slug={slug}
            {...detailDialogPropsWithLog}
            fraction={state.fraction}
            salesTaxRate={state.sales_tax_rate ?? 0}
          />
        </div>

        <div className="flex">
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="送料"
              name="shipping_amount"
              value={state.shipping_amount}
              error={errors?.shipping_amount}
              onChange={onChangeShippingAmount}
              precision={2}
              className="max-w-8 text-right"
              min={0}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="代引手数料"
              name="fee"
              value={state.fee}
              error={errors?.fee}
              onChange={onChangeFee}
              precision={2}
              className="max-w-8 text-right"
              min={0}
            />
          </div>
        </div>

        <div className="flex">
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="値引"
              name="discount"
              value={state.discount}
              error={errors?.discount}
              onChange={onChangeDiscount}
              precision={2}
              className="max-w-8 text-right"
              min={0}
            />
          </div>
        </div>

        <div className="flex">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="合計金額"
              name="total_amount"
              value={numberFormat(state.total_amount ?? 0, 0)}
              className="max-w-8 text-right text-sm"
              removeOptionalLabel
              readOnly
            />
          </div>
        </div>

        <Forms.FormGroupTextarea
          labelText="備考"
          name="remarks"
          value={state.remarks ?? ''}
          error={errors?.remarks}
          className="max-w-lg"
          onChange={onChange}
        />
      </div>

      <div className="flex justify-between">
        <div className="flex items-center">
          <div>
            <button className="btn" onClick={onClickSaveWithLog} disabled={state.has_invoice}>
              保存
            </button>
            <button className="btn ml-6" onClick={onClickPrintDelivery}>
              納品書発行
            </button>
            <button className="btn ml-6" onClick={onClickPrintInvoice}>
              請求書発行
            </button>
          </div>
        </div>
        {id && !from_receive && (
          <button className="btn-delete" onClick={onClickDelete} disabled={state.has_invoice}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
