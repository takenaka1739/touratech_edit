import React, { ComponentProps } from 'react';
import classnames from 'classnames';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormGroup } from '@/components/forms/FormGroup';

type Props = ComponentProps<typeof FormGroup> & {};

type FormGroupSelectProps = Omit<ComponentProps<typeof FormSelect>, keyof Props> & Props;

export const FormGroupSelect: React.VFC<FormGroupSelectProps> = ({
  error,
  groupClassName,
  labelText,
  removeOptionalLabel,
  options,
  ...rest
}) => {
  return (
    <FormGroup
      error={error}
      groupClassName={groupClassName}
      labelText={labelText}
      removeOptionalLabel={removeOptionalLabel}
      required={rest.required}
    >
      <FormSelect
        className={classnames('select', error ? 'is-invalid' : '', rest.className)}
        options={options}
        {...rest}
      />
    </FormGroup>
  );
};
