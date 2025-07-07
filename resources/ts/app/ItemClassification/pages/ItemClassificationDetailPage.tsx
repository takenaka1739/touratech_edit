import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ItemClassification } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';

export type ItemClassificationDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 商品分類マスタ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const ItemClassificationDetailPage: React.VFC<ItemClassificationDetailPageProps> = () => {
  const title = '商品分類マスタ';
  const slug = 'item_classification';
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<ItemClassification>(slug, {
    id: undefined,
    name: '',
    remarks: undefined,
  });

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <div className="py-2 px-4">
          <Forms.FormGroupInputText
            labelText="商品分類名"
            name="name"
            value={state.name}
            error={errors?.name}
            onChange={onChange}
            groupClassName="mt-0"
            className=" max-w-lg"
            required
            autoFocus
            maxLength={30}
          />
          <Forms.FormGroupTextarea
            labelText="備考"
            name="remarks"
            value={state.remarks ?? ''}
            error={errors?.remarks}
            onChange={onChange}
            className=" max-w-lg"
            maxLength={200}
          />
        </div>
      </div>
      <div className="flex justify-between">
        <button className="btn" onClick={onClickSave} disabled={isDisabled}>
          保存
        </button>
        {id && (
          <button className="btn-delete" onClick={onClickDelete} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
