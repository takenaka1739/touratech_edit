import { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputText } from './FormInputText';

type Props = ComponentProps<typeof FormGroup> & {
  labelUnitText?: string;
};

type FormGroupInputTextProps = Omit<ComponentProps<typeof FormInputText>, keyof Props> & Props;

export const FormGroupInputTextRow: React.VFC<FormGroupInputTextProps> = ({
  groupClassName,
  labelText,
  labelUnitText,
  removeOptionalLabel,
  ...rest
}) => {
  return (
    <div className="flex items-center mt-3">
      <span className="form-label-text mr-2" dangerouslySetInnerHTML={{ __html: labelText }} />
      <FormInputText {...rest}/>
      {labelUnitText && <div className="ml-2 text-xs w-2">{labelUnitText}</div>}
    </div>
  );
};
