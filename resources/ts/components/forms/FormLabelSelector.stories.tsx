import { ComponentProps, useState } from 'react';
import { Story, Meta } from '@storybook/react';
import { FormLabelSelector } from './FormLabelSelector';

type FormLabelSelectorProps = ComponentProps<typeof FormLabelSelector>;

export default {
  title: 'components/forms/FormLabelSelector',
  component: FormLabelSelector,
  decorators: [story => <div>{story()}</div>],
} as Meta;

const Template: Story<FormLabelSelectorProps> = () => {
  const [selected, setSelected] = useState<number[]>([]);
  const onSelected = (no: number) => {
    if (selected.includes(no)) {
      setSelected(selected.filter(i => i != no));
    } else {
      setSelected([...selected, no]);
    }
  };

  return <FormLabelSelector selected={selected} onSelected={onSelected} />;
};

export const showFormLabelSelector = Template.bind({});
