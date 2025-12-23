import React from 'react';
import { Forms } from '@/components';

/**
 * クーポンルール1件分の入力フォーム
 */
type Props = {
  index: number;
  rule: {
    condition_type: string;
    condition_value: any;
    price_operator?: 'gte' | 'lte' | 'eq';
    benefit_type: string;
    benefit_value: any;
  };
  onChangeRule: (index: number) => (name: string, value: any) => void;
  onRemoveRule: (index: number) => void;
  conditionTypeOptions: { value: string; name: string }[];
  onOpenItemModal: (selectedIds: number[], ruleIndex: number) => void;
  onOpenItemClassificationModal: (selectedIds: number[], ruleIndex: number) => void;
};

export const CouponRuleForm: React.FC<Props> = ({
  rule,
  index,
  conditionTypeOptions,
  onChangeRule,
  onRemoveRule,
  onOpenItemModal,
  onOpenItemClassificationModal,
}) => {
  // benefit_typeがspecial_itemなら常にitem_idに固定
  const effectiveConditionTypeOptions =
    rule.benefit_type === 'special_item'
      ? [{ value: 'item_id', name: '商品ID（特別商品）' }]
      : conditionTypeOptions;

  // 選択不可時はdisabled
  const isSpecialItem = rule.benefit_type === 'special_item';

  // benefit_typeがspecial_itemになった瞬間にcondition_typeとvalueもリセット
  const handleBenefitTypeChange = (name: string, value: any) => {
    onChangeRule(index)(name, value);
    if (value === 'discount') {
      onChangeRule(index)('benefit_value', { type: 'yen', value: '' });
    } else if (value === 'free_item') {
      onChangeRule(index)('benefit_value', { value: '' });
    } else if (value === 'free_shipping') {
      onChangeRule(index)('benefit_value', { type: 'yen', value: '' });
    } else if (value === 'special_item') {
      // benefit_typeをspecial_itemにしたらcondition_typeも強制的に'item_id'に
      onChangeRule(index)('condition_type', 'item_id');
      onChangeRule(index)('condition_value', []);
      onChangeRule(index)('benefit_value', { type: 'special_item', value: '' });
    } else {
      onChangeRule(index)('benefit_value', null);
    }
  };

  const renderConditionInput = () => {
    switch (rule.condition_type) {
      case 'item_id':
        return (
          <Forms.FormGroup labelText="対象商品" required>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const selectedIds = rule.condition_value?.map((v: string) => Number(v)).filter((v: number) => !isNaN(v)) ?? [];
                  onOpenItemModal(selectedIds, index);
                }}
                // special_item以外の時だけ選択可能、特別商品時は選択必須
              >
                商品を選択
              </button>
              <span className="text-sm text-gray-700">
                {rule.condition_value?.length ? `${rule.condition_value.length} 件選択中` : '未選択'}
              </span>
            </div>
          </Forms.FormGroup>
        );
      case 'category_id':
        return (
          <Forms.FormGroup labelText="対象カテゴリ" required>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const selectedIds = rule.condition_value?.map((v: string) => Number(v)).filter((v: number) => !isNaN(v)) ?? [];
                  onOpenItemClassificationModal(selectedIds, index);
                }}
                disabled={isSpecialItem} // special_itemのときカテゴリ選択ボタンを無効に
              >
                商品分類を選択
              </button>
              <span className="text-sm text-gray-700">
                {rule.condition_value?.length ? `${rule.condition_value.length} 件選択中` : '未選択'}
              </span>
            </div>
          </Forms.FormGroup>
        );
      case 'price':
        return (
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <Forms.FormGroupSelect
              labelText="条件"
              name={`rules[${index}].price_operator`}
              value={rule.price_operator ?? 'gte'}
              onChange={onChangeRule(index)}
              options={[
                { value: 'gte', name: '以上' },
                { value: 'lte', name: '以下' },
                { value: 'eq', name: 'と一致する' },
              ]}
              required
              groupClassName="mb-0"
              disabled={isSpecialItem}
            />
            <Forms.FormGroupInputText
              labelText="金額"
              name={`rules[${index}].condition_value`}
              value={rule.condition_value}
              onChange={onChangeRule(index)}
              required
              groupClassName="mb-0"
              disabled={isSpecialItem}
            />
          </div>
        );
      case 'all_items':
        return null;
      default:
        return (
          <Forms.FormGroupTextarea
            labelText="条件値"
            name={`rules[${index}].condition_value`}
            value={rule.condition_value}
            onChange={onChangeRule(index)}
            required
            disabled={isSpecialItem}
          />
        );
    }
  };

  return (
    <div className="p-3 border rounded mb-4">
      <Forms.FormGroupSelect
        labelText="条件タイプ"
        name={`rules[${index}].condition_type`}
        value={rule.condition_type}
        onChange={(name, value) => {
          onChangeRule(index)(name, value);
          onChangeRule(index)('condition_value', []);
          onChangeRule(index)('price_operator', value === 'price' ? 'gte' : undefined);
        }}
        options={effectiveConditionTypeOptions}
        required
        groupClassName="mb-2"
        disabled={isSpecialItem} //  benefit_typeがspecial_itemならcondition_typeのセレクトはdisable
      />

      {renderConditionInput()}

      <Forms.FormGroupSelect
        labelText="特典タイプ"
        name={`rules[${index}].benefit_type`}
        value={rule.benefit_type}
        onChange={handleBenefitTypeChange}
        options={[
          { value: '', name: '選択してください' },
          { value: 'discount', name: '割引' },
          { value: 'free_item', name: '無料アイテム' },
          { value: 'free_shipping', name: '送料無料' },
        ]}
        required
      />

      {rule.benefit_type === 'discount' && (
        <div className="mb-2">
          <Forms.FormGroupSelect
            labelText="割引タイプ"
            name={`rules[${index}].benefit_value.type`}
            value={rule.benefit_value?.type ?? ''}
            onChange={(_, value) => {
              onChangeRule(index)('benefit_value', {
                ...rule.benefit_value,
                type: value,
              });
            }}
            options={[
              { value: 'yen', name: '円引き' },
              { value: 'percent', name: '％引き' },
            ]}
            required
          />

          <Forms.FormGroupInputText
            labelText="割引値"
            name={`rules[${index}].benefit_value.value`}
            value={rule.benefit_value?.value ?? ''}
            onChange={(_, value) => {
              onChangeRule(index)('benefit_value', {
                ...rule.benefit_value,
                value,
              });
            }}
            required
          />
        </div>
      )}

      {rule.benefit_type === 'free_item' && (
        <Forms.FormGroupTextarea
          labelText="おまけ商品内容"
          name={`rules[${index}].benefit_value.value`}
          value={rule.benefit_value?.value ?? ''}
          onChange={(_, value) => {
            onChangeRule(index)('benefit_value', {
              type: 'description',
              value,
            });
          }}
          required
        />
      )}

      {rule.benefit_type === 'free_shipping' && (
        <div className="mb-2 text-sm text-gray-700">
          ※ 送料無料の特典が適用されます
        </div>
      )}

      {rule.benefit_type === 'special_item' && (
        <>
          <Forms.FormGroupInputText
          labelText="特別な商品名"
          name={`rules[${index}].benefit_value.value`}
          value={rule.benefit_value?.value ?? ''}
          onChange={(_, value) => {
            onChangeRule(index)('benefit_value', {
              ...rule.benefit_value,
              value,
            });
          }}
          required
        />
        </>
      )}

      <button
        type="button"
        onClick={() => onRemoveRule(index)}
        className="btn-delete mt-2"
      >
        × このルールを削除
      </button>
    </div>
  );
};
