import React, { ComponentProps, ChangeEvent, InputHTMLAttributes, useState } from 'react';
import { FormProps } from './FormProps';
import { FormGroup } from './FormGroup';
import classnames from 'classnames';

type Props = ComponentProps<typeof FormGroup> &
  FormProps & {
    isUpdate: boolean;
    onChangeEditable: (isEditable: boolean) => void;
  };

type FormGroupPasswordProps = Omit<
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof Props> & Props,
  'type' | 'readonly'
>;

export const FormGroupPassword: React.VFC<FormGroupPasswordProps> = ({
  labelText,
  groupClassName,
  name,
  error,
  className,
  readOnly,
  isUpdate,
  onChange,
  onChangeEditable,
  ...rest
}) => {
  const [isEditable, setIsEditable] = useState(!isUpdate);

  const onChangeRaw: (e: ChangeEvent<HTMLInputElement>) => void = e => {
    if (onChange) onChange(name, e.currentTarget.value);
  };

  const onChangeCheck = () => {
    if (onChangeEditable) {
      onChangeEditable(!isEditable);
    }

    setIsEditable(!isEditable);
  };

  return (
    <FormGroup
      labelText="パスワード"
      required={rest.required}
      error={error}
      groupClassName={groupClassName}
    >
      <div className="flex items-center">
        <input
          type="password"
          name={name}
          className={classnames('input', 'w-full', error ? 'is-invalid' : '', className)}
          onChange={onChangeRaw}
          readOnly={!isEditable}
          {...rest}
        />
        {isUpdate && (
          <div className="ml-4">
            <label className="text-xs flex items-center">
              <input
                type="checkbox"
                name={`${name}_is_editable`}
                className="mr-2"
                checked={isEditable}
                onChange={onChangeCheck}
              />
              パスワードを変更する
            </label>
          </div>
        )}
      </div>
    </FormGroup>
  );
};
