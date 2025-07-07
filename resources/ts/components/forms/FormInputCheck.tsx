import React, { ChangeEvent, InputHTMLAttributes } from 'react';
import { FormProps } from './FormProps';
import classNames from 'classnames';

type Props = FormProps & {
  labelText?: string;
  id: string;
};

type FormInputCheckProps = Omit<
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof Props> & Props,
  'type'
>;

export const FormInputCheck: React.VFC<FormInputCheckProps> = ({
  labelText,
  name,
  className,
  error,
  onChange,
  ...rest
}) => {
  const onChangeRaw: (e: ChangeEvent<HTMLInputElement>) => void = e => {
    if (onChange) onChange(name, e.currentTarget.checked ? true : false);
  };

  return (
    <div className="flex items-center mt-1 mr-3">
      <input
        type="checkbox"
        name={name}
        className={classNames(error ? 'is-invalid' : '', className)}
        onChange={onChangeRaw}
        {...rest}
      />
      <label className="label ml-1 text-sm" htmlFor={rest.id}>
        {labelText}
      </label>
    </div>
  );
};
