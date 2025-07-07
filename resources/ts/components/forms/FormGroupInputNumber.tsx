import React, { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputNumber } from './FormInputNumber';

type Props = ComponentProps<typeof FormGroup> & {
  labelUnitText?: string;
};

type FormGroupInputNumberProps = Omit<ComponentProps<typeof FormInputNumber>, keyof Props> & Props;

export const FormGroupInputNumber: React.VFC<FormGroupInputNumberProps> = ({
  groupClassName,
  labelText,
  labelUnitText,
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
      <div className="flex items-center">
        <FormInputNumber {...rest} />
        {labelUnitText && <div className="ml-2 text-xs">{labelUnitText}</div>}
      </div>
    </FormGroup>
  );
};
