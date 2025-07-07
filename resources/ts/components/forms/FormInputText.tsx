import React, { useState, InputHTMLAttributes, ChangeEvent } from 'react';
import { FormProps } from './FormProps';
import classnames from 'classnames';

type Props = FormProps & {
  onEnterFunc?: () => void;
};

type FormInputTextProps = Omit<
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof Props> & Props,
  'type'
>;

export const FormInputText: React.VFC<FormInputTextProps> = ({
  name,
  value,
  className,
  error,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onKeyDown,
  onEnterFunc,
  ...rest
}) => {
  const [composing, setComposing] = useState(false);
  const onChangeRaw: (e: ChangeEvent<HTMLInputElement>) => void = e => {
    if (onChange) onChange(name, e.currentTarget.value);
  };

  return (
    <input
      type="text"
      name={name}
      value={value ?? ''}
      className={classnames('input', 'w-full', error ? 'is-invalid' : '', className ?? 'max-w-lg')}
      onChange={onChangeRaw}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={() => setComposing(false)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !composing) {
          if (onEnterFunc) {
            onEnterFunc();
          }
        }

        if (onKeyDown) {
          onKeyDown(e);
        }
      }}
      {...rest}
    />
  );
};
