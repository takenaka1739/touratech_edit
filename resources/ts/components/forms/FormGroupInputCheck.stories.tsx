import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormGroupInputCheck } from './FormGroupInputCheck';

type FormGroupInputCheckProps = ComponentProps<typeof FormGroupInputCheck>;

export default {
  title: 'components/forms/FormGroupInputCheck',
  component: FormGroupInputCheck,
} as Meta;

const Template: Story<FormGroupInputCheckProps> = args => <FormGroupInputCheck {...args} />;

export const showFormGroupInputText = Template.bind({});
showFormGroupInputText.args = {
  labelText: 'ラベル',
  id: 'test',
  required: true,
};
