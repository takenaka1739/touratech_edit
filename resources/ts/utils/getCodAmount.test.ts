import { Config } from '@/types';
import { getCodAmount } from './getCodAmount';

const config: Config = {
  company_name: '',
  zip_code: '',
  address1: '',
  tel: '',
  fax: '',
  email: '',
  company_class: undefined,
  company_level: '',
  bank_name1: '',
  branch_name1: '',
  account_name1: '',
  account_type1: '',
  account_number1: '',
  bank_name2: '',
  branch_name2: '',
  account_name2: '',
  account_type2: '',
  account_number2: '',
  sales_tax_rate: undefined,
  pre_tax_rate: undefined,
  tax_rate_change_date: undefined,
  currencies: [],
  cods: [
    {
      id: 2,
      border: 30000.0,
      amount: 533.0,
    },
    {
      id: 1,
      border: 10000.0,
      amount: 400.0,
    },
  ],
};

describe('代引手数料取得', () => {
  test('total amount is undefined', () => {
    const amount = getCodAmount(undefined, config);
    expect(amount).toBe(undefined);
  });

  test('total amount is zero', () => {
    const amount = getCodAmount(0, config);
    expect(amount).toBe(400);
  });

  test('total amount is 1', () => {
    const amount = getCodAmount(1, config);
    expect(amount).toBe(400);
  });

  test('total amount is 10000', () => {
    const amount = getCodAmount(10000, config);
    expect(amount).toBe(400);
  });

  test('total amount is 10001', () => {
    const amount = getCodAmount(10001, config);
    expect(amount).toBe(533);
  });

  test('total amount is 30000', () => {
    const amount = getCodAmount(30000, config);
    expect(amount).toBe(533);
  });

  test('total amount is 30001', () => {
    const amount = getCodAmount(30001, config);
    expect(amount).toBe(undefined);
  });
});
