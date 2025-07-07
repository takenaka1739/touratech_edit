import { ComponentProps } from 'react';
import { FormGroup } from '@/components/forms/FormGroup';
import { FormInputZipCode } from './FormInputZipCode';

type Props = ComponentProps<typeof FormGroup> & {
  labelUnitText?: string;
};

export type FormGroupInputZipCodeProps = Omit<
  ComponentProps<typeof FormInputZipCode>,
  keyof Props
> &
  Props;

export const FormGroupInputZipCode: React.VFC<FormGroupInputZipCodeProps> = ({
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
        <FormInputZipCode {...rest} />
        {labelUnitText && <div className="ml-2 text-xs">{labelUnitText}</div>}
      </div>
    </FormGroup>
  );
};
