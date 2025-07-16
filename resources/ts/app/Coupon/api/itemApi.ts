import axios from 'axios';

type FetchItemParams = {
  page: number;
  perPage: number;
  keyword?: string;
};

type Item = {
  id: number;
  name: string;
};

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
};

export const fetchItems = async (
  params: FetchItemParams
): Promise<PaginatedResponse<Item>> => {
  const response = await axios.get('/api/items/search', { params });
  return response.data;
};
