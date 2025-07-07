import React, { ComponentProps } from 'react';
import { FormInputText } from './FormInputText';

type FormInputItemNumberProps = Omit<ComponentProps<typeof FormInputText>, 'maxLength'> & {};

export const FormInputItemNumber: React.VFC<FormInputItemNumberProps> = ({ ...props }) => {
  return <FormInputText maxLength={50} {...props} />;
};
