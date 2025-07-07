import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import store from '@/store';
import { HidenDetailPage } from './HidenDetailPage';

export default {
  title: 'app/Hiden/pages/HidenDetailPage',
  component: HidenDetailPage,
  decorators: [
    (story: () => React.ReactNode) => (
      <Provider store={store}>
        <MemoryRouter>
          <div className="min-w-md">{story()}</div>
        </MemoryRouter>
      </Provider>
    ),
  ],
} as Meta;

const Template: Story = () => {
  return <HidenDetailPage />;
};

export const showDetailPage = Template.bind({});
showDetailPage.args = {};
