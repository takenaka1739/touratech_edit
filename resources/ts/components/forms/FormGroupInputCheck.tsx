import React, { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputCheck } from './FormInputCheck';

interface Props extends ComponentProps<typeof FormGroup> {}

type FormGroupInputCheckProps = Omit<ComponentProps<typeof FormInputCheck>, keyof Props> & Props;

export const FormGroupInputCheck: React.VFC<FormGroupInputCheckProps> = ({
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
      <FormInputCheck labelText={labelText} {...rest} />
    </FormGroup>
  );
};
