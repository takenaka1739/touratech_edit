// 新規: resources/ts/app/Purchase/components/PurchaseInputNumber.tsx
// 目的:
// - Purchase（仕入）だけ「マイナス入力」を許可する number input
// - 共通 FormInputNumber は変更しない（他画面へ影響なし）
// 挙動:
// - precision=0 なら整数のみ
// - "-" の途中入力も許可（controlledで入力が消えない）
// - 有効な数値に確定した時だけ onChange(name, number) を呼ぶ
// - 空文字は onChange(name, '') を返す（既存互換）

import React, { ChangeEvent, InputHTMLAttributes, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  name: string;
  value: number | undefined;
  error?: string;
  precision: number;
  min?: number;
  max?: number;
  className?: string;

  onChange?: (name: string, value: string | number) => void;
};

export const PurchaseInputNumber: React.VFC<Props> = ({
  name,
  value,
  error,
  precision,
  min,
  max,
  className,
  onChange,
  ...rest
}) => {
  const minNum = useMemo(() => (min !== undefined ? Number(min) : undefined), [min]);
  const maxNum = useMemo(() => (max !== undefined ? Number(max) : undefined), [max]);

  // Purchaseでは「マイナス許可」が目的なので、min未指定でも許可
  const allowMinus = useMemo(() => {
    if (minNum === undefined) return true;
    return minNum < 0;
  }, [minNum]);

  const [raw, setRaw] = useState<string>(value ?? value === 0 ? String(value) : '');

  useEffect(() => {
    const next = value ?? value === 0 ? String(value) : '';
    if (raw !== next) setRaw(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitIfValid = (val: string) => {
    if (!onChange) return;

    if (val === '') {
      onChange(name, '');
      return;
    }

    // 途中入力は親に送らない
    if (val === '-' || val === '.' || val === '-.' || val.endsWith('.')) return;

    const num = Number(val);
    if (!Number.isFinite(num)) return;

    if ((minNum !== undefined && num < minNum) || (maxNum !== undefined && maxNum < num)) return;

    onChange(name, num);
  };

  const onChangeRaw = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;

    const sign = allowMinus ? '-?' : '';
    if (precision === 0) {
      const re = new RegExp(`^${sign}\\d*$`);
      if (!re.test(val)) return;
      setRaw(val);
      emitIfValid(val);
      return;
    }

    const re = new RegExp(`^${sign}\\d*(?:\\.(\\d*)?)?$`);
    const m = val.match(re);
    if (!m) return;

    const frac = m[1] ?? '';
    if (frac.length > precision) return;

    setRaw(val);
    emitIfValid(val);
  };

  return (
    <input
      type="number"
      name={name}
      value={raw}
      className={classnames(
        'input',
        'w-full',
        'text-right',
        error ? 'is-invalid' : '',
        className ?? 'max-w-8'
      )}
      onChange={onChangeRaw}
      min={min}
      max={max}
      {...rest}
    />
  );
};
