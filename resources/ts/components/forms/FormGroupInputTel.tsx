import { ComponentProps } from 'react';
import { FormGroup } from '@/components/forms/FormGroup';
import { FormInputTel } from './FormInputTel';

type Props = ComponentProps<typeof FormGroup> & {
  labelUnitText?: string;
};

type FormGroupInputTelProps = Omit<ComponentProps<typeof FormInputTel>, keyof Props> & Props;

export const FormGroupInputTel: React.VFC<FormGroupInputTelProps> = ({
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
        <FormInputTel {...rest} />
        {labelUnitText && <div className="ml-2 text-xs">{labelUnitText}</div>}
      </div>
    </FormGroup>
  );
};
