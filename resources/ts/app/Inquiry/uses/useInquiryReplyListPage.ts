import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Pager } from '@/types';

type InquiryRow = {
  id: number;
  item_id: number | null;
  customer_id: number | null;
  customer_name: string;
  email: string;
  content: number;
  details: string;
  is_public: number | boolean;
  created_at: string;
  updated_at: string;
};

type InquiryListState = {
  rows: InquiryRow[];
  pager: Pager | undefined;
};

type Conditions = {
  keyword: string;
  // 画面側は TableWrapper の pager でページングするので、ここも持つ
  page: number;
  per_page: number;
};

/**
 * お問い合わせ（一覧）画面用 hooks
 * API: GET /api/shop-mail/inquiries
 */
export const useInquiryReplyListPage = (_slug: string) => {
  const [isLoading, setLoading] = useState(false);

  const [conditions, setConditions] = useState<Conditions>({
    keyword: '',
    page: 1,
    per_page: 20,
  });

  const [state, setState] = useState<InquiryListState>({
    rows: [],
    pager: undefined,
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        keyword: conditions.keyword || undefined,
        page: conditions.page,
        per_page: conditions.per_page,
      };

      const res = await axios.get('/api/shop-mail/inquiries', { params });

      const rows: InquiryRow[] = res.data?.rows ?? [];
      const meta = res.data?.meta;

      // Pager 型が厳密でも、一般的にこの4つがあれば TableWrapper は動く想定
      const pager: any = meta
        ? {
            current_page: meta.current_page,
            last_page: meta.last_page,
            per_page: meta.per_page,
            total: meta.total,
          }
        : undefined;

      setState({
        rows,
        pager,
      });
    } finally {
      setLoading(false);
    }
  }, [conditions.keyword, conditions.page, conditions.per_page]);

  // 初回ロード
  useEffect(() => {
    fetchList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setConditions(prev => {
      const next = { ...prev, [name]: value } as any;
      // 検索条件が変わったら1ページ目に戻す
      next.page = 1;
      return next;
    });
  }, []);

  const onClickSearchButton = useCallback(() => {
    // conditions の state が最新なのでそのまま fetch
    fetchList();
  }, [fetchList]);

  const onClickClearButton = useCallback(() => {
    setConditions(prev => ({
      ...prev,
      keyword: '',
      page: 1,
    }));
    // クリア後に取得
    setTimeout(() => {
      fetchList();
    }, 0);
  }, [fetchList]);

  const onChangePage = useCallback(
    (page: number) => {
      setConditions(prev => ({ ...prev, page }));
      // page 更新後に取得（state反映待ちを避けるため page を直接使う）
      setTimeout(() => {
        // fetchList は conditions に依存してるため、次tickでOK
        fetchList();
      }, 0);
    },
    [fetchList]
  );

  return {
    isLoading,
    state,
    conditions,

    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
  };
};