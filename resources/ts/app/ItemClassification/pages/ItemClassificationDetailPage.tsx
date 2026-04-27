import React, { useState, useEffect, useMemo } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ItemClassification } from '@/types';
import { PageWrapper, Forms, appAlert, appConfirm } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { AppActions } from '@/app/App/modules/appModule';
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
  const [inputKey, setInputKey] = useState(Date.now());

  useEffect(() => {
    if (modeFixed) return;

    if (id == null) {
      setMode('parent');
      setModeFixed(true);
      return;
    }

    const c = (state?.code ?? '').toString();
    const pc = (state?.parent_code ?? '').toString();
    if (!c && !pc) return; // ローディング初期値を回避

    const isParent = pc === c || (!!c && !pc);
    setMode(isParent ? 'parent' : 'child');
    setModeFixed(true);
  }, [id, state?.code, state?.parent_code, modeFixed]);

  /**
   * 親カテゴリ候補
   *
   * - 自分自身の除外は id 基準
   * - 選択中の parent_code は必ず候補に残す
   */
  const [parentOptions, setParentOptions] = useState<{ id: number; code: string; name: string; level: number }[]>(
    []
  );
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.post(`/api/${slug}/fetch`, { c_keyword: '' });
        const raw = (res.data?.data?.rows ?? res.data?.rows ?? res.data) as any[];

        let filtered = (raw || []).filter((r: any) => {
          if (state.id == null) return true;
          const rid = Number(r?.id ?? 0);
          return rid !== Number(state.id);
        });

        const selectedPc = (state.parent_code ?? '').toString().trim();
        if (selectedPc) {
          const exists = filtered.some((r: any) => String(r?.code ?? '') === selectedPc);
          if (!exists) {
            const hit = (raw || []).find((r: any) => String(r?.code ?? '') === selectedPc);
            if (hit) {
              filtered = [hit, ...filtered];
            } else {
              filtered = [{ id: -1, code: selectedPc, name: '（選択中）', level: 0 }, ...filtered];
            }
          }
        }

        filtered.sort((a: any, b: any) => {
          const sa = a.sort_order ?? 0;
          const sb = b.sort_order ?? 0;
          if (sa !== sb) return sa - sb;
          return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ja');
        });

        setParentOptions(
          filtered.map((r: any) => ({
            id: Number(r?.id ?? 0),
            code: String(r?.code ?? ''),
            name: String(r?.name ?? ''),
            level: Number(r?.level ?? 0),
          }))
        );
      } catch (e) {
        setParentOptions([]);
      }
    })();
  }, [slug, state.id, state.parent_code]);

  /** 画像（アップロード or 既存選択） */
  const [profileImage, setProfileImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageChanged, setImageChanged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // 旧画像ID/名前（編集時の置換で旧リンク解除に使用）
  const [loadedImageId, setLoadedImageId] = useState<number | string | undefined>(undefined);
  const [loadedImageName, setLoadedImageName] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (id != null && loadedImageId === undefined) {
      setLoadedImageId(state.image_id);
      setLoadedImageName(state.image);
    }
  }, [id, state.image_id, state.image, loadedImageId]);

  const onClickImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await axios.get(`/api/${slug}/image_exists`, {
        params: { name: file.name },
        withCredentials: true,
      });

      if (res.data.exists) {
        setInputKey(Date.now());

        const ok = await appConfirm('同名のファイルがサーバー上に存在します。\n差し替えますか？');
        if (!ok) return;
      }
    } catch (err) {
      appAlert('サーバーとの通信に失敗しました。時間をおいて再度お試しください。');
      e.target.value = '';
      return;
    }

    setProfileImage(URL.createObjectURL(file));
    setImageName(file.name);
    setSelectedFile(file);
    setImageChanged(true);
  };

  useEffect(() => {
    if (state.image) setProfileImage(`/images/${state.image}?t=${Date.now()}`);
  }, [state.image]);

  const getVal = (v: any): string => (typeof v === 'string' ? v : v?.target?.value ?? '');
  const setParentCode = (code: string | undefined) => updateState({ parent_code: code ?? undefined });

  /** バリデーション（事前チェックは appAlert を使う） */
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

  // ==============================================================
  //  エラーメッセージ抽出 / 使用箇所（どこで使われているか）
  // ==============================================================

  const extractValidationErrorsMap = (err: any): Record<string, string[]> | undefined => {
    const res = err?.response;
    if (res?.status !== 422) return undefined;
    const errorsMap = res?.data?.errors;
    if (errorsMap && typeof errorsMap === 'object') return errorsMap as Record<string, string[]>;
    return undefined;
  };

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

  const isDuplicateCodeError = (err: any): boolean => {
    const errorsMap = extractValidationErrorsMap(err);
    const codeMsgs = errorsMap?.code ?? [];
    const joined = codeMsgs.join(' ').toLowerCase();

    if (joined.includes('already') && (joined.includes('taken') || joined.includes('exists'))) return true;
    if (joined.includes('既に') || joined.includes('使用') || joined.includes('重複')) return true;

    const msg = String(err?.response?.data?.message ?? '').toLowerCase();
    if (msg.includes('already') && (msg.includes('taken') || msg.includes('exists'))) return true;
    if (msg.includes('既に') || msg.includes('使用') || msg.includes('重複')) return true;

    return false;
  };

  const buildDuplicateCodeUsageMessage = async (codeRaw: string): Promise<string> => {
    const code = (codeRaw ?? '').toString().trim();
    if (!code) return '分類コードが空です。';

    try {
      const res = await axios.post(`/api/${slug}/fetch`, { c_keyword: code });
      const rows = (res.data?.data?.rows ?? res.data?.rows ?? res.data) as any[];

      const hits = (rows || []).filter((r: any) => String(r?.code ?? '') === code);

      if (hits.length === 0) {
        return `分類コード「${code}」は既に使用されています。`;
      }

      const lines = hits.slice(0, 20).map((r: any) => {
        const rid = r?.id != null ? `ID:${r.id}` : 'ID:不明';
        const name = String(r?.name ?? '');
        const pc = String(r?.parent_code ?? '');
        const c = String(r?.code ?? '');
        const kind = pc === c ? '親' : '子';
        const parentInfo = pc ? `parent_code:${pc}` : 'parent_code:なし';
        return `- ${rid} / ${kind} / ${name}（code:${c}, ${parentInfo}）`;
      });

      const head = `分類コード「${code}」は既に使用されています。\n使用箇所：\n`;
      const tail = hits.length > 20 ? `\n※ 表示は先頭20件のみ（該当:${hits.length}件）` : '';
      return head + lines.join('\n') + tail;
    } catch (e) {
      return `分類コード「${code}」は既に使用されています。（使用箇所の取得に失敗しました）`;
    }
  };

  /**
   * 商品分類情報のデータベース登録
   * 注意: ここでは appAlert を極力使わず、AppActions.failed に統一する（アラート二重発火防止）
   */
  const saveCore = async (): Promise<{ ok: boolean; newId?: number }> => {
    const msg = validateForSave();
    if (msg) {
      appAlert(msg); // 事前チェックだけは従来通り
      return { ok: false };
    }

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

        const apiMsg = extractApiMessage(res) ?? 'データの保存に失敗しました。';
        dispatch(AppActions.failed(apiMsg));
        return { ok: false };
      } else {
        const res = await axios.put(`/api/${slug}/edit/${state.id}`, payload);
        if (res.status === 200 && res.data?.success) {
          dispatch(AppActions.success());
          return { ok: true };
        }

        const apiMsg = extractApiMessage(res) ?? 'データの保存に失敗しました。';
        dispatch(AppActions.failed(apiMsg));
        return { ok: false };
      }
    } catch (e: any) {
      console.error('❌ 保存エラー', e);

      // 422（ValidationException）
      if (e?.response?.status === 422) {
        if (isDuplicateCodeError(e)) {
          const usageMsg = await buildDuplicateCodeUsageMessage(state.code ?? '');
          dispatch(AppActions.failed(usageMsg));
          return { ok: false };
        }

        const vmsg = extractValidationError(e) ?? '入力内容を確認してください。';
        dispatch(AppActions.failed(vmsg));
        return { ok: false };
      }

      dispatch(AppActions.failed('データの保存に失敗しました。'));
      return { ok: false };
    }
  };

  /**
   * ローカルから商品分類の画像を選択してアップロード、データベース登録のリクエストを行う。
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
   * ローカルから商品分類の画像の変更によるアップロード、データベース更新のリクエストを行う。
   *
   * @param targetCategoryId
   * @returns
   */
  const replaceImageFile = async (targetCategoryId?: number): Promise<boolean> => {
    try {
      const form = new FormData();
      if (imageName) form.append('name', imageName);
      if (targetCategoryId !== undefined) form.append('category_id', String(targetCategoryId));
      if (selectedFile) form.append('file', selectedFile);

      // Laravel の PUT 対応
      form.append('_method', 'PUT');
      const res = await axios.post(`/api/${slug}/image_edit/${state.image_id}`, form);

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
      // ローカル画像の選択
      if (selectedFile) {
        if (!state.image_id) {
          return await uploadNewImage(targetCategoryId);
        } else {
          return await replaceImageFile(targetCategoryId);
        }
      } else {
        const imgId = state.image_id;

        if (!imgId) return true;

        if (typeof imgId === 'string' && imgId.startsWith('file_')) {
          const res = await axios.post(`/api/${slug}/image_store_meta`, {
            name: imageName || state.image,
            category_id: targetCategoryId,
            order_by: state.sort_order,
            temp_id: imgId,
          });

          if (res.status === 200 && res.data?.success) {
            setLoadedImageId(res.data.id);
            setLoadedImageName(imageName || state.image);
            dispatch(AppActions.success());
            return true;
          }

          const msg = extractApiMessage(res) ?? '画像の登録に失敗しました。';
          appAlert(msg);
          dispatch(AppActions.failed(msg));
          return false;
        }

        const res = await axios.put(`/api/${slug}/image_edit_meta/${imgId}`, {
          name: imageName || state.image,
          category_id: targetCategoryId,
          order_by: state.sort_order,
        });

        if (res.status === 200 && res.data?.success) {
          setLoadedImageId(imgId);
          setLoadedImageName(imageName || state.image);
          dispatch(AppActions.success());
          return true;
        }

        const msg = extractApiMessage(res) ?? '画像の保存に失敗しました。';
        appAlert(msg);
        dispatch(AppActions.failed(msg));

        return false;
      }
    } catch (e: any) {
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
  const handleSave = async () => {
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
    history.push(`/${slug}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    const result: any = await onClickDelete();
    if (result !== false) {
      history.push(`/${slug}`);
    }
  };

  const parentSelectOptions = useMemo(() => {
    return parentOptions.map((opt) => ({
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
        <div style={{ padding: '0 16px' }}>
          <Forms.FormGroup
            labelText="ショップへの公開"
            error={errors?.is_display}
            groupClassName="items-center mt-4"
            required
          >
            <Forms.FormInputCheck id="is_display" name="is_display" checked={state.is_display} onChange={onChange} />
          </Forms.FormGroup>

          <Forms.FormGroup labelText="階層" groupClassName="mt-2 items-center w-[300px]" required>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="mode"
                  className="mr-1"
                  checked={mode === 'parent'}
                  onChange={() => {
                    setMode('parent');
                    setModeFixed(true);
                  }}
                />
                親カテゴリ
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="mode"
                  className="mr-1"
                  checked={mode === 'child'}
                  onChange={() => {
                    setMode('child');
                    setModeFixed(true);
                  }}
                />
                子カテゴリ
              </label>
            </div>
          </Forms.FormGroup>
        </div>

        <div style={{ display: 'flex' }}>
          <div className="py-2 px-4" style={{ width: '60%' }}>
            {mode === 'child' && (
              <Forms.FormGroup
                labelText="親カテゴリ"
                groupClassName="mb-2"
                error={errors?.parent_code}
                required={mode === 'child'}
              >
                <select
                  className="max-w-lg border border-gray-500 rounded-sm px-2 py-1"
                  disabled={mode !== 'child'}
                  required={mode === 'child'}
                  value={state.parent_code ?? ''}
                  onChange={(e) => setParentCode(e.target.value || undefined)}
                >
                  <option value="">（未選択）</option>
                  {parentSelectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Forms.FormGroup>
            )}

            <Forms.FormGroupInputText
              labelText={mode === 'parent' ? '商品分類名（親）' : '商品分類名（子）'}
              name="name"
              value={state.name}
              error={errors?.name}
              onChange={onChange}
              groupClassName="mt-0"
              className="max-w-lg"
              required
              maxLength={100}
            />

            <Forms.FormGroupInputText
              labelText={mode === 'parent' ? '分類コード（親）' : '分類コード（子）'}
              name="code"
              value={state.code ?? ''}
              error={errors?.code}
              onChange={(v: any) => updateState({ code: getVal(v) })}
              groupClassName="mt-0 items-center"
              className="max-w-lg mt-2"
              required
              maxLength={30}
            />

            <Forms.FormGroupInputText
              labelText="表示順"
              name="sort_order"
              value={(state.sort_order ?? 0).toString()}
              onChange={(v: any) => updateState({ sort_order: Number(getVal(v) || 0) })}
              groupClassName="mt-0 items-center"
              className="max-w-xs mt-2"
              maxLength={6}
            />

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

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <button className="btn py-7 w-28" onClick={() => document.getElementById('fileInput')?.click()}>
                画像選択
              </button>
              <input
                className="w-1"
                id="fileInput"
                key={inputKey}
                type="file"
                onChange={onClickImageSelect}
                style={{ visibility: 'hidden' }}
              />
              <button className="btn py-7 w-28" onClick={() => setPickerOpen(true)}>
                既存画像選択
              </button>
            </div>
            <p />
            <Forms.FormImage name={state.image} imageSrc={profileImage} value={state.image} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button className="btn" onClick={handleSave} disabled={isDisabled}>
          保存
        </button>
        {id && (
          <button className="btn-delete" onClick={handleDelete} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>

      <ItemImagePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(img) => {
          updateState({ image_id: img.id, image: img.name });
          setImageName(img.name);
          setSelectedFile(null);
          setImageChanged(true);
          setProfileImage((img.url ?? `/images/${img.name}`) + `?t=${Date.now()}`);
          setPickerOpen(false);
        }}
        currentCategoryId={state.id}
      />
    </PageWrapper>
  );
};
