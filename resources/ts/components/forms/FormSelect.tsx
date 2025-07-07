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
  ...rest
}) => {
  const onChangeRaw: (e: ChangeEvent<HTMLSelectElement>) => void = e => {
    if (onChange) {
      if (typeof rest.value === 'number') {
        onChange(name, toNumber(e.currentTarget.value));
      } else {
        onChange(name, e.currentTarget.value);
      }
    }
  };

  return (
    <select
      name={name}
      className={classNames(error ? 'is-invalid' : '', className)}
      onChange={onChangeRaw}
      {...rest}
    >
      {options &&
        options.map((o, i) => (
          <option key={i} value={o.value}>
            {o.name}
          </option>
        ))}
    </select>
  );
};
