import React, { useMemo} from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { CommonDataDetailDialog } from '@/app/App/components/CommonDataDetailDialog';
import { useSalesDetailPage } from '../uses/useSalesDetailPage';
import { CustomerSearchDialog } from '@/app/Customer/components/CustomerSearchDialog';
import { UserSearchDialog } from '@/app/User/components/UserSearchDialog';
import { ReceiveOrderSearchDialog } from '@/app/Sales/components/ReceiveOrderSearchDialog';
import { numberFormat, getItemKindName } from '@/utils';
import { useComposing } from '@/uses';
import classNames from 'classnames';
import { useZipcodeAddress } from '@/app/App/uses/useZipcodeAddress';

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
    onChangeDateWidthCalc,
    onChangeShippingAmount,
    onChangeAdditionalShippingAmount,
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

    // 追加：Square決済（売上画面から）
    onClickSquareComplete,
    onClickSquareCancel,
  } = useSalesDetailPage(slug, from_receive);

  const { searchAddressByZip, loading: isSearchingZip } = useZipcodeAddress();

  // ====== デバッグスイッチ（localStorage）======
  // ON:  localStorage.setItem('debug_sales','1')
  // OFF: localStorage.removeItem('debug_sales')
  const debugSales = useMemo(() => {
    try {
      return localStorage.getItem('debug_sales') === '1';
    } catch {
      return false;
    }
  }, []);

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
   * 送付フラグ（新: is_send / 旧: send_flg）互換
   */
  const sendFlag = useMemo(() => {
    const raw = (state as any)?.is_send ?? (state as any)?.send_flg ?? 0;
    return Number(raw) === 1;
  }, [(state as any)?.is_send, (state as any)?.send_flg]);

  /**
   * Square決済状態
   */
  const squarePaymentId = useMemo(() => {
    const v = (state as any)?.square_payment_id;
    if (v === null || v === undefined) return '';
    return String(v).trim();
  }, [(state as any)?.square_payment_id]);

  const squareStatus = useMemo(() => {
    const v = (state as any)?.square_status;
    if (v === null || v === undefined) return '';
    return String(v).trim();
  }, [(state as any)?.square_status]);

  const isCardTarget = useMemo(() => squarePaymentId !== '', [squarePaymentId]);

  const isSquareAuthorized = useMemo(() => isCardTarget && squareStatus === 'authorized', [
    isCardTarget,
    squareStatus,
  ]);
  const isSquareCanceled = useMemo(() => isCardTarget && squareStatus === 'canceled', [
    isCardTarget,
    squareStatus,
  ]);

  const disableActions = useMemo(() => {
    return Boolean(state.has_invoice) || isSquareAuthorized || isSquareCanceled;
  }, [state.has_invoice, isSquareAuthorized, isSquareCanceled]);

  /**
   * FormInputCheck の onChange 互換
   */
  const handleIsSendChange = (...args: any[]) => {
    if (args.length >= 2 && typeof args[0] === 'string') {
      const name = args[0];
      const value = args[1];
      onChange(name, value);
      return;
    }

    const e = args[0];
    const checked = !!e?.target?.checked;
    onChange('is_send', checked ? 1 : 0);
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
              <button
                className="btn"
                onClick={() => {
                  openReceiveOrderDialog();
                }}
              >
                受注取得
              </button>

              {/* ここで props を丸ごと表示（debugSales のときだけ） */}
              {debugSales && (
                <pre className="text-xs bg-gray-50 border p-2 mt-2 ml-2" style={{ maxWidth: 520 }}>
                  {JSON.stringify(
                    {
                      receiveOrderSearchDialogPropsKeys: Object.keys(
                        (receiveOrderSearchDialogProps as any) ?? {},
                      ),
                      // よくあるキー候補（存在したら値も見えるようにする）
                      isOpen: (receiveOrderSearchDialogProps as any)?.isOpen,
                      open: (receiveOrderSearchDialogProps as any)?.open,
                      onClose: !!(receiveOrderSearchDialogProps as any)?.onClose,
                      onConfirm: !!(receiveOrderSearchDialogProps as any)?.onConfirm,
                      onSelect: !!(receiveOrderSearchDialogProps as any)?.onSelect,
                      selectedKey: (receiveOrderSearchDialogProps as any)?.selectedKey,
                      selected_for: (receiveOrderSearchDialogProps as any)?.selected_for,
                    },
                    null,
                    2,
                  )}
                </pre>
              )}

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

        {isSquareAuthorized && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 py-2 px-4 text-sm mb-4">
            カード未決済（status: {squareStatus || 'unknown'}）のため、保存・書類発行はできません。
            「決済確定」または「注文キャンセル」を実行してください。
          </div>
        )}

        {isSquareCanceled && (
          <div className="bg-gray-100 border border-gray-400 text-gray-800 py-2 px-4 text-sm mb-4">
            カード決済がキャンセルされています。 保存・書類発行はできません。
          </div>
        )}

        <div className="flex max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputDate
              labelText="売上日"
              name="sales_at"
              value={state.sales_at ? state.sales_at.substring(0, 10).replace(/-/g, '/') : ''}
              error={errors?.sales_at}
              onChange={onChangeDateWidthCalc}
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
            {!state.has_invoice && isSquareAuthorized && (
              <div className=" bg-yellow-100 border border-yellow-500 text-yellow-700 px-2 text-center">
                カード未決済
              </div>
            )}
            {!state.has_invoice && isSquareCanceled && (
              <div className=" bg-gray-100 border border-gray-500 text-gray-700 px-2 text-center">
                キャンセル済
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
              <input type="hidden" name="customer_id" value={state.customer_id ?? ''} />
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
              required={sendFlag}
            />
          </div>

          <div className="w-1/6 mt-4 ml-4">
            <Forms.FormInputCheck
              labelText="発送"
              id="is_send"
              name="is_send"
              value={1}
              checked={sendFlag}
              onChange={handleIsSendChange as any}
            />
            <input type="hidden" name="is_send" value={sendFlag ? 1 : 0} />
            <input type="hidden" name="send_flg" value={sendFlag ? 1 : 0} />
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
              required={sendFlag}
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
          required={sendFlag}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !composing) {
                        onClickBarcode();
                      }
                    }}
                    maxLength={50}
                  />
                </div>
              </div>
              {errors?.barcode && <div className="form-error">{errors.barcode}</div>}
            </div>
            <div className="ml-auto flex justify-end items-center">
              <p className="text-xs flex-shrink-0 mr-2">※金額は全て税込価格です</p>
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
              {details.length === 0 && !state.receive_order_id && (
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
                      <button
                        type="button"
                        onClick={onClickEditDetail}
                        data-no={r?.no}
                        className="underline text-blue-600"
                      >
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
            {...detailDialogProps}
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
              labelText="別途追加送料"
              name="additional_shipping_amount"
              value={state.additional_shipping_amount}
              error={errors?.additional_shipping_amount}
              onChange={onChangeAdditionalShippingAmount}
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
            {isSquareAuthorized && (
              <>
                <button className="btn mr-3" onClick={onClickSquareComplete}>
                  決済確定
                </button>
                <button className="btn-delete mr-6" onClick={onClickSquareCancel}>
                  注文キャンセル
                </button>
              </>
            )}

            <button className="btn" onClick={onClickSave} disabled={disableActions}>
              保存
            </button>
            <button className="btn ml-6" onClick={onClickPrintDelivery} disabled={disableActions}>
              納品書発行
            </button>
            <button className="btn ml-6" onClick={onClickPrintInvoice} disabled={disableActions}>
              請求書発行
            </button>
          </div>
        </div>

        {id && !from_receive && (
          <button className="btn-delete" onClick={onClickDelete} disabled={disableActions}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
