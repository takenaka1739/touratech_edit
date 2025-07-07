import React, { ComponentProps } from 'react';
import { FormProps } from './FormProps';
import { FormGroup } from './FormGroup';
import { FormInputRadio } from './FormInputRadio';

type Props = ComponentProps<typeof FormGroup> & {
  fraction: number | undefined;
};

type FormFractionProps = Omit<Omit<FormProps, keyof Props> & Props, 'labelText' | 'name'>;

export const FormFraction: React.VFC<FormFractionProps> = ({
  error,
  fraction,
  required,
  onChange,
}) => {
  const name = 'fraction';

  return (
    <FormGroup labelText={'端数処理'} required={required} error={error}>
      <div className="flex mt-1">
        <FormInputRadio
          labelText="切り捨て"
          id={`${name}_1`}
          name={name}
          value={1}
          checked={fraction === 1}
          onChange={onChange}
        />
        <FormInputRadio
          labelText="切り上げ"
          id={`${name}_2`}
          name={name}
          value={2}
          checked={fraction === 2}
          onChange={onChange}
        />
        <FormInputRadio
          labelText="四捨五入"
          id={`${name}_3`}
          name={name}
          value={3}
          checked={fraction === 3}
          onChange={onChange}
        />
      </div>
    </FormGroup>
  );
};
