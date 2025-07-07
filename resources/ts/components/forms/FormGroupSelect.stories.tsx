import { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormGroupSelect } from './FormGroupSelect';

type FormGroupSelectProps = ComponentProps<typeof FormGroupSelect>;

export default {
  title: 'components/forms/FormGroupSelect',
  component: FormGroupSelect,
  argTypes: {
    options: {
      control: {
        type: 'select',
        options: {
          option1: [],
          option2: [
            { name: '', value: '' },
            { name: '北海道', value: '01' },
          ],
        },
      },
    },
  },
} as Meta;

const Template: Story<FormGroupSelectProps> = args => <FormGroupSelect {...args} />;

export const showFormGroupSelect = Template.bind({});
showFormGroupSelect.args = {
  labelText: 'ラベル',
  required: true,
};
