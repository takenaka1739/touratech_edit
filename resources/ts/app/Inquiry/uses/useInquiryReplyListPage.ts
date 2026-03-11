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

  c_sales_date_from: string;
  c_sales_date_to: string;
  c_customer_name: string;
  c_user_name: string;
  c_item_number: string;
  c_name: string;
  c_order_no: string;

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

    c_sales_date_from: '',
    c_sales_date_to: '',
    c_customer_name: '',
    c_user_name: '',
    c_item_number: '',
    c_name: '',
    c_order_no: '',

    page: 1,
    per_page: 20,
  });

  const [state, setState] = useState<InquiryListState>({
    rows: [],
    pager: undefined,
  });

  const fetchList = useCallback(async (targetConditions: Conditions) => {
    setLoading(true);
    try {
      const params: any = {
        keyword: targetConditions.keyword || undefined,

        c_sales_date_from: targetConditions.c_sales_date_from || undefined,
        c_sales_date_to: targetConditions.c_sales_date_to || undefined,
        c_customer_name: targetConditions.c_customer_name || undefined,
        c_user_name: targetConditions.c_user_name || undefined,
        c_item_number: targetConditions.c_item_number || undefined,
        c_name: targetConditions.c_name || undefined,
        c_order_no: targetConditions.c_order_no || undefined,

        page: targetConditions.page,
        per_page: targetConditions.per_page,
      };

      const res = await axios.get('/api/shop-mail/inquiries', { params });

      const rows: InquiryRow[] = res.data?.rows ?? [];
      const meta = res.data?.meta;

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
  }, []);

  useEffect(() => {
    fetchList(conditions);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback((nameOrEvent: any, value?: any) => {
    setConditions((prev) => {
      if (typeof nameOrEvent === 'string') {
        return {
          ...prev,
          [nameOrEvent]: value,
          page: 1,
        };
      }

      const e = nameOrEvent;
      const name = e?.target?.name;
      const nextValue = e?.target?.value;

      if (!name) return prev;

      return {
        ...prev,
        [name]: nextValue,
        page: 1,
      };
    });
  }, []);

  const onClickSearchButton = useCallback(() => {
    fetchList(conditions);
  }, [fetchList, conditions]);

  const onClickClearButton = useCallback(() => {
    const cleared: Conditions = {
      keyword: '',
      c_sales_date_from: '',
      c_sales_date_to: '',
      c_customer_name: '',
      c_user_name: '',
      c_item_number: '',
      c_name: '',
      c_order_no: '',
      page: 1,
      per_page: conditions.per_page,
    };

    setConditions(cleared);
    fetchList(cleared);
  }, [fetchList, conditions.per_page]);

  const onChangePage = useCallback(
    (page: number) => {
      const next = {
        ...conditions,
        page,
      };

      setConditions(next);
      fetchList(next);
    },
    [fetchList, conditions]
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