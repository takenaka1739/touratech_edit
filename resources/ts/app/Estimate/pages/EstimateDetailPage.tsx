import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { CommonDataDetailDialog } from '@/app/App/components/CommonDataDetailDialog';
import { useEstimateDetailPage } from '../uses/useEstimateDetailPage';
import { CustomerSearchDialog } from '@/app/Customer/components/CustomerSearchDialog';
import { UserSearchDialog } from '@/app/User/components/UserSearchDialog';
import { numberFormat } from '@/utils';
import { useComposing } from '@/uses';

export type EstimateDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 見積データ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const EstimateDetailPage: React.VFC<EstimateDetailPageProps> = () => {
  const title = '見積データ';
  const slug = 'estimate';
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();
  const {
    isLoading,
    id,
    state,
    errors,
    customerSearchDialogProps,
    userSearchDialogProps,
    detailDialogProps,
    openCustomerDialog,
    openUserDialog,
    onChangeDateWidthCalc,
    onChange,
    onChangeShippingAmount,
    onChangeFee,
    onChangeDiscount,
    onClickAddDetail,
    onClickEditDetail,
    onClickSave,
    onClickPrint,
    onClickDelete,
    onClickBarcode,
    onClickCreateCustomer,
  } = useEstimateDetailPage(slug);

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={`${title}詳細`}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        {errors?.has_receive_order && (
          <div className="bg-red-200 py-2 px-4 text-sm">{errors?.has_receive_order}</div>
        )}
        <div className="flex max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputDate
              labelText="見積日"
              name="estimate_date"
              value={state.estimate_date ?? ''}
              error={errors?.estimate_date}
              onChange={onChangeDateWidthCalc}
              groupClassName="mt-0"
              required
            />
          </div>
          <div className="w-2/5">
            <Forms.FormGroupInputDate
              labelText="納入期日"
              name="delivery_date"
              value={state.delivery_date ?? ''}
              error={errors?.delivery_date}
              onChange={onChange}
              groupClassName="mt-0"
            />
          </div>
          <div className="w-1/5">
            {state.has_receive_order && (
              <div className=" bg-red-100 border border-red-500 text-red-500 px-2 text-center">
                受注済
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
              required={state.send_flg}
            />
          </div>
          <div className="w-1/6 mt-4 ml-4">
            <Forms.FormInputCheck
              labelText="発送"
              id="send_flg"
              name="send_flg"
              checked={state.send_flg}
              onChange={onChange}
            />
          </div>
          <div className="w-1/6 mt-4">
            <button className="btn" onClick={onClickCreateCustomer}>
              得意先追加
            </button>
          </div>
        </div>
        <Forms.FormGroupInputZipCode
          labelText="郵便番号"
          name="zip_code"
          value={state.zip_code ?? ''}
          error={errors?.zip_code}
          onChange={onChange}
          required={state.send_flg}
        />
        <Forms.FormGroupInputText
          labelText="住所1"
          name="address1"
          value={state.address1 ?? ''}
          error={errors?.address1}
          onChange={onChange}
          required={state.send_flg}
          maxLength={30}
        />
        <Forms.FormGroupInputText
          labelText="住所2"
          name="address2"
          value={state.address2 ?? ''}
          error={errors?.address2}
          onChange={onChange}
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
              {errors?.barcode && <div className="form-error">{errors.barcode}</div>}
            </div>
            <div className="ml-auto flex justify-end items-center">
              <p className="text-xs flex-shrink-0 mr-2">※金額は全て税込価格です</p>
              <button className="btn" onClick={onClickAddDetail}>
                新規追加
              </button>
            </div>
          </div>
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-6">&nbsp;</th>
                <th>品番・商品名</th>
                <th className="w-24">定価</th>
                <th className="w-16">掛率</th>
                <th className="w-24">単価</th>
                <th className="w-16">数量</th>
                <th className="w-28">金額</th>
                <th className="w-16">編集</th>
              </tr>
            </thead>
            <tbody>
              {state.details.map(r => (
                <tr key={r.no}>
                  <td className="text-center">{r.no}</td>
                  <td>
                    <div className="text-xs">{r.item_number}</div>
                    <div>{r.item_name}</div>
                    <div>{r.item_name_jp}</div>
                  </td>
                  <td className="text-right">{numberFormat(r.sales_unit_price, 2)}</td>
                  <td className="text-right">{r.rate}</td>
                  <td className="text-right">{numberFormat(r.unit_price, 2)}</td>
                  <td className="text-right">{r.quantity}</td>
                  <td className="text-right">{numberFormat(r.amount, 0)}</td>
                  <td className="col-btn">
                    <span onClick={onClickEditDetail} data-no={r.no}>
                      編集
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors?.details && <div className="form-error mt-2">{errors.details}</div>}

          <CommonDataDetailDialog
            title={title}
            slug={slug}
            {...detailDialogProps}
            fraction={state.fraction}
            salesTaxRate={state.sales_tax_rate ?? 0}
          />
        </div>
        <div className="flex max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="送料"
              name="shipping_amount"
              value={state.shipping_amount}
              error={errors?.shipping_amount}
              onChange={onChangeShippingAmount}
              precision={2}
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
              min={0}
            />
          </div>
        </div>
        <div className="flex">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="合計金額"
              name="total_amount"
              value={numberFormat(state.total_amount, 0)}
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
          onChange={onChange}
        />
      </div>
      <div className="flex justify-between">
        <div>
          <button className="btn" onClick={onClickSave} disabled={state.has_receive_order}>
            保存
          </button>
          {id && (
            <button className="btn ml-6" onClick={onClickPrint}>
              見積書発行
            </button>
          )}
        </div>
        {id && (
          <button className="btn-delete" onClick={onClickDelete} disabled={state.has_receive_order}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
