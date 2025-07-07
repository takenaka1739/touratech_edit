import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormGroupInputNumber } from './FormGroupInputNumber';

type FormGroupInputNumberProps = ComponentProps<typeof FormGroupInputNumber>;

export default {
  title: 'components/forms/FormGroupInputNumber',
  component: FormGroupInputNumber,
} as Meta;

const Template: Story<FormGroupInputNumberProps> = args => <FormGroupInputNumber {...args} />;

export const showFormGroupInputNumber = Template.bind({});
showFormGroupInputNumber.args = {
  labelText: 'ラベル',
  required: true,
};
