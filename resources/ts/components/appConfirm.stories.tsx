import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import { ConfirmModal } from './appConfirm';

export default {
  title: 'components/appConfirm',
  component: ConfirmModal,
  decorators: [(story: () => React.ReactNode) => <MemoryRouter>{story()}</MemoryRouter>],
} as Meta;

const Template: Story = args => <ConfirmModal resolve={() => {}} cleanup={() => {}} {...args} />;

export const showModal = Template.bind({});
showModal.args = {
  children: 'テストああああああああああいいいいいいいいいいいい',
};
