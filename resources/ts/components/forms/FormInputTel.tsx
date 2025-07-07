import React, { ComponentProps, FocusEvent } from 'react';
import { FormInputText } from './FormInputText';
import classNames from 'classnames';
import { toHalfNumber } from '@/utils';

type FormInputTelProps = Omit<ComponentProps<typeof FormInputText>, 'placeholder' | 'maxLength'>;

export const FormInputTel: React.VFC<FormInputTelProps> = ({
  name,
  className,
  onChange,
  onBlur,
  ...props
}) => {
  const onChangeRaw: typeof onChange = (name, value) => {
    if (onChange) {
      if (/^[0-9０-９\-－]*$/.test(String(value))) {
        onChange(name, value);
      }
    }
  };

  const onBlurRaw: (e: FocusEvent<HTMLInputElement>) => void = e => {
    if (onChange) {
      const val = e.currentTarget.value;
      const tel = toHalfNumber(val).replace(/[－]/g, '-');
      onChange(name, tel);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <FormInputText
      name={name}
      className={classNames('max-w-7', className)}
      placeholder={'000-000-0000'}
      maxLength={13}
      onChange={onChangeRaw}
      onBlur={onBlurRaw}
      {...props}
    />
  );
};
