import React, { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormTextarea } from './FormTextarea';

type FormGroupTextareaProps = {
  helpText?: string;
} & ComponentProps<typeof FormGroup> &
  ComponentProps<typeof FormTextarea>;

export const FormGroupTextarea: React.VFC<FormGroupTextareaProps> = ({
  error,
  groupClassName,
  labelText,
  removeOptionalLabel,
  helpText,
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
      <FormTextarea error={error} {...rest} />
    </FormGroup>
  );
};
