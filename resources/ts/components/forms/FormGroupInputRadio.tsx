import { ComponentProps } from 'react';
import { FormGroup } from './FormGroup';
import { FormInputRadio } from './FormInputRadio';

type Props = ComponentProps<typeof FormGroup> & {
  items: {
    labelText: string;
    id: string;
    value: string | number | undefined;
  }[];
};

type FormGroupInputRadioProps = Omit<
  Omit<ComponentProps<typeof FormInputRadio>, keyof Props> & Props,
  'id' | 'checked'
>;

export const FormGroupInputRadio: React.VFC<FormGroupInputRadioProps> = ({
  groupClassName,
  labelText,
  removeOptionalLabel,
  items,
  value,
  ...rest
}) => {
  const el = items.map((x, i) => (
    <FormInputRadio
      key={i}
      labelText={x.labelText}
      id={x.id}
      value={x.value}
      checked={value == x.value}
      {...rest}
    />
  ));

  return (
    <FormGroup
      error={rest.error}
      groupClassName={groupClassName}
      labelText={labelText}
      removeOptionalLabel={removeOptionalLabel}
      required={rest.required}
    >
      <div className="flex items-center mt-1">{el}</div>
    </FormGroup>
  );
};
