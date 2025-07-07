import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { PurchaseDetailDialog } from '../components/PurchaseDetailDialog';
import { usePurchaseDetailPage } from '@/app/Purchase/uses/usePurchaseDetailPage';
import { UserSearchDialog } from '@/app/User/components/UserSearchDialog';
import { PlaceOrderSearchDialog } from '@/app/PlaceOrder/components/PlaceOrderSearchDialog';
import { numberFormat } from '@/utils';

export type DetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 仕入データ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const PurchaseDetailPage: React.VFC<DetailPageProps> = () => {
  const title = '仕入データ';
  const slug = 'purchase';
  const {
    isLoading,
    id,
    state,
    errors,
    userSearchDialogProps,
    placeOrderSearchDialogProps,
    detailDialogProps,
    openUserDialog,
    openPlaceOrderDialog,
    onChangeDateWidthCalc,
    onChange,
    onClickAddDetail,
    onClickEditDetail,
    onClickSave,
    onClickDelete,
  } = usePurchaseDetailPage(slug);

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={`${title}詳細`}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group flex justify-between">
        <div className="flex items-center">
          {!id && (
            <>
              <button className="btn" onClick={openPlaceOrderDialog}>
                発注取得
              </button>
              <PlaceOrderSearchDialog {...placeOrderSearchDialogProps} />
            </>
          )}
          <div className="flex items-center ml-6">
            <label className="label w-12">発注ID</label>
            <div className="w-20">
              <Forms.FormInputText
                name="place_order_id"
                value={state.place_order_id ?? ''}
                className="text-right"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      <div className="form-group-wrapper">
        <Forms.FormGroupInputDate
          labelText="仕入日"
          name="purchase_date"
          value={state.purchase_date ?? ''}
          error={errors?.purchase_date}
          onChange={onChangeDateWidthCalc}
          groupClassName="mt-0"
          required
        />
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

        <hr className="border-dashed border-gray-400 mt-6" />
        <div className="p-6">
          <div className="flex items-center">
            <div className="text-sm">仕入明細</div>
            <div className="ml-auto flex justify-end items-center">
              <p className="text-xs flex-shrink-0 mr-2">※金額は全て税込価格です</p>
              <div className="form-group">
                <button className="btn" onClick={onClickAddDetail}>
                  新規追加
                </button>
              </div>
            </div>
          </div>
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-6">&nbsp;</th>
                <th>品番・商品名</th>
                <th className="w-24">単価</th>
                <th className="w-24">数量</th>
                <th className="w-32">金額</th>
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
                  <td className="text-right">{numberFormat(r.unit_price, 2)}</td>
                  <td className="text-right">{r.quantity}</td>
                  <td className="text-right">{numberFormat(r.amount, 0)}</td>
                  <td className="col-btn">
                    <span onClick={onClickEditDetail} data-id={r.no}>
                      編集
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors?.details && <div className="form-error ml-2">{errors.details}</div>}

          <PurchaseDetailDialog
            title={title}
            slug={slug}
            {...detailDialogProps}
            fraction={state.fraction}
            salesTaxRate={state.sales_tax_rate ?? 0}
          />
        </div>
        <div className="flex">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="合計金額"
              name="total_amount"
              value={numberFormat(state.total_amount, 0)}
              className="max-w-8 text-right"
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
      <div className="form-group flex justify-between">
        <button className="btn" onClick={onClickSave}>
          保存
        </button>
        {id && (
          <button className="btn-delete" onClick={onClickDelete}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
