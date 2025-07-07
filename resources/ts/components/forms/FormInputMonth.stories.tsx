import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormInputMonth } from './FormInputMonth';

type FormInputMonthProps = ComponentProps<typeof FormInputMonth>;

export default {
  title: 'components/forms/FormInputMonth',
  component: FormInputMonth,
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

const Template: Story<FormInputMonthProps> = args => <FormInputMonth {...args} />;

export const showFormInputNumber = Template.bind({});
showFormInputNumber.args = {
  value: '2020/12',
  onChange: () => {},
};
