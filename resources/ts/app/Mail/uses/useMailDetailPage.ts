// パス: resources/ts/app/Mail/uses/useMailDetailPage.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppActions } from '@/app/App/modules/appModule';
import { appAlert } from '@/components';

type RouteParams = { id?: string };

type MailTemplateFormState = {
  id?: number | null;
  template_type: number; // 1=自動返信 / 2=個別返信（UIでは選ばせないが、作成時に必要）
  title: string;

  subject_template?: string;
  header_template?: string;
  footer_template?: string;
  shipping_text?: string;

  detail_mode?: number;
  payment_url_enabled?: number;

  is_active?: number;

  [key: string]: any;
};

type MailErrors = Record<string, string | undefined>;

type DetailSettingRow = {
  id: number;
  item_key?: string | null; // DBにあれば（無ければ無視してOK）
  display_label: string;
  is_display: number; // 0/1
  [key: string]: any;
};

const TYPE_AUTO = 1;
const TYPE_INDIV = 2;

// ✅ 自動返信は明細表示フラグを固定で「表示」にしたい
// ※ 既存実装の 0/1 が揺れている可能性はあるが、要件通り「表示=1」で固定する前提
const DETAIL_MODE_SHOW = 1;

const initialStateBase: MailTemplateFormState = {
  id: null,
  template_type: TYPE_AUTO,
  title: '',
  subject_template: '',
  header_template: '',
  footer_template: '',
  shipping_text: '',
  detail_mode: 0,
  payment_url_enabled: 0,
  is_active: 1,
};

const parseTemplateTypeFromQuery = (search: string): number | null => {
  try {
    const qs = new URLSearchParams(search);
    const raw = qs.get('template_type');
    if (!raw) return null;
    const n = Number(raw);
    if (n === TYPE_AUTO || n === TYPE_INDIV) return n;
    return null;
  } catch {
    return null;
  }
};

const normalize422Errors = (data: any): MailErrors => {
  const ve = data?.errors ?? {};
  const normalized: MailErrors = {};
  Object.keys(ve).forEach(k => {
    const v = ve[k];
    normalized[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
  });
  return normalized;
};

export const useMailDetailPage = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const params = useParams<RouteParams>();

  const id = useMemo(() => {
    const raw = params.id;
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [params.id]);

  const slug = 'mail';
  const titleText = useMemo(
    () => (id ? 'メール設定詳細（編集）' : 'メール設定詳細（新規）'),
    [id]
  );

  // 新規時に一覧側から template_type を決め打ちする運用のため、クエリは残す（UIでは切替しない）
  const queryTemplateType = useMemo(
    () => parseTemplateTypeFromQuery(location.search),
    [location.search]
  );

  const backPage = useCallback(() => {
    history.push(`/${slug}`);
  }, [history, slug]);

  const [isDisabled, setDisabled] = useState(false);
  const [state, setState] = useState<MailTemplateFormState>(() => {
    const t = queryTemplateType ?? TYPE_AUTO;
    return {
      ...initialStateBase,
      template_type: t,
      // ✅ 新規作成で自動返信なら detail_mode は初期から固定で表示に寄せる（事故防止）
      ...(t === TYPE_AUTO ? { detail_mode: DETAIL_MODE_SHOW } : {}),
    };
  });
  const [errors, setErrors] = useState<MailErrors>({});

  // ✅ 明細設定（共通マスタ）
  const [detailSettings, setDetailSettings] = useState<DetailSettingRow[]>([]);
  const [detailErrors, setDetailErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      dispatch(AppActions.request());

      try {
        // 1) 明細設定は常に取得（新規/編集どちらも）
        const detailRes = await axios.get(`/api/shop-mail/detail-settings`);
        if (!mounted) return;
        setDetailSettings(detailRes.data?.data?.rows ?? []);

        // 2) テンプレ詳細（編集時のみ）
        if (!id) {
          const t = queryTemplateType ?? TYPE_AUTO;
          setState({
            ...initialStateBase,
            template_type: t,
            ...(t === TYPE_AUTO ? { detail_mode: DETAIL_MODE_SHOW } : {}),
          });
          setErrors({});
          dispatch(AppActions.success());
          return;
        }

        const res = await axios.get(`/api/shop-mail/templates/${id}`);
        if (!mounted) return;

        if (res.status === 200) {
          const row = res.data?.data ?? res.data ?? {};
          const t = Number(row.template_type ?? (queryTemplateType ?? TYPE_AUTO));

          setState({
            ...initialStateBase,
            ...row,
            id: row.id ?? id,
            template_type: t,
            title: String(row.title ?? ''),
            // ✅ 自動返信なら detail_mode を強制的に表示に寄せる
            ...(t === TYPE_AUTO ? { detail_mode: DETAIL_MODE_SHOW } : {}),
          });
          setErrors({});
          dispatch(AppActions.success());
          return;
        }

        dispatch(AppActions.failed('詳細の取得に失敗しました。'));
      } catch {
        if (!mounted) return;
        dispatch(AppActions.failed('詳細の取得に失敗しました。'));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [dispatch, id, queryTemplateType]);

  const onChange = useCallback(
    (name: string, value: any) => {
      // 🔒 種別変更は禁止（一覧からのみ決める）
      if (name === 'template_type') return;

      // ✅ 自動返信の明細表示フラグは固定（表示）
      if (name === 'detail_mode' && Number(state.template_type) === TYPE_AUTO) {
        setState(prev => ({ ...prev, detail_mode: DETAIL_MODE_SHOW }));
        return;
      }

      setState(prev => ({ ...prev, [name]: value }));
      setErrors(prev => {
        if (!prev?.[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [state.template_type]
  );

  // ✅ 明細設定の編集（表示文言/表示フラグ）
  const onChangeDetail = useCallback((id: number, patch: Partial<DetailSettingRow>) => {
    setDetailSettings(prev =>
      prev.map(r => (Number(r.id) === Number(id) ? { ...r, ...patch } : r))
    );
    // 明細側のエラーはざっくり消す（必要ならキー単位に調整可）
    setDetailErrors({});
  }, []);

  const saveClick = useCallback(async () => {
    setDisabled(true);
    dispatch(AppActions.request());

    try {
      /**
       * 1) テンプレ保存（先に保存してID確定）
       * - UIで template_type は変更不可だが、POSTには必須なので stateの値を送る
       */
      const currentType = Number(state.template_type ?? (queryTemplateType ?? TYPE_AUTO));

      const templatePayload: any = {
        template_type: currentType,
        title: state.title ?? '',
        subject_template: state.subject_template ?? '',
        header_template: state.header_template ?? '',
        footer_template: state.footer_template ?? '',
        shipping_text: state.shipping_text ?? '',
        detail_mode: Number(state.detail_mode ?? 0),
        payment_url_enabled: Number(state.payment_url_enabled ?? 0),
        is_active: Number(state.is_active ?? 1),
      };

      // ✅ 自動返信のみ detail_mode を固定で「表示」に強制
      if (currentType === TYPE_AUTO) {
        templatePayload.detail_mode = DETAIL_MODE_SHOW;
      }
      // ✅ 個別返信(TYPE_INDIV)はラジオの値をそのまま使う

      let res;
      if (id) {
        res = await axios.put(`/api/shop-mail/templates/${id}`, templatePayload);
      } else {
        res = await axios.post(`/api/shop-mail/templates`, templatePayload);
      }

      if (!(res.status === 200 || res.status === 201)) {
        dispatch(AppActions.failed('保存に失敗しました。'));
        return;
      }

      const saved = res.data?.data ?? res.data ?? {};

      // state を最新に反映
      setState(prev => {
        const nextType = Number(saved?.template_type ?? prev.template_type);
        return {
          ...prev,
          ...saved,
          id: saved?.id ?? prev.id,
          template_type: nextType,
          title: String(saved?.title ?? prev.title ?? ''),
          ...(nextType === TYPE_AUTO ? { detail_mode: DETAIL_MODE_SHOW } : {}),
        };
      });
      setErrors({});

      /**
       * 2) 明細設定保存（テンプレ保存成功後に必ず保存）
       * - ここで両方保存が完了する
       */
      const detailPayload = (detailSettings ?? []).map(r => ({
        id: Number(r.id),
        display_label: String(r.display_label ?? ''),
        is_display: Number(r.is_display ?? 0),
      }));

      await axios.put('/api/shop-mail/detail-settings', detailPayload);

      dispatch(AppActions.success());
      await appAlert('保存しました。');
      backPage();
      return;
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;

      if (status === 422) {
        // 422はテンプレ側の可能性が高いので、まずはテンプレ errors に入れる
        setErrors(normalize422Errors(data));
        dispatch(AppActions.failed('入力内容をご確認ください。'));
      } else {
        dispatch(AppActions.failed('保存に失敗しました。'));
      }
    } finally {
      setDisabled(false);
    }
  }, [backPage, detailSettings, dispatch, id, queryTemplateType, state]);

  return {
    id,
    isDisabled,
    title: titleText,
    slug,

    state,
    errors,
    onChange,

    // ✅ 明細設定も返す（画面で編集できるように）
    detailSettings,
    detailErrors,
    onChangeDetail,

    saveClick,
  };
};