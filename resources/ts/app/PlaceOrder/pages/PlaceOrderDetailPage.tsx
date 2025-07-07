import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { PlaceOrderDetailDialog } from '../components/PlaceOrderDetailDialog';
import { usePlaceOrderDetailPage } from '../uses/usePlaceOrderDetailPage';
import { UserSearchDialog } from '@/app/User/components/UserSearchDialog';
import { ReceiveOrderSearchDialog } from '@/app/ReceiveOrder/components/ReceiveOrderSearchDialog';
import { numberFormat, getItemKindName } from '@/utils';

export type DetailPageProps = {
  from_receive: boolean;
} & RouteComponentProps<{ id: string }>;

/**
 * 発注データ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const PlaceOrderDetailPage: React.VFC<DetailPageProps> = ({ from_receive }) => {
  const title = '発注データ';
  const slug = 'place_order';
  const {
    isLoading,
    id,
    state,
    errors,
    userSearchDialogProps,
    receiveOrderSearchDialogProps,
    detailDialogProps,
    openUserDialog,
    openReceiveOrderDialog,
    onChangeDateWidthCalc,
    onChange,
    onClickAddDetail,
    onClickEditDetail,
    onClickSave,
    onClickDelete,
  } = usePlaceOrderDetailPage(slug, from_receive);

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
        <Forms.FormGroupInputDate
          labelText="発注日"
          name="place_order_date"
          value={state.place_order_date ?? ''}
          error={errors?.place_order_date}
          onChange={onChangeDateWidthCalc}
          groupClassName="mt-0"
          required
        />
        <div>
          <Forms.FormGroup labelText="担当者" error={errors?.user_id}>
            <div className="flex">
              <Forms.FormInputText
                name="user_name"
                value={state.user_name ?? ''}
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
        <div className="flex items-center">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="納期日数"
              name="delivery_day"
              value={state.delivery_day ?? ''}
              error={errors?.delivery_day}
              onChange={onChange}
              className="max-w-sm"
            />
          </div>
          <p className="text-xs mt-4 ml-4">入力された値がそのままメールに載ります　例）２営業日</p>
        </div>

        <hr className="border-dashed border-gray-400 mt-6" />
        <div className="p-6">
          <div className="flex items-center">
            <div className="text-sm">発注明細</div>
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
                <th className="w-20">種類</th>
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
                  <td>{getItemKindName(r.item_kind)}</td>
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

          <PlaceOrderDetailDialog
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
      <div className="flex justify-between">
        <button className="btn" onClick={onClickSave}>
          保存
        </button>
        {id && !from_receive && (
          <button className="btn-delete" onClick={onClickDelete}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
