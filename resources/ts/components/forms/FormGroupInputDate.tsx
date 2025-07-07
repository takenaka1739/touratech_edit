import React, { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputDate } from './FormInputDate';

type Props = ComponentProps<typeof FormGroup> & {};

type FormGroupInputDateProps = Omit<ComponentProps<typeof FormInputDate>, keyof Props> & Props;

export const FormGroupInputDate: React.VFC<FormGroupInputDateProps> = ({
  groupClassName,
  labelText,
  removeOptionalLabel,
  ...rest
}) => {
  return (
    <FormGroup
      error={rest.error}
      groupClassName={groupClassName}
      labelText={labelText}
      removeOptionalLabel={removeOptionalLabel}
      required={rest.required}
    >
      <FormInputDate {...rest} />
    </FormGroup>
  );
};
