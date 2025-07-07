import React, { ComponentProps } from 'react';
import { FormProps } from './FormProps';
import { FormGroup } from './FormGroup';
import { FormInputRadio } from './FormInputRadio';

type Props = ComponentProps<typeof FormGroup> & {
  corporateClass: number | undefined;
};

type FormCorporateClassProps = Omit<Omit<FormProps, keyof Props> & Props, 'labelText' | 'name'>;

export const FormCorporateClass: React.VFC<FormCorporateClassProps> = ({
  error,
  corporateClass,
  required,
  onChange,
}) => {
  const name = 'corporate_class';
  return (
    <FormGroup labelText={'支払方法'} required={required} error={error}>
      <div className="flex mt-1">
        <FormInputRadio
          labelText="現金"
          id={`${name}_1`}
          name={name}
          value={1}
          error={error}
          checked={corporateClass === 1}
          onChange={onChange}
        />
        <FormInputRadio
          labelText="掛売"
          id={`${name}_2`}
          name={name}
          value={2}
          checked={corporateClass === 2}
          onChange={onChange}
        />
        <FormInputRadio
          labelText="宅配代引"
          id={`${name}_3`}
          name={name}
          value={3}
          checked={corporateClass === 3}
          onChange={onChange}
        />
        <FormInputRadio
          labelText="銀行振込"
          id={`${name}_4`}
          name={name}
          value={4}
          checked={corporateClass === 4}
          onChange={onChange}
        />
        <FormInputRadio
          labelText="クレジットカード"
          id={`${name}_5`}
          name={name}
          value={5}
          checked={corporateClass === 5}
          onChange={onChange}
        />
      </div>
    </FormGroup>
  );
};
