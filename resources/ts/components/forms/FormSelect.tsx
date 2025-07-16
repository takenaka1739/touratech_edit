import React, { ChangeEvent, InputHTMLAttributes } from 'react';
import { FormProps } from './FormProps';
import toNumber from 'lodash/toNumber';
import classNames from 'classnames';

type Props = FormProps & {
  options?: {
    name: string;
    value: string | number | undefined;
  }[];
};

type FormSelectProps = Omit<InputHTMLAttributes<HTMLSelectElement>, keyof Props> & Props;

export const FormSelect: React.VFC<FormSelectProps> = ({
  name,
  className,
  error,
  options,
  onChange,
  multiple,
  ...rest
}) => {
  const onChangeRaw = (e: ChangeEvent<HTMLSelectElement>) => {
    if (!onChange) return;

    if (multiple) {
      // multiple時は string[] に変換
      const selectedValues = Array.from(e.target.selectedOptions).map(o => o.value);
      onChange(name, selectedValues as unknown as string); // ← TS上は string として渡す
    } else if (typeof rest.value === 'number') {
      onChange(name, toNumber(e.currentTarget.value));
    } else {
      onChange(name, e.currentTarget.value);
    }
  };

  return (
    <select
      name={name}
      multiple={multiple}
      className={classNames(error ? 'is-invalid' : '', className)}
      onChange={onChangeRaw}
      {...rest}
    >
      {options?.map((o, i) => (
        <option key={i} value={o.value}>
          {o.name}
        </option>
      ))}
    </select>
  );
};