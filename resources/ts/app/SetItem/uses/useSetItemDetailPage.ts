import { SetItem, SetItemDetail } from '@/types';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useSetItemDetailDialogProps } from './useSetItemDetailDialogProps';
import toNumber from 'lodash/toNumber';

type SetItemDetailPageState = SetItem;

/**
 * セット品マスタ（詳細）画面用 hooks
 */
export const useSetItemDetailPage = (slug: string) => {
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    updateState,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<SetItemDetailPageState>(slug, {
    id: undefined,
    item_number: '',
    name: '',
    name_jp: '',
    sales_unit_price: undefined,
    discontinued_date: undefined,
    is_display: true,
    is_set_item: true,
    total_quantity: undefined,
    details: [],
  });

  const updateDetails: (details: SetItemDetail[]) => void = details => {
    const sales_unit_price = details.reduce((x, y) => {
      return x + toNumber(y.set_price ?? 0) * toNumber(y.quantity ?? 0);
    }, 0);
    updateState({ details, sales_unit_price });
  };

  const { open, detailDialogProps } = useSetItemDetailDialogProps(state.details, updateDetails);

  const onClickAddDetail: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void = () => {
    open(undefined);
  };

  const onClickEditDetail: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void = e => {
    open(e.currentTarget.dataset.id);
  };

  return {
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
  };
};
