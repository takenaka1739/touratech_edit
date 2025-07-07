import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormGroupPassword } from '@/components/forms/FormGroupPassword';

type FormGroupPasswordProps = ComponentProps<typeof FormGroupPassword>;

export default {
  title: 'components/forms/FormGroupPassword',
  component: FormGroupPassword,
} as Meta;

const Template: Story<FormGroupPasswordProps> = args => <FormGroupPassword {...args} />;

export const showFormGroupPassword = Template.bind({});
showFormGroupPassword.args = {
  labelText: 'ラベル',
  name: 'password',
  required: true,
  isUpdate: false,
};
