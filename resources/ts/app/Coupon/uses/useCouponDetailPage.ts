import { useCallback, useState } from 'react';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { Coupon } from '@/types/Coupon';
import { useItemSelectModal } from '@/app/Coupon/uses/useItemSelectModal';
import { useItemClassificationSelectModal } from '../uses/useItemClassificationSelectModal';
import { useDispatch } from 'react-redux';
import { AppActions } from '@/app/App/modules/appModule';

export const useCouponDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const commonDetail = useCommonDetailPage<Coupon & {
    rules: {
      id?: number;
      condition_type: string;
      condition_value: string[];
      price_operator?: 'gte' | 'lte';
      benefit_type: string;
      benefit_value: string;
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
    rules: [
      {
        id: undefined,
        condition_type: '',
        condition_value: [],
        price_operator: 'gte',
        benefit_type: '',
        benefit_value: '',
      },
    ],
  });

  const fetchDetailData = (commonDetail as any).get as (id: number) => Promise<boolean>;

  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    setState,
    onClickSave: originalSave,
    onClickDelete,
  } = commonDetail;

  const onClickSave = useCallback(async () => {
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

      // ✅ 修正：state を更新してから保存する
      setState(fixedState);
      await originalSave();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      const fullMessage = message
        ? `データの保存に失敗しました。\n${message}`
        : 'データの保存に失敗しました。';

      dispatch(AppActions.failed(fullMessage));
    }
  }, [state, originalSave, dispatch, setState]);


  const onChange = useCallback(
    (name: string, value: string | number | boolean | string[] | undefined) => {
      setState(prev => ({
        ...prev,
        [name]: value,
      }));
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
          newRules[index] = {
            ...oldRule,
            [key]: Array.isArray(value) ? value : value ?? '',
          };
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
          benefit_value: '',
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
    isModalOpen,
    openModal,
    closeModal,
    updateSelectedItems,
    selectedItemIds,
  } = useItemSelectModal();

  const [targetRuleIndex, setTargetRuleIndex] = useState<number | null>(null);

  const handleOpenItemModal = useCallback(
    (initialSelected: string[] = [], index: number) => {
      const ids = initialSelected.map(Number).filter(n => !isNaN(n));
      updateSelectedItems(ids);
      setTargetRuleIndex(index);
      openModal();
    },
    [openModal, updateSelectedItems]
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
      closeModal();
      setTargetRuleIndex(null);
    },
    [closeModal, setState, targetRuleIndex]
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
    onChange,
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
      isOpen: isModalOpen,
      selectedItemIds,
      open: handleOpenItemModal,
      close: closeModal,
      confirm: handleConfirmItemModal,
    },
  };
};
