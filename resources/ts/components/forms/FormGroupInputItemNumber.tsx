import { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputItemNumber } from './FormInputItemNumber';

type Props = ComponentProps<typeof FormGroup> & {
  labelUnitText?: string;
};

type FromGroupInputItemNumberProps = Omit<ComponentProps<typeof FormInputItemNumber>, keyof Props> &
  Props;

export const FromGroupInputItemNumber: React.VFC<FromGroupInputItemNumberProps> = ({
  labelText,
  groupClassName,
  removeOptionalLabel,
  labelUnitText,
  ...rest
}) => {
  return (
    <FormGroup
      labelText={labelText}
      required={rest.required}
      error={rest.error}
      groupClassName={groupClassName}
      removeOptionalLabel={removeOptionalLabel}
    >
      <div className="flex items-center">
        <FormInputItemNumber {...rest} />
        {labelUnitText && <div className="ml-2 text-xs">{labelUnitText}</div>}
      </div>
    </FormGroup>
  );
};
