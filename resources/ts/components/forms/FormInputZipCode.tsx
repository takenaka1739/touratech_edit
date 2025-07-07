import React, { ComponentProps, FocusEvent } from 'react';
import { FormInputText } from './FormInputText';
import { addHyphenZipCode, toHalfNumber } from '@/utils';
import classNames from 'classnames';

type FormInputZipCodeProps = Omit<
  ComponentProps<typeof FormInputText>,
  'placeholder' | 'maxLength'
>;

export const FormInputZipCode: React.VFC<FormInputZipCodeProps> = ({
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
  const onBlurZipCode: (e: FocusEvent<HTMLInputElement>) => void = e => {
    if (onChange) {
      const val = e.currentTarget.value;
      const zip = addHyphenZipCode(toHalfNumber(val).replace(/[－]/g, '-')).substring(0, 8);
      onChange(name, zip);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <FormInputText
      name={name}
      className={classNames('max-w-5', className)}
      onChange={onChangeRaw}
      onBlur={onBlurZipCode}
      placeholder={'000-0000'}
      maxLength={8}
      {...props}
    />
  );
};
