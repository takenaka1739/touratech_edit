import { calcUnitPrice } from '@/utils';

describe('切り捨て', () => {
  const fraction = 1;

  test('0 x 100%', () => {
    const unit_price = calcUnitPrice(0, 100, fraction);
    expect(unit_price).toBe(0);
  });
  test('80 x 100%', () => {
    const unit_price = calcUnitPrice(80, 100, fraction);
    expect(unit_price).toBe(80);
  });
  test('100 x 80%', () => {
    const unit_price = calcUnitPrice(100, 80, fraction);
    expect(unit_price).toBe(80);
  });
  test('20.42 x 100%', () => {
    const unit_price = calcUnitPrice(20.42, 100, fraction);
    expect(unit_price).toBe(20.42);
  });
  test('20.42 x 80%', () => {
    const unit_price = calcUnitPrice(20.42, 80, fraction);
    expect(unit_price).toBe(16.33);
  });
  test('20.425 x 100%', () => {
    const unit_price = calcUnitPrice(20.425, 100, fraction);
    expect(unit_price).toBe(20.42);
  });
  test('20.425 x 80%', () => {
    const unit_price = calcUnitPrice(20.425, 80, fraction);
    expect(unit_price).toBe(16.34);
  });
});

describe('切り上げ', () => {
  const fraction = 2;

  test('20.42 x 100%', () => {
    const unit_price = calcUnitPrice(20.42, 100, fraction);
    expect(unit_price).toBe(20.42);
  });
  test('20.42 x 80%', () => {
    const unit_price = calcUnitPrice(20.42, 80, fraction);
    expect(unit_price).toBe(16.34);
  });
  test('20.425 x 100%', () => {
    const unit_price = calcUnitPrice(20.425, 100, fraction);
    expect(unit_price).toBe(20.43);
  });
  test('20.425 x 80%', () => {
    const unit_price = calcUnitPrice(20.425, 80, fraction);
    expect(unit_price).toBe(16.34);
  });
});

describe('四捨五入', () => {
  const fraction = 3;

  test('20.42 x 100%', () => {
    const unit_price = calcUnitPrice(20.42, 100, fraction);
    expect(unit_price).toBe(20.42);
  });
  test('20.42 x 80%', () => {
    const unit_price = calcUnitPrice(20.42, 80, fraction);
    expect(unit_price).toBe(16.34);
  });
  test('20.424 x 100%', () => {
    const unit_price = calcUnitPrice(20.424, 100, fraction);
    expect(unit_price).toBe(20.42);
  });
  test('20.425 x 100%', () => {
    const unit_price = calcUnitPrice(20.425, 100, fraction);
    expect(unit_price).toBe(20.43);
  });
  test('20.425 x 80%', () => {
    const unit_price = calcUnitPrice(20.425, 80, fraction);
    expect(unit_price).toBe(16.34);
  });
});
