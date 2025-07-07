import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormInputText } from './FormInputText';

type FormInputTextProps = ComponentProps<typeof FormInputText>;

export default {
  title: 'components/forms/FormInputText',
  component: FormInputText,
  decorators: [story => <div className="form-group">{story()}</div>],
} as Meta;

const Template: Story<FormInputTextProps> = args => <FormInputText {...args} />;

export const showFormInputText = Template.bind({});
showFormInputText.args = {};
