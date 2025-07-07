import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import store from '@/store';
import { TopPage } from './TopPage';

export default {
  title: 'app/App/pages/TopPage',
  component: TopPage,
  decorators: [
    (story: () => React.ReactNode) => (
      <Provider store={store}>
        <MemoryRouter>
          <div className="min-w-md">{story()}</div>
        </MemoryRouter>
      </Provider>
    ),
  ],
  argTypes: {
    props: {
      control: {
        type: 'select',
        options: {
          General: 0,
          Admin: 1,
        },
      },
    },
  },
} as Meta;

const Template: Story = args => {
  return <TopPage {...args} />;
};

export const showPage = Template.bind({});
showPage.args = {};
