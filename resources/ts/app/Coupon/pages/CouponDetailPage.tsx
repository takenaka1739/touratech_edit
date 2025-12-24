import React, { useEffect, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { PageWrapper, Forms } from '@/components';
import { useCouponDetailPage } from '@/app/Coupon/uses/useCouponDetailPage';
import { CouponRuleForm } from '@/app/Coupon/components/CouponRuleForm';
import { CouponItemSelectModal } from '@/app/Coupon/components/CouponItemSelectModal';
import { ItemClassificationSelectModal } from '@/app/Coupon/components/ItemClassificationSelectModal';

export type CouponDetailPageProps = {} & RouteComponentProps<{ id: string }>;

export const CouponDetailPage: React.VFC<CouponDetailPageProps> = ({ match }) => {
  const title = 'クーポンマスタ';
  const slug = 'coupon';
  const couponIdParam = match.params.id;
  const isNew = couponIdParam === 'new';
  const couponId = isNew ? 0 : Number(couponIdParam);
  const fetched = useRef(false);

  const conditionTypeOptions = [
    { value: '', name: '選択してください' },
    { value: 'all_items', name: '全商品対象' },
    { value: 'category_id', name: 'カテゴリID（特定カテゴリの商品）' },
    { value: 'item_id', name: '商品ID（特定の商品）' },
    { value: 'price', name: '価格（以上・以下）' },
  ];

  const {
    isLoading,
    state,
    errors,
    isDisabled,
    onChange,
    onChangeDate,
    onClickSave,
    onClickDelete,
    onChangeRule,
    addRule,
    removeRule,
    fetchDetailData,
    itemModal,
    itemClassificationModal,
    onOpenItemClassificationModal,
  } = useCouponDetailPage(slug);

  useEffect(() => {
    if (!isNew && couponId > 0 && !fetched.current) {
      fetchDetailData(couponId);
      fetched.current = true;
    }
  }, [couponId, fetchDetailData, isNew]);

  const handleOpenItemModal = (selectedIds: number[], ruleIndex: number) => {
    const parsedIds = selectedIds.filter(n => !isNaN(n)).map(n => n.toString());
    itemModal.open(parsedIds, ruleIndex);
  };

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <Forms.FormGroupInputText
          labelText="コード"
          name="code"
          value={state.code}
          error={errors?.code}
          onChange={onChange}
          required
          maxLength={20}
          className="max-w-sm"
        />
        <Forms.FormGroupInputText
          labelText="名称"
          name="name"
          value={state.name}
          error={errors?.name}
          onChange={onChange}
          required
          maxLength={50}
          className="max-w-sm"
        />
        <Forms.FormGroupTextarea
          labelText="内容"
          name="details"
          value={state.details}
          error={errors?.details}
          onChange={onChange}
          maxLength={200}
          className="max-w-lg"
        />
        <Forms.FormGroupInputDate
          labelText="開始日"
          name="start_at"
          value={state.start_at ? new Date(state.start_at) : null}
          error={errors?.start_at}
          onChange={onChangeDate}
          required
        />
        <Forms.FormGroupInputDate
          labelText="終了日"
          name="end_at"
          value={state.end_at ? new Date(state.end_at) : null}
          error={errors?.end_at}
          onChange={onChangeDate}
          required
        />

        <h3 className="mt-8 mb-2 text-lg font-bold">クーポンルール</h3>
        {state.rules.map((rule, index) => (
          <CouponRuleForm
            key={rule.id ?? index}
            index={index}
            rule={rule}
            onChangeRule={onChangeRule}
            onRemoveRule={removeRule}
            conditionTypeOptions={conditionTypeOptions}
            onOpenItemModal={handleOpenItemModal}
            onOpenItemClassificationModal={onOpenItemClassificationModal}
          />
        ))}
        <button className="btn" type="button" onClick={addRule}>
          ＋ ルール追加
        </button>
      </div>

      <div className="flex justify-between mt-6">
        <button className="btn" onClick={onClickSave} disabled={isDisabled}>
          保存
        </button>
        {!isNew && couponId > 0 && (
          <button className="btn-delete" onClick={onClickDelete} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>

      <CouponItemSelectModal
          isOpen={itemModal.isOpen}
          selected={itemModal.selected}
          onClose={itemModal.close}
          onConfirm={itemModal.confirm}
      />

      <ItemClassificationSelectModal
        isOpen={itemClassificationModal.isOpen}
        selectedCategoryIds={itemClassificationModal.selected.map((c) => c.id)}
        onClose={itemClassificationModal.close}
        onConfirm={itemClassificationModal.confirm}
      />

    </PageWrapper>
  );
};
