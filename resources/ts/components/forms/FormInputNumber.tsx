import React, { ChangeEvent, InputHTMLAttributes } from 'react';
import { FormProps } from './FormProps';
import toNumber from 'lodash/toNumber';
import classnames from 'classnames';

type FormInputNumberProps = Omit<
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof FormProps> & FormProps,
  'type' | 'value'
> & {
  value: number | undefined;
  precision: number;
};

export const FormInputNumber: React.VFC<FormInputNumberProps> = ({
  name,
  value,
  className,
  error,
  min,
  max,
  precision,
  onChange,
  ...rest
}) => {
  const onChangeRaw: (e: ChangeEvent<HTMLInputElement>) => void = e => {
    if (onChange) {
      const val = e.currentTarget.value;
      if (!val && !rest.required) {
        onChange(name, val);
        return;
      }
      if (toNumber(min) >= 0 && /[\-]/.test(val)) {
        return;
      }
      if (precision === 0 && /[\.]/.test(val)) {
        return;
      }
      if (precision > 0 && /[\.]/.test(val)) {
        const match = val.match(/^\d+\.(\d+)$/);
        if (match && match[1].length > precision) {
          return;
        }
      }
      const num = toNumber(val);
      if ((min && num < min) || (max && max < num)) {
        return;
      }
      onChange(name, num);
    }
  };

  return (
    <input
      type="number"
      name={name}
      value={value ?? ''}
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
