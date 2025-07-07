import { calcAmount } from '.';

describe('切り捨て', () => {
  const fraction = 1;

  test('0 x 0', () => {
    const { amount, sales_tax } = calcAmount(0, 0, 10, fraction);
    expect(amount).toBe(0);
    expect(sales_tax).toBe(0);
  });
  test('20 x 3', () => {
    const { amount, sales_tax } = calcAmount(20, 3, 10, fraction);
    expect(amount).toBe(60);
    expect(sales_tax).toBe(5);
  });
  test('20.42 x 10', () => {
    const { amount, sales_tax } = calcAmount(20.42, 10, 10, fraction);
    expect(amount).toBe(204);
    expect(sales_tax).toBe(18);
  });
});

describe('切り上げ', () => {
  const fraction = 2;

  test('20 x 3', () => {
    const { amount, sales_tax } = calcAmount(20, 3, 10, fraction);
    expect(amount).toBe(60);
    expect(sales_tax).toBe(6);
  });
  test('20.42 x 10', () => {
    const { amount, sales_tax } = calcAmount(20.42, 10, 10, fraction);
    expect(amount).toBe(205);
    expect(sales_tax).toBe(19);
  });
  test('2.042 x 10', () => {
    const { amount, sales_tax } = calcAmount(2.042, 10, 10, fraction);
    expect(amount).toBe(21);
    expect(sales_tax).toBe(2);
  });
  test('0.07 x 100', () => {
    const { amount, sales_tax } = calcAmount(0.07, 100, 10, fraction);
    expect(amount).toBe(7);
    expect(sales_tax).toBe(1);
  });
});

describe('四捨五入', () => {
  const fraction = 3;

  test('20 x 3', () => {
    const { amount, sales_tax } = calcAmount(20, 3, 10, fraction);
    expect(amount).toBe(60);
    expect(sales_tax).toBe(5);
  });
  test('20.42 x 10', () => {
    const { amount, sales_tax } = calcAmount(20.42, 10, 10, fraction);
    expect(amount).toBe(204);
    expect(sales_tax).toBe(19);
  });
});
