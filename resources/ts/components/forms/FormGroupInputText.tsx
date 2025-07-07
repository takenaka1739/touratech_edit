import { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputText } from './FormInputText';

type Props = ComponentProps<typeof FormGroup> & {
  labelUnitText?: string;
};

type FormGroupInputTextProps = Omit<ComponentProps<typeof FormInputText>, keyof Props> & Props;

export const FormGroupInputText: React.VFC<FormGroupInputTextProps> = ({
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
        <FormInputText {...rest} />
        {labelUnitText && <div className="ml-2 text-xs">{labelUnitText}</div>}
      </div>
    </FormGroup>
  );
};
