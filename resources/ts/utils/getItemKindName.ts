import { ITEM_KIND } from '@/constants/ITEM_KIND';

export const getItemKindName: (item_kind: number | undefined) => string = item_kind => {
  const types = ITEM_KIND.filter(x => x.item_kind === item_kind);
  if (types.length) {
    return types[0].item_kind_name;
  }
  return '';
};
