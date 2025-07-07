import React, { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormTextarea } from './FormTextarea';

type Props = ComponentProps<typeof FormGroup> & {};

type FormGroupTextareaProps = Omit<ComponentProps<typeof FormTextarea>, keyof Props> & Props;

export const FormGroupTextarea: React.VFC<FormGroupTextareaProps> = ({
  error,
  groupClassName,
  labelText,
  removeOptionalLabel,
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
      <FormTextarea {...rest} />
    </FormGroup>
  );
};
