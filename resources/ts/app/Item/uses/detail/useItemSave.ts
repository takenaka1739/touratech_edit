import axios from 'axios';
import { AppActions } from '@/app/App/modules/appModule';
import { validateItemState } from '@/app/Item/utils/validation';
import { appAlert } from '@/components';
import { ItemPayload } from '@/types';

type UseItemSaveArgs = {
  state: any;
  dispatch: any;
  slug: string;
  backPage: () => void;
  setErrors: (value: any) => void;
};

/**
 * 商品マスタの「保存処理・画像アップロード」用フックス。
 * 
 * - ファイルアップロード
 * - 保存
 * - 依存関連
 */
export const useItemSave = ({
  state,
  dispatch,
  slug,
  backPage,
  setErrors,
}: UseItemSaveArgs) => {
  // ==============================================================
  // 商品画像・動画・YouTubeリンクの配列を生成
  // ==============================================================
  const buildImageInfo = (imageList: (File | string)[][]): string[][] => {
    return imageList.map(value => {
      const itemId = String(value[0]);
      const files = value.slice(1);

      const fileNames = files
        .map(file => {
          if (file instanceof File) {
            return file.name;
          } else if (typeof file === 'string' && file.trim() !== '') {
            return file;
          }
          return '';
        })
        .filter((name): name is string => !!name);

      return [itemId, ...fileNames];
    });
  };

  // ==============================================================
  // ファイルアップロード
  // ==============================================================
  const uploadImages = async (
    imageList: any[][] | null,
    document?: File
  ): Promise<string[]> => {
    if ((!imageList || imageList.length === 0) && !document) return [];

    const formData = new FormData();
    let hasFile = false;

    imageList?.forEach(items => {
      if (!items) return;

      items.slice(1).forEach(item => {
        if (item instanceof File) {
          if (item.type.startsWith('image/')) {
            formData.append('images[]', item);
            hasFile = true;
          } else if (item.type.startsWith('video/')) {
            formData.append('videos[]', item);
            hasFile = true;
          }
        }
      });
    });

    if (document instanceof File) {
      formData.append('document', document);
      hasFile = true;
    }

    if (!hasFile) return [];

    try {
      dispatch(AppActions.request());
      const res = await axios.post(`/api/${slug}/store_image_transaction`, formData);
      return res.data.paths;
    } catch (error) {
      throw error;
    }
  };

  // ==============================================================
  // 新規登録 API
  // ==============================================================
  const storeItem = async (payload: ItemPayload): Promise<boolean> => {
    try {
      dispatch(AppActions.request());

      const res = await axios.post(`/api/${slug}/store`, payload);

      if (res.status === 200) {
        dispatch(AppActions.success());

        if (res.data.success) {
          return true;
        } else {
          setErrors(res.data.errors);
          return false;
        }
      } else {
        dispatch(AppActions.failed('リクエストに失敗しました。'));
        return false;
      }
    } catch {
      dispatch(AppActions.failed('通信エラーが発生しました。'));
      return false;
    }
  };

  // ==============================================================
  // 編集登録 API
  // ==============================================================
  const updateItem = async (payload: ItemPayload): Promise<boolean> => {
    try {
      dispatch(AppActions.request());

      const res = await axios.put(
        `/api/${slug}/${payload.id}/update_transaction`,
        payload
      );

      if (res.status === 200) {
        dispatch(AppActions.success());

        if (res.data.success) {
          return true;
        } else {
          setErrors(res.data.errors);
          return false;
        }
      } else {
        dispatch(AppActions.failed('リクエストに失敗しました。'));
        return false;
      }
    } catch {
      dispatch(AppActions.failed('通信エラーが発生しました。'));
      return false;
    }
  };

  // ==============================================================
  // 新規保存処理
  // ==============================================================
  const handleNewItem = async () => {
    try {
      await uploadImages(state.imageList, state.pdf);

      const images = buildImageInfo(state.imageList);
      const payload: ItemPayload = { ...state, images };

      const success = await storeItem(payload);

      if (success) {
        await appAlert('新規保存しました。');
        backPage();
      } else {
        dispatch(AppActions.failed('データの保存に失敗しました。'));
      }
    } catch {
      dispatch(AppActions.failed('ファイルのアップロードに失敗しました。'));
    }
  };

  // ==============================================================
  // 編集保存処理
  // ==============================================================
  const handleEditItem = async () => {
    try {
      await uploadImages(state.imageList, state.pdf);

      const images = buildImageInfo(state.imageList);
      const payload: ItemPayload = { ...state, images };

      const success = await updateItem(payload);

      if (success) {
        await appAlert('編集保存しました。');
        backPage();
      } else {
        dispatch(AppActions.failed('データの保存に失敗しました。'));
      }
    } catch {
      dispatch(AppActions.failed('ファイルのアップロードに失敗しました。'));
    }
  };

  // ==============================================================
  // 保存ボタンクリック
  // ==============================================================
  const saveClick = async () => {
    const validationErrors = validateItemState(state);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      dispatch(AppActions.failed('必須項目を入力してください'));
      return;
    }

    if (state.id === undefined) {
      await handleNewItem();
    } else {
      await handleEditItem();
    }
  };

  return {
    uploadImages,
    buildImageInfo,
    storeItem,
    updateItem,
    handleNewItem,
    handleEditItem,
    saveClick,
  };
};
