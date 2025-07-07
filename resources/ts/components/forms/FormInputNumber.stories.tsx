import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormInputNumber } from './FormInputNumber';

type FormInputNumberProps = ComponentProps<typeof FormInputNumber>;

export default {
  title: 'components/forms/FormInputNumber',
  component: FormInputNumber,
  decorators: [story => <div className="form-group">{story()}</div>],
} as Meta;

const Template: Story<FormInputNumberProps> = args => <FormInputNumber {...args} />;

export const showFormInputNumber = Template.bind({});
showFormInputNumber.args = {};
