import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormGroupInputDate } from './FormGroupInputDate';

type FormGroupInputDateProps = ComponentProps<typeof FormGroupInputDate>;

export default {
  title: 'components/forms/FormGroupInputDate',
  component: FormGroupInputDate,
} as Meta;

const Template: Story<FormGroupInputDateProps> = args => <FormGroupInputDate {...args} />;

export const showFormGroupInputDate = Template.bind({});
showFormGroupInputDate.args = {
  labelText: 'ラベル',
  value: '2020/12/02',
  required: true,
};
