import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { useReceiptDetailPage } from '../uses/useReceiptDetailPage';
import { CustomerSearchDialog } from '@/app/Customer/components/CustomerSearchDialog';
import { UserSearchDialog } from '@/app/User/components/UserSearchDialog';
import { numberFormat } from '@/utils';

export type ReceiptDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 見積データ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const ReceiptDetailPage: React.VFC<ReceiptDetailPageProps> = () => {
  const title = '入金データ';
  const slug = 'receipt';
  const {
    isLoading,
    id,
    state,
    errors,
    customerSearchDialogProps,
    userSearchDialogProps,
    openCustomerDialog,
    openUserDialog,
    onChange,
    onClickSave,
    onClickDelete,
  } = useReceiptDetailPage(slug);

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={`${title}詳細`}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        {errors?.has_invoice && (
          <div className="bg-red-200 py-2 px-4 text-sm">{errors?.has_invoice}</div>
        )}
        <div className="flex max-w-2xl">
          <Forms.FormGroupInputDate
            labelText="入金日"
            name="receipt_date"
            value={state.receipt_date ?? ''}
            error={errors?.receipt_date}
            onChange={onChange}
            groupClassName="mt-0"
            required
          />
        </div>
        <div>
          <Forms.FormGroup labelText="得意先" required error={errors?.customer_id}>
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
        <div className="flex">
          <div className="w-2/5">
            <Forms.FormGroupInputText
              labelText="前月売上額"
              name="last_month_sales"
              value={numberFormat(state.last_month_sales, 0)}
              className="max-w-8 text-right"
              removeOptionalLabel
              readOnly
            />
          </div>
          <div className="w-2/5">
            <Forms.FormGroupInputText
              labelText="売掛金残高"
              name="accounts_receivable"
              value={numberFormat(state.accounts_receivable, 0)}
              className="max-w-8 text-right"
              removeOptionalLabel
              readOnly
            />
          </div>
        </div>
        <div>
          <Forms.FormGroup labelText="担当者" required error={errors?.user_id}>
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
        <div className="flex">
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="入金額"
              name="total_amount"
              value={state.total_amount}
              error={errors?.total_amount}
              onChange={onChange}
              precision={0}
              className="max-w-8"
              required
              min={0}
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
        <div>
          <button className="btn" onClick={onClickSave}>
            保存
          </button>
        </div>
        {id && (
          <button className="btn-delete" onClick={onClickDelete}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
