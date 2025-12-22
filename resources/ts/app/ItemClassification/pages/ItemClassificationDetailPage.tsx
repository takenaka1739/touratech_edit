import React, { useState, useEffect, useMemo } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { ItemClassification } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useDispatch } from 'react-redux';
import { AppActions } from '@/app/App/modules/appModule';
import axios from 'axios';
import { appAlert } from '@/components';
import { ItemImagePickerDialog } from '@/app/ItemClassification/components/ItemImagePickerDialog';

export type ItemClassificationDetailPageProps = {} & RouteComponentProps<{ id: string }>;

type ItemClassificationEx = Omit<ItemClassification, 'parent_name'> & {
  parent_name?: string;
  sort_order?: number;
};
type Mode = 'parent' | 'child';

/**
 * 商品分類マスタ詳細ページ
 * 
 * @returns 
 */
export const ItemClassificationDetailPage: React.VFC<ItemClassificationDetailPageProps> = () => {
  const title = '商品分類マスタ';
  const slug = 'item_classification';

  const history = useHistory(); //  一覧に戻るための history

  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    updateState,
    onChange,
    onClickDelete,
  } = useCommonDetailPage<ItemClassificationEx>(slug, {
    id: undefined,
    is_display: false,
    code: '',
    parent_code: undefined,
    parent_name: undefined,
    name: '',
    remarks: undefined,
    image: '',
    image_id: undefined,
    sort_order: 0,
  });

  const dispatch = useDispatch();

  /** 親/子のUIモード（初回のみ自動判定） */
  const [mode, setMode] = useState<Mode>('parent');
  const [modeFixed, setModeFixed] = useState<boolean>(false);

  useEffect(() => {
    if (modeFixed) return;

    if (id == null) {
      setMode('parent');
      setModeFixed(true);
      return;
    }

    const c  = (state?.code ?? '').toString();
    const pc = (state?.parent_code ?? '').toString();
    if (!c && !pc) return; // ローディング初期値を回避

    const isParent = (pc === c) || (!!c && !pc);
    setMode(isParent ? 'parent' : 'child');
    setModeFixed(true);
  }, [id, state?.code, state?.parent_code, modeFixed]);

  /** 親カテゴリ候補（最上位＝ parent_code が空 or parent_code===code） */
  const [parentOptions, setParentOptions] = useState<{ code: string; name: string; level: number }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.post(`/api/${slug}/fetch`, { c_keyword: '' });
        const raw = (res.data?.data?.rows ?? res.data?.rows ?? res.data) as any[];

        const parents = (raw || []).filter((r: any) => {
          const code = r.code ?? '';
          const pc   = r.parent_code ?? '';
          return code && (pc === code || !pc);
        });

        parents.sort((a: any, b: any) => {
          const sa = a.sort_order ?? 0;
          const sb = b.sort_order ?? 0;
          if (sa !== sb) return sa - sb;
          return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ja');
        });

        setParentOptions(parents.map((r: any) => ({ code: r.code, name: r.name, level: 0 })));
      } catch (e) {
        console.error('❌ 親カテゴリ取得エラー', e);
        setParentOptions([]);
      }
    })();
  }, [slug]);

  /** 画像（アップロード or 既存選択） */
  const [profileImage, setProfileImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageChanged, setImageChanged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // 旧画像ID/名前（編集時の置換で旧リンク解除に使用）
  const [loadedImageId, setLoadedImageId] = useState<number | undefined>(undefined);
  const [loadedImageName, setLoadedImageName] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (id != null && loadedImageId === undefined) {
      setLoadedImageId(state.image_id);
      setLoadedImageName(state.image);
    }
  }, [id, state.image_id, state.image, loadedImageId]);

  /**
   * 画像選択ボタンクリック時のイベントハンドラ
   * 
   * @param e ファイル選択イベント
   * @returns void ファイルが選択されなかった場合は何もせず終了
   */
  const onClickImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProfileImage(URL.createObjectURL(file));
    setImageName(file.name);
    setSelectedFile(file);
    setImageChanged(true);
  };

  useEffect(() => { if (state.image) setProfileImage('/images/' + state.image); }, [state.image]);

  const getVal = (v: any): string => (typeof v === 'string' ? v : v?.target?.value ?? '');
  const setParentCode = (code: string | undefined) => updateState({ parent_code: code ?? undefined });

  /** バリデーション */
  const validateForSave = (): string | null => {
    if (!state.name || state.name.trim() === '') return '商品分類名を入力してください。';
    if (mode === 'parent') {
      if (!state.code || state.code.trim() === '') return '親カテゴリの分類コードを入力してください。';
    } else {
      if (!state.parent_code || state.parent_code.trim() === '') return '親カテゴリを選択してください。';
      if (!state.code || state.code.trim() === '') return '子カテゴリの分類コードを入力してください。';
    }
    return null;
  };

  /** 送信用成形（親は parent_code=code に同期） */
  const buildPayload = (): ItemClassificationEx => {
    const base: ItemClassificationEx = {
      id: state.id,
      is_display: state.is_display,
      name: state.name,
      image: state.image,
      image_id: state.image_id,
      remarks: state.remarks,
      code: state.code,
      parent_code: state.parent_code,
      parent_name: state.parent_name,
      sort_order: state.sort_order ?? 0,
    };
    return mode === 'parent'
      ? { ...base, code: state.code ?? '', parent_code: state.code ?? '' }
      : { ...base, code: state.code ?? '', parent_code: state.parent_code ?? '' };
  };

  /**
   * 商品分類情報のデータベース登録
   * @returns 
   */
  const saveCore = async (): Promise<{ ok: boolean; newId?: number }> => {
    const msg = validateForSave();
    if (msg) { appAlert(msg); return { ok: false }; }

    const payload = buildPayload();
    dispatch(AppActions.request());
    try {
      if (state.id === undefined) {
        const res = await axios.post(`/api/${slug}/store`, payload);
        if (res.status === 200 && res.data?.success) {
          const newId = Number(res.data?.data?.id ?? 0) || undefined;
          dispatch(AppActions.success());
          return { ok: true, newId };
        }
      } else {
        const res = await axios.put(`/api/${slug}/edit/${state.id}`, payload);
        if (res.status === 200 && res.data?.success) {
          dispatch(AppActions.success());
          return { ok: true };
        }
      }
    } catch (e) {
      console.error('❌ 保存エラー', e);
    }
    dispatch(AppActions.failed('データの保存に失敗しました。'));
    return { ok: false };
  };

  /** 422の最初のメッセージを抽出 */
  const extractValidationError = (err: any): string | undefined => {
    const res = err?.response;
    if (res?.status === 422) {
      const errors = res?.data?.errors;
      if (errors && typeof errors === 'object') {
        if (Array.isArray(errors.name) && errors.name[0]) return String(errors.name[0]);
        const firstKey = Object.keys(errors)[0];
        const arr = errors[firstKey];
        if (Array.isArray(arr) && arr[0]) return String(arr[0]);
      }
      if (res?.data?.message) return String(res.data.message);
      return '入力内容を確認してください。';
    }
    return undefined;
  };

  /** 200系（success:false）からメッセージ抽出 */
  const extractApiMessage = (res: any): string | undefined => {
    if (!res) return undefined;
    const data = res.data ?? {};
    if (typeof data.message === 'string' && data.message.trim() !== '') return data.message;
    const errors = data.errors;
    if (errors && typeof errors === 'object') {
      if (Array.isArray(errors.name) && errors.name[0]) return String(errors.name[0]);
      const firstKey = Object.keys(errors)[0];
      const arr = errors[firstKey];
      if (Array.isArray(arr) && arr[0]) return String(arr[0]);
    }
    return undefined;
  };

  /**
   * 新規登録する商品分類の画像のアップロード、データベース登録のリクエストを行う。
   * 
   * @param targetCategoryId 
   * @returns 
   */
  const uploadNewImage = async (targetCategoryId?: number): Promise<boolean> => {
    try {
      const form = new FormData();
      if (imageName) form.append('name', imageName);
      if (targetCategoryId) form.append('category_id', String(targetCategoryId));
      if (selectedFile) form.append('file', selectedFile);

      const res = await axios.post(`/api/${slug}/image_store`, form);

      if (res.status === 200 && res.data?.success) {
        const newId = res.data?.data?.image_id ?? state.image_id;
        const newName = res.data?.data?.name ?? imageName ?? state.image;

        updateState({ image_id: newId, image: newName });
        setLoadedImageId(newId);
        setLoadedImageName(newName);

        dispatch(AppActions.success());
        return true;
      } else {
        const msg = extractApiMessage(res) ?? '画像の保存に失敗しました。';
        appAlert(msg);
        dispatch(AppActions.failed(msg));
        return false;
      }
    } catch (e: any) {
      console.error('❌ 新規画像アップロードエラー', e);
      const vmsg = extractValidationError(e);
      if (vmsg) {
        appAlert(vmsg);
        dispatch(AppActions.failed(vmsg));
      } else {
        dispatch(AppActions.failed('画像の保存に失敗しました。'));
      }
      return false;
    }
  };

  /**
   * 変更があった際の商品分類の画像のアップロード、データベース更新のリクエストを行う。
   * 
   * @param targetCategoryId 
   * @returns 
   */
  const replaceImageFile = async (targetCategoryId?: number): Promise<boolean> => {
    try {
      // FormData 構築
      const form = new FormData();
      if (imageName) form.append('name', imageName);
      if (targetCategoryId !== undefined) {
        form.append('category_id', String(targetCategoryId));
      }
      if (selectedFile) form.append('file', selectedFile);

      // Laravel の PUT 対応
      form.append('_method', 'PUT');

      const res = await axios.post(
        `/api/${slug}/image_edit/${state.image_id}`,
        form
      );

      if (res.status === 200 && res.data?.success) {
        const newId = res.data?.data?.image_id ?? state.image_id;
        const newName = res.data?.data?.name ?? imageName ?? state.image;

        updateState({ image_id: newId, image: newName });
        setLoadedImageId(newId);
        setLoadedImageName(newName);

        dispatch(AppActions.success());
        return true;
      } else {
        const msg = extractApiMessage(res) ?? '画像の保存に失敗しました。';
        appAlert(msg);
        dispatch(AppActions.failed(msg));
        return false;
      }
    } catch (e: any) {
      console.error('❌ 画像差し替えエラー', e);
      const vmsg = extractValidationError(e);
      if (vmsg) {
        appAlert(vmsg);
        dispatch(AppActions.failed(vmsg));
      } else {
        dispatch(AppActions.failed('画像の保存に失敗しました。'));
      }
      return false;
    }
  };

  /**
   * 商品分類に用いる「画像」を保存する。
   * public/imagesディレクトリへの画像アップロード、m_imagesテーブルの更新を責務とする。
   * 
   * @param categoryId 新規作成直後のIDなど、明示的に保存先カテゴリIDを指定したい場合に利用
   */
  const saveImage = async (categoryId?: number): Promise<boolean> => {
    if (!imageChanged) return true;

    const targetCategoryId = categoryId ?? state.id;
    dispatch(AppActions.request());
    try {
      if (selectedFile) {
        if (!state.image_id && Number(state.image_id) === 0) {
          return await uploadNewImage(targetCategoryId);
        } else {
          return await replaceImageFile(targetCategoryId);
        }
      } else {
        // 既存画像の選択（ファイル無し → リンク付替え）
        if (!state.image_id) return true; // 変更なし

        // 旧画像リンク解除（このカテゴリに既に別画像が紐づいていた場合のみ）
        if (loadedImageId && loadedImageId !== state.image_id) {
          const resOld = await axios.put(`/api/${slug}/image_edit/${loadedImageId}`, {
            name: loadedImageName,
            category_id: null,
          });
          if (!(resOld.status === 200 && resOld.data?.success)) {
            const msg = extractApiMessage(resOld) ?? '旧画像の解除に失敗しました。';
            appAlert(msg);
            dispatch(AppActions.failed(msg));
            return false;
          }
        }

        // 新しい画像をこのカテゴリに紐付け（他カテゴリで使用中だった画像も、ここで「移動」される）
        const resNew = await axios.put(`/api/${slug}/image_edit/${state.image_id}`, {
          name: imageName || state.image,
          category_id: targetCategoryId,
        });
        if (resNew.status === 200 && resNew.data?.success) {
          const newId = state.image_id;
          const newName = imageName || state.image;
          setLoadedImageId(newId);
          setLoadedImageName(newName);
          dispatch(AppActions.success());
          return true;
        } else {
          const msg = extractApiMessage(resNew) ?? '画像の保存に失敗しました。';
          appAlert(msg);
          dispatch(AppActions.failed(msg));
          return false;
        }
      }
    } catch (e: any) {
      console.error('❌ 画像保存エラー', e);
      const vmsg = extractValidationError(e);
      if (vmsg) {
        appAlert(vmsg);
        dispatch(AppActions.failed(vmsg));
      } else {
        dispatch(AppActions.failed('画像の保存に失敗しました。'));
      }
      return false;
    }
  };

  // ==============================================================
  // Handlers: UI イベント
  // ==============================================================
  // 保存ボタンクリックイベント
  const onClickSave = async () => {
    const resCore = await saveCore();
    if (!resCore.ok) return;

    let categoryId = state.id;
    if (resCore.newId && !state.id) {
      categoryId = resCore.newId;
      updateState({ id: resCore.newId });
    }

    const okImg = await saveImage(categoryId);
    if (!okImg) return;

    appAlert('保存しました。');

    //  新規・編集問わず、保存成功後は一覧へ
    history.push(`/${slug}`);
  };

  // 削除ボタンクリックイベント（削除成功後は一覧へ戻る）
  const handleDelete = async () => {
    if (!id) return;
    // onClickDelete が true/false を返す前提で見ておく（void でも undefined なので true扱い）
    const result: any = await onClickDelete();
    if (result !== false) {
      history.push(`/${slug}`);
    }
  };

  /** 親セレクト */
  const parentSelectOptions = useMemo(() => {
    return parentOptions.map(opt => ({
      value: opt.code,
      label: `${'— '.repeat(opt.level)}${opt.name}（${opt.code}）`,
    }));
  }, [parentOptions]);

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        {/* 表示フラグ */}
        <Forms.FormGroup labelText="ショップへの公開" error={errors?.is_display} groupClassName="items-center mt-4">
          <Forms.FormInputCheck id="is_display" name="is_display" checked={state.is_display} onChange={onChange} />
        </Forms.FormGroup>

        {/* 親/子の切替 */}
        <Forms.FormGroup labelText="階層" groupClassName="mt-2">
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="mode"
                className="mr-1"
                checked={mode === 'parent'}
                onChange={() => { setMode('parent'); setModeFixed(true); }}
              />
              親カテゴリ
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="mode"
                className="mr-1"
                checked={mode === 'child'}
                onChange={() => { setMode('child'); setModeFixed(true); }}
              />
              子カテゴリ
            </label>
          </div>
        </Forms.FormGroup>

        <div style={{ display: 'flex' }}>
          {/* 左：フォーム */}
          <div className="py-2 px-4" style={{ width: '60%' }}>
            {/* 親カテゴリ（子モード時は必須） */}
            <Forms.FormGroup labelText={`親カテゴリ${mode === 'child' ? '（必須）' : ''}`} error={errors?.parent_code}>
              <select
                className="form-input max-w-lg"
                disabled={mode !== 'child'}
                required={mode === 'child'}
                value={state.parent_code ?? ''}
                onChange={e => setParentCode(e.target.value || undefined)}
              >
                <option value="">（未選択）</option>
                {parentSelectOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {mode === 'child' && state.parent_code && (
                <div className="text-sm text-gray-500 mt-1">選択コード: {state.parent_code}</div>
              )}
            </Forms.FormGroup>

            {/* 分類名 */}
            <Forms.FormGroupInputText
              labelText={mode === 'parent' ? '商品分類名（親）' : '商品分類名（子）'}
              name="name"
              value={state.name}
              error={errors?.name}
              onChange={onChange}
              groupClassName="mt-0"
              className="max-w-lg"
              required
              maxLength={30}
            />

            {/* 分類コード */}
            <Forms.FormGroupInputText
              labelText={mode === 'parent' ? '分類コード（親）' : '分類コード（子）'}
              name="code"
              value={state.code ?? ''}
              error={errors?.code}
              onChange={(v: any) => updateState({ code: getVal(v) })}
              groupClassName="mt-0"
              className="max-w-lg mt-2"
              required
              maxLength={30}
            />

            {/* 表示順 */}
            <Forms.FormGroupInputText
              labelText="表示順"
              name="sort_order"
              value={(state.sort_order ?? 0).toString()}
              onChange={(v: any) => updateState({ sort_order: Number(getVal(v) || 0) })}
              groupClassName="mt-0"
              className="max-w-xs mt-2"
              maxLength={6}
            />

            {/* 備考 */}
            <Forms.FormGroupTextarea
              labelText="備考"
              name="remarks"
              value={state.remarks}
              error={errors?.remarks}
              onChange={onChange}
              className="max-w-lg"
              maxLength={200}
            />
          </div>

          {/* 右：画像 */}
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <button className="btn py-7 w-28" onClick={() => document.getElementById('fileInput')?.click()}>
                画像選択
              </button>
              <input className="w-1" id="fileInput" type="file" onChange={onClickImageSelect} style={{ visibility: 'hidden' }} />
              <button className="btn py-7 w-28" onClick={() => setPickerOpen(true)}>
                既存から選ぶ
              </button>
            </div>
            <p />
            <Forms.FormImage name={state.image} imageSrc={profileImage} value={state.image} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button className="btn" onClick={onClickSave} disabled={isDisabled}>保存</button>
        {id && <button className="btn-delete" onClick={handleDelete} disabled={isDisabled}>削除</button>}
      </div>

      {/* 既存画像ピッカー（ 現在カテゴリIDを渡す） */}
      <ItemImagePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(img) => {
          // ここではフロント状態だけ更新（保存時にサーバへ反映）
          updateState({ image_id: img.id, image: img.name });
          setImageName(img.name);
          setSelectedFile(null);
          setImageChanged(true);
          setProfileImage(img.url ?? `/images/${img.name}`);
          setPickerOpen(false);
        }}
        currentCategoryId={state.id}
      />
    </PageWrapper>
  );
};
