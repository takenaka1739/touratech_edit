import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormGroupTextarea } from '@/components/forms/FormGroupTextarea';

type FormGroupTextareaProps = ComponentProps<typeof FormGroupTextarea>;

export default {
  title: 'components/forms/FormGroupTextarea',
  component: FormGroupTextarea,
} as Meta;

const Template: Story<FormGroupTextareaProps> = args => <FormGroupTextarea {...args} />;

export const showFormGroupTextarea = Template.bind({});
showFormGroupTextarea.args = {
  labelText: 'ラベル',
  required: true,
};
