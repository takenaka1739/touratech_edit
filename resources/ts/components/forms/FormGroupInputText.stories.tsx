import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormGroupInputText } from './FormGroupInputText';

type FormGroupInputTextProps = ComponentProps<typeof FormGroupInputText>;

export default {
  title: 'components/forms/FormGroupInputText',
  component: FormGroupInputText,
} as Meta;

const Template: Story<FormGroupInputTextProps> = args => <FormGroupInputText {...args} />;

export const showFormGroupInputText = Template.bind({});
showFormGroupInputText.args = {
  labelText: 'ラベル',
  required: true,
};
