import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormInputDate } from './FormInputDate';

type FormInputDateProps = ComponentProps<typeof FormInputDate>;

export default {
  title: 'components/forms/FormInputDate',
  component: FormInputDate,
  decorators: [story => <div className="form-group">{story()}</div>],
  argTypes: {
    value: {
      control: {
        type: 'select',
        options: {},
      },
    },
  },
} as Meta;

const Template: Story<FormInputDateProps> = args => <FormInputDate {...args} />;

export const showFormInputNumber = Template.bind({});
showFormInputNumber.args = {
  value: '2020/12/31',
  onChange: () => {},
};
