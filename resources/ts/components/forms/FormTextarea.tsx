import React, { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { FormProps } from './FormProps';
import classnames from 'classnames';

export type FormTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof FormProps> &
  FormProps;

export const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  className,
  error,
  onChange,
  ...rest
}) => {
  const onChangeRaw: (e: ChangeEvent<HTMLTextAreaElement>) => void = e => {
    if (onChange) onChange(name, e.currentTarget.value);
  };
  return (
    <textarea
      name={name}
      className={classnames(
        'textarea',
        'w-full',
        error ? 'is-invalid' : '',
        className ?? 'max-w-lg'
      )}
      onChange={onChangeRaw}
      {...rest}
    />
  );
};
