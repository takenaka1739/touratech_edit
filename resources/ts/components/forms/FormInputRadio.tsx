import React, { ChangeEvent, InputHTMLAttributes } from 'react';
import { FormProps } from './FormProps';
import toNumber from 'lodash/toNumber';
import classNames from 'classnames';

type Props = FormProps & {
  labelText: string;
  id: string;
  checked: boolean;
};

type FormInputRadioProps = Omit<
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof Props> & Props,
  'type'
>;

export const FormInputRadio: React.VFC<FormInputRadioProps> = ({
  labelText,
  name,
  value,
  className,
  error,
  onChange,
  ...rest
}) => {
  const onChangeRaw: (e: ChangeEvent<HTMLInputElement>) => void = e => {
    if (onChange) {
      if (typeof value === 'number') {
        onChange(name, toNumber(e.currentTarget.value));
      } else {
        onChange(name, e.currentTarget.value);
      }
    }
  };

  return (
    <div className="flex items-center mr-3">
      <input
        type="radio"
        name={name}
        value={value}
        className={classNames(error ? 'is-invalid' : '', className)}
        onChange={onChangeRaw}
        {...rest}
      />
      <label className="label ml-1" htmlFor={rest.id}>
        {labelText}
      </label>
    </div>
  );
};
