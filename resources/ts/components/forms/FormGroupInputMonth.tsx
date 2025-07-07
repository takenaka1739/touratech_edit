import React, { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputMonth } from './FormInputMonth';

type Props = ComponentProps<typeof FormGroup> & {};

type FormGroupInputMonthProps = Omit<ComponentProps<typeof FormInputMonth>, keyof Props> & Props;

export const FormGroupInputMonth: React.VFC<FormGroupInputMonthProps> = ({
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
      <FormInputMonth {...rest} />
    </FormGroup>
  );
};
