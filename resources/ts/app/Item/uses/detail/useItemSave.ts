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
  // API 呼び出し
  // ==============================================================
  const requestItem = async ({
    mode,
    payload,
  }: {
    mode: 'new' | 'edit';
    payload: ItemPayload;
  }): Promise<boolean> => {
    try {
      dispatch(AppActions.request());

      const res =
        mode === 'new'
          ? await axios.post(`/api/${slug}/store`, payload)
          : await axios.put(`/api/${slug}/${state.id}/update_transaction`, payload);

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
  // 画像アップロード → payload 生成 → 保存処理
  // ==============================================================
  const handleSave = async (mode: 'new' | 'edit') => {
    try {
      // 画像アップロード
      await uploadImages(state.imageList, state.pdf);

      // 保存前にバリエーションの null を埋める（variItems を加工）
      let lastValid: any[] = [];
      const filledVariItems = state.variItems.map((row: any[], rowIndex: number) => {
        // バリ1〜4 の最後の有効値を保持する配列
        if (rowIndex === 0) {
          lastValid = row.slice(1, 5);
          return row;
        }

        return row.map((col: any, colIndex: number) => {
          if (colIndex >= 1 && colIndex <= 4) {
            const idx = colIndex - 1;

            // 値がある（null でも '' でもない）→ 保持値を更新
            if (col !== null && col !== '') {
              lastValid[idx] = col;
              return col;
            }

            // null の場合は保持値を使う
            if (col === null) return lastValid[idx];

            return col;
          }

          return col;
        });
      });

      // payload 生成
      const images = buildImageInfo(state.imageList);
      const payload: ItemPayload = { 
        ...state, 
        images,
        variItems: filledVariItems,
      };

      console.log("=== [useItemSave] payload（送信データ） mode:", mode, "===");
      console.log(JSON.parse(JSON.stringify(payload)));

      // API 呼び出し
      const success = await requestItem({ mode, payload });

      if (success) {
        await appAlert(mode === 'new' ? '新規保存しました。' : '編集保存しました。');
        backPage();
      } else {
        dispatch(AppActions.failed('データの保存に失敗しました。'));
      }
    } catch {
      dispatch(AppActions.failed('ファイルのアップロードに失敗しました。'));
    }
  };

  // ==============================================================
  // 保存ボタンクリック（バリデーションは validateItemState に一本化）
  // ==============================================================
  const saveClick = async () => {
    const validationErrors = validateItemState(state);

    // -------------------------------
    // エラーがあれば保存中断
    // -------------------------------
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      dispatch(AppActions.failed('必須項目を入力してください'));
      return;
    }

    // -------------------------------
    // 保存処理（新規／編集の差分はここだけ）
    // -------------------------------
    await handleSave(state.id === undefined ? 'new' : 'edit');
  };

  return {
    uploadImages,
    buildImageInfo,
    saveClick,
  };
};
