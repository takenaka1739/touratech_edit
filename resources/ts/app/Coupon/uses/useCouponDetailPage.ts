import { useCallback, useState } from 'react';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { Coupon } from '@/types/Coupon';
import { useItemSelectModal } from '@/app/Coupon/uses/useItemSelectModal';
import { useItemClassificationSelectModal } from '../uses/useItemClassificationSelectModal';
import { useDispatch } from 'react-redux';
import { AppActions } from '@/app/App/modules/appModule';
import { validateItemState } from '@/app/Coupon/utils/validation';

export const useCouponDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const commonDetail = useCommonDetailPage<Coupon & {
    rules: {
      id?: number;
      condition_type: string;
      condition_value: string[];
      price_operator?: 'gte' | 'lte';
      benefit_type: string;
      benefit_value: {
      type?: string;
      value?: string;
      description?: string;
    };
    }[];
    
  }>(slug, {
    id: 0,
    code: '',
    name: '',
    details: '',
    start_at: '',
    end_at: '',
    benefit_type: '',
    discount_rate: '',
    benefit_details: '',
    is_active: true,
    rules: [
      {
        id: undefined,
        condition_type: '',
        condition_value: [],
        price_operator: 'gte',
        benefit_type: '',
         benefit_value: {},
      },
    ],
  });

  const fetchDetailData = (commonDetail as any).get as (id: number) => Promise<boolean>;

  const {
    isLoading,
    id,
    state,
    errors,
    setErrors,
    isDisabled,
    setState,
    onClickSave: originalSave,
    onClickDelete,
  } = commonDetail;

  const onClickSave = useCallback(async () => {

  const validationErrors = validateItemState(state);
  console.log('validationErrors');
  console.log(validationErrors);
    
    try {
      const fixedState = {
        ...state,
        rules: state.rules.map((r) => {
          if (r.condition_type === 'all') {
            return {
              ...r,
              condition_value: ['ALL'],
              price_operator: undefined,
            };
          }
          return r;
        }),
      };

      setState(fixedState);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        dispatch(AppActions.failed('必須項目を入力してください'));
        return;
      }else{
        await originalSave();
      }
    } catch (error: any) {
      if (error?.response?.status === 422 && error.response.data?.errors) {
        setErrors(error.response.data.errors); // ✅ バリデーションエラーセット
        return;
      }

      const message = error?.response?.data?.message;
      const fullMessage = message
        ? `データの保存に失敗しました。\n${message}`
        : 'データの保存に失敗しました。';

      dispatch(AppActions.failed(fullMessage));
    }
  }, [state, originalSave, dispatch, setState, setErrors]);

  const onChange = useCallback(
    (name: string, value: string | number | boolean | string[] | undefined) => {
      setState(prev => ({
        ...prev,
        [name]: value,
      }));
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    },
    [setState]
  );

  const onChangeDate = useCallback(
    (name: string, value: string | number | boolean | undefined) => {
      const newDateStr = typeof value === "string" ? value : "";

      setState(prev => {
        const start = name === "start_at" ? newDateStr : prev.start_at;
        const end = name === "end_at" ? newDateStr : prev.end_at;

        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;

        // 逆転チェック
        if (startDate && endDate && startDate > endDate) {
          if (name === "start_at") {
            return { ...prev, start_at: newDateStr, end_at: newDateStr };
          }
          if (name === "end_at") {
            return { ...prev, end_at: newDateStr, start_at: newDateStr };
          }
        }

        setErrors(prev => ({
          ...prev,
          [name]: '',
        }));
        // 通常更新
        return { ...prev, [name]: newDateStr };
      });
    },
    [setState]
  );


  const onChangeRule = useCallback(
    (index: number) =>
      (name: string, value: any) => {
        const key = name.split('.').pop() as string;

        setState(prev => {
          const newRules = [...prev.rules];
          const oldRule = newRules[index];

          const benefitValueObj = typeof oldRule.benefit_value === 'object' && oldRule.benefit_value !== null
            ? oldRule.benefit_value
            : {};

          const updatedRule = { ...oldRule };

          if (name.startsWith('benefit_value.')) {
            updatedRule.benefit_value = {
              ...benefitValueObj,
              [key]: value,
            };
          } else {
            switch (key) {
              case 'condition_type':
                updatedRule.condition_type = value;
                break;
              case 'condition_value':
                updatedRule.condition_value = value;
                break;
              case 'price_operator':
                updatedRule.price_operator = value;
                break;
              case 'benefit_type':
                updatedRule.benefit_type = value;
                break;
              case 'benefit_value':
                updatedRule.benefit_value = value;
                break;
              default:
                console.warn('未定義のkeyです', key);
            }
          }

          newRules[index] = updatedRule;
          return { ...prev, rules: newRules };
        });
      },
    [setState]
  );


  
  const addRule = useCallback(() => {
    setState(prev => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          id: undefined,
          condition_type: '',
          condition_value: [],
          price_operator: 'gte',
          benefit_type: '',
          benefit_value: {},
        },
      ],
    }));
  }, [setState]);

  const removeRule = useCallback(
    (index: number) => {
      const newRules = [...state.rules];
      newRules.splice(index, 1);
      setState(prev => ({ ...prev, rules: newRules }));
    },
    [state.rules, setState]
  );

  const {
    isOpen,
    open,
    close,
    confirm,
    //reset,
    selected,
    setSelected,
  } = useItemSelectModal();

  const [targetRuleIndex, setTargetRuleIndex] = useState<number | null>(null);

  const handleOpenItemModal = useCallback(
    (initialSelected: string[] = [], index: number) => {
      const ids = initialSelected.map(Number).filter(n => !isNaN(n));
      setSelected(ids);
      setTargetRuleIndex(index);
      open();
    },
    [open, setSelected]
  );

  const handleConfirmItemModal = useCallback(
    (ids: number[]) => {
      if (targetRuleIndex === null) return;
      const idStrings = ids.map(String);
      setState(prev => {
        const rules = [...prev.rules];
        const oldRule = rules[targetRuleIndex];
        rules[targetRuleIndex] = {
          ...oldRule,
          condition_value: idStrings,
        };
        return { ...prev, rules };
      });
      confirm(ids);
      setTargetRuleIndex(null);
    },
    [confirm, setState, targetRuleIndex]
  );

  const itemClassificationModal = useItemClassificationSelectModal();
  const [targetClassificationRuleIndex, setTargetClassificationRuleIndex] = useState<number | null>(null);

  // 商品分類モーダルを開く処理
  const onOpenItemClassificationModal = (selectedIds: number[], ruleIndex: number) => {
    const items = selectedIds.map(id => ({ id, name: `ID: ${id}` }));
    itemClassificationModal.setSelected(items);
    setTargetClassificationRuleIndex(ruleIndex);
    itemClassificationModal.open();
  };

  // 商品分類モーダルの決定時の処理
  const handleConfirmItemClassificationModal = (ids: number[]) => {
    if (targetClassificationRuleIndex === null) return;

    setState(prev => {
      const rules = [...prev.rules];
      const oldRule = rules[targetClassificationRuleIndex];
      rules[targetClassificationRuleIndex] = {
        ...oldRule,
        condition_value: ids.map(String),
      };
      return { ...prev, rules };
    });

    itemClassificationModal.close();
    setTargetClassificationRuleIndex(null);
  };

  return {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    setErrors,
    onChange,
    onChangeDate,
    onClickSave,
    onClickDelete,
    onChangeRule,
    addRule,
    removeRule,
    fetchDetailData,
    onOpenItemClassificationModal,
    itemClassificationModal: {
      isOpen: itemClassificationModal.isOpen,
      selected: itemClassificationModal.selected,
      close: itemClassificationModal.close,
      confirm: handleConfirmItemClassificationModal,
    },
    itemModal: {
      isOpen,
      selected,
      open: handleOpenItemModal,
      close,
      confirm: handleConfirmItemModal,
    },
  };
};
