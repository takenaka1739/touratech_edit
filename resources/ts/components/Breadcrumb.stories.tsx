import React, { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

type BreadcrumbProps = ComponentProps<typeof Breadcrumb>;

export default {
  title: 'components/Breadcrumb',
  component: Breadcrumb,
  decorators: [(story: () => React.ReactNode) => <MemoryRouter>{story()}</MemoryRouter>],
  argTypes: {
    breadcrumb: {
      control: {
        type: 'select',
        options: {
          option1: [],
          option2: [{ name: 'リンク1' }],
          option3: [{ name: 'リンク1', url: '/test/' }],
        },
      },
    },
  },
} as Meta;

const Template: Story<BreadcrumbProps> = args => <Breadcrumb {...args} />;

export const showBreadcrumb = Template.bind({});
showBreadcrumb.args = {};
