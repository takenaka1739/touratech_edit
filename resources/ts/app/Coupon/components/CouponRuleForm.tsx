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
            />
            <Forms.FormGroupInputText
              labelText="金額"
              name={`rules[${index}].condition_value`}
              value={rule.condition_value}
              onChange={onChangeRule(index)}
              required
              groupClassName="mb-0"
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
        options={conditionTypeOptions}
        required
        groupClassName="mb-2"
      />

      {renderConditionInput()}

      <Forms.FormGroupSelect
        labelText="特典タイプ"
        name={`rules[${index}].benefit_type`}
        value={rule.benefit_type}
        onChange={(name, value) => {
          onChangeRule(index)(name, value);
          if (value === 'discount') {
            onChangeRule(index)('benefit_value', { type: 'yen', value: '' });
          } else if (value === 'free_item') {
            onChangeRule(index)('benefit_value', { description: '' });
          } else if (value === 'free_shipping') {
            onChangeRule(index)('benefit_value', { type: 'yen', value: '' });
          } else {
            onChangeRule(index)('benefit_value', null);
          }
        }}
        options={[
          { value: '', name: '選択してください' },
          { value: 'discount', name: '割引' },
          { value: 'free_item', name: '無料商品' },
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
            onChange={(value) => {
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
          name={`rules[${index}].benefit_value.description`}
          value={rule.benefit_value?.description ?? ''}
          onChange={(_, value) => {
            onChangeRule(index)('benefit_value', {
              ...rule.benefit_value,
              description: value,
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
