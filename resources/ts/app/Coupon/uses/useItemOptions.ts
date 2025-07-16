// resources/ts/app/Coupon/uses/useItemOptions.ts
import { useEffect, useState } from 'react';
import axios from 'axios';

type Option = { value: string; name: string };

export const useItemOptions = () => {
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    axios.get('/api/coupon/options/items').then((res) => {
      setOptions(res.data);
    });
  }, []);

  return options;
};
