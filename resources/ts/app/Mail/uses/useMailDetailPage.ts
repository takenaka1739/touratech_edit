import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useSwichingMailPage } from '@/app/Mail/uses/useSwichingMailPage';
import { itemInitialState } from '@/app/Mail/modules/itemInitialState';
import { useAutoReplySettingPage } from '@/app/Mail/uses/useAutoReplySettingPage';
import { Item } from '@/types';

export const useMailDetailPage = () => {
  const title = 'メール設定詳細';
  const slug = 'item';

  // ==============================================================
  // 共通の詳細ページ管理（state / errors / onChange など）
  // ==============================================================
  const {
    //isLoading,
    id,
    state,
    errors,
    isDisabled,
    setState,
    //updateState,
    onChange,
    setErrors,
    //onClickDelete,
  } = useCommonDetailPage<Item & { selected: number[] | undefined }>(
    slug,
    itemInitialState
  );

  // 支払い方法
  const {
  } = useSwichingMailPage({
    setState,
    setErrors,
  });

  const {
    saveClick
  } = useAutoReplySettingPage();

  return{
    id,
    isDisabled,
    title,
    slug,
    state,
    errors,

    setState,
    setErrors,
    onChange,
    saveClick
  };
}