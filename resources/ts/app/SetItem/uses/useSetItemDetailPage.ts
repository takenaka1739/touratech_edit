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
    sales_price: 0,
    id: undefined,
    code: '',
    name: '',
    item_number: 'A0001',
    itemNumberItem: [],
    name_note: '',
    sales_unit_price: undefined,
    salesPriceItem: [],
    discontinued_at: undefined,
    is_display: true,
    is_set_item: true,
    total_quantity: undefined,
    image_name: undefined,
    details: [],
    item_id: undefined,
    combination_id: undefined,
    combIdList: [],
    specialSalesDelFlag: false,
    variations1: '',
    variations2: '',
    variations3: '',
    variations4: '',
    variations5: '',
    display_status: 0,
    variItems: [],
    backVariItems: [],
    imageItem: [],
    is_sales_members_only: false,
    start_at: '',
    end_at: '',
    special_sale_price: 0,
    refund_rate: 0,
    codeList: [],
    categoryList: [],
    specialSalesList: [],
    imageList: [[]],
    categoryListAll: []
    //is_set_item: false,
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
