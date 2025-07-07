import React, { ComponentProps } from 'react';
import { Story, Meta } from '@storybook/react';
import { Pager } from './Pager';

type PagerProps = ComponentProps<typeof Pager>;

export default {
  title: 'components/Pager',
  component: Pager,
  decorators: [(story: () => React.ReactNode) => <div className="box-pager">{story()}</div>],
} as Meta;

const Template: Story<PagerProps> = args => <Pager {...args} />;

export const showPager = Template.bind({});
showPager.args = { currentPage: 1, lastPage: 1, handleChangePage: () => {} };
