import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { UserDetailPage, UserDetailPageProps } from './UserDetailPage';

export default {
  title: 'app/User/pages/UserDetailPage',
  component: UserDetailPage,
  decorators: [
    (story: () => React.ReactNode) => (
      <Provider store={store}>
        <MemoryRouter>{story()}</MemoryRouter>
      </Provider>
    ),
  ],
  argTypes: {
    match: {
      control: {
        type: 'select',
        options: {
          add: {},
          edit: {
            params: {
              id: 1,
            },
          },
        },
      },
    },
  },
} as Meta;

const Template: Story<UserDetailPageProps> = args => {
  const mock = new MockAdapter(axios);

  useEffect(() => {
    mock.onGet('/api/user/edit/1').reply(200, {
      success: true,
      data: {
        name: '担当者1',
        login_id: 'login_id1',
        role: 1,
      },
    });
    return () => {
      mock.reset();
    };
  });

  return <UserDetailPage {...args} />;
};

export const showPage = Template.bind({});
showPage.args = {};
