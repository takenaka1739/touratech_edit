import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { AppActions } from '@/app/App/modules/appModule';

type ConditionState = {
  c_keyword: string;
  page: number;
};

type MailTemplateRow = {
  id: number;
  template_type: number;
  title: string;

  detail_mode?: number; // 0/1
  payment_url_enabled?: number; // 0/1
  is_active?: number;

  subject_template?: string;
  header_template?: string;
  footer_template?: string;
  shipping_text?: string;

  [key: string]: any;
};

export type MailListPageState = {
  rows: MailTemplateRow[];
  pager: any | undefined;
};

export const useMailListPage = () => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conditions, setConditions] = useState<ConditionState>({ c_keyword: '', page: 1 });
  const [allRows, setAllRows] = useState<MailTemplateRow[]>([]);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    dispatch(AppActions.request());

    try {
      const res = await axios.get('/api/shop-mail/templates');
      if (res.status === 200) {
        dispatch(AppActions.success());
        const data = res.data?.data ?? {};
        const rows = (data.rows ?? []) as MailTemplateRow[];
        setAllRows(rows);
      } else {
        dispatch(AppActions.failed('一覧の取得に失敗しました。'));
      }
    } catch {
      dispatch(AppActions.failed('一覧の取得に失敗しました。'));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onChange = useCallback((name: string, value: any) => {
    setConditions(prev => ({ ...prev, [name]: value }));
  }, []);

  const onClickSearchButton = useCallback(() => {
    setConditions(prev => ({ ...prev, page: 1 }));
  }, []);

  const onClickClearButton = useCallback(() => {
    setConditions({ c_keyword: '', page: 1 });
  }, []);

  const onChangePage = useCallback((_page: number) => {
    // 今回はページング未対応
  }, []);

  const state: MailListPageState = useMemo(() => {
    const kw = (conditions.c_keyword ?? '').trim().toLowerCase();

    const rows = !kw
      ? allRows
      : allRows.filter(r => {
          const hay = [
            r.title ?? '',
            r.subject_template ?? '',
            r.header_template ?? '',
            r.footer_template ?? '',
            r.shipping_text ?? '',
          ]
            .join('\n')
            .toLowerCase();
          return hay.includes(kw);
        });

    return { rows, pager: undefined };
  }, [allRows, conditions.c_keyword]);

  const deleteTemplate = useCallback(
    async (id: number) => {
      if (!id) return false;

      setIsDeleting(true);
      dispatch(AppActions.request());

      try {
        const res = await axios.delete(`/api/shop-mail/templates/${id}`);
        if (res.status === 200) {
          dispatch(AppActions.success());
          await fetchList();
          return true;
        }
        dispatch(AppActions.failed('削除に失敗しました。'));
        return false;
      } catch {
        dispatch(AppActions.failed('削除に失敗しました。'));
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [dispatch, fetchList]
  );

  return {
    isLoading,
    isDeleting,
    state,
    conditions,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    refetch: fetchList,
    deleteTemplate,
  };
};