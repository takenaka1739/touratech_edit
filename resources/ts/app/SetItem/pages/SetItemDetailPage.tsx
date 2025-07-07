import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { SetItemDetailDialog } from '../components/SetItemDetailDialog';
import { useSetItemDetailPage } from '../uses/useSetItemDetailPage';
import { numberFormat } from '@/utils';

export type SetItemDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * セット品マスタ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const SetItemDetailPage: React.VFC<SetItemDetailPageProps> = () => {
  const title = 'セット品マスタ詳細';
  const slug = 'set_item';
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    detailDialogProps,
    onChange,
    onClickAddDetail,
    onClickEditDetail,
    onClickSave,
    onClickDelete,
  } = useSetItemDetailPage(slug);

  return (
    <PageWrapper
      prefix="set-item-detail"
      title={title}
      breadcrumb={[{ name: 'セット品マスタ', url: `/${slug}` }, { name: title }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <Forms.FromGroupInputItemNumber
          labelText="セット品番"
          name="item_number"
          value={state.item_number ?? ''}
          error={errors?.item_number}
          onChange={onChange}
          groupClassName="mt-0"
          className="max-w-lg"
          required
          autoFocus
        />
        <Forms.FormGroupInputText
          labelText="セット品名"
          name="name_jp"
          value={state.name_jp}
          error={errors?.name_jp}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={200}
        />
        <Forms.FormGroupInputText
          labelText="セット単価"
          name="sales_unit_price"
          value={state.sales_unit_price ?? ''}
          error={errors?.sales_unit_price}
          onChange={onChange}
          className="max-w-8 text-right"
          required
          readOnly
        />
        <div className="flex flex-wrap max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputDate
              labelText="廃盤日"
              name="discontinued_date"
              value={state.discontinued_date ?? ''}
              error={errors?.discontinued_date}
              onChange={onChange}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroup
              labelText="表示"
              error={errors?.is_display}
              groupClassName="items-center mt-4"
              removeOptionalLabel
            >
              <Forms.FormInputCheck
                id="is_display"
                name="is_display"
                checked={state.is_display}
                onChange={onChange}
              />
            </Forms.FormGroup>
          </div>
        </div>
        <hr className="border-dashed border-gray-400 mt-6" />
        <div className="p-6">
          <div className="flex items-center">
            <div className="text-sm">商品明細</div>
            <div className="ml-auto">
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
                <th className="w-32">売上単価</th>
                <th className="w-24">点数</th>
                <th className="w-16">編集</th>
              </tr>
            </thead>
            <tbody>
              {state.details.map(r => (
                <tr key={r.id}>
                  <td className="text-center">{r.id}</td>
                  <td>
                    <div className="text-xs">{r.item_number}</div>
                    <div>{r.item_name}</div>
                    <div>{r.item_name_jp}</div>
                  </td>
                  <td className="text-right">{numberFormat(r.set_price, 2)}</td>
                  <td className="text-right">{r.quantity}</td>
                  <td className="col-btn">
                    <span onClick={onClickEditDetail} data-id={r.id}>
                      編集
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors?.details && <div className="form-error ml-2">{errors.details}</div>}

          <SetItemDetailDialog {...detailDialogProps} />
        </div>
      </div>
      <div className="flex justify-between">
        <div>
          <button className="btn" onClick={onClickSave} disabled={isDisabled}>
            保存
          </button>
        </div>
        {id && (
          <button className="btn-delete" onClick={onClickDelete} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
