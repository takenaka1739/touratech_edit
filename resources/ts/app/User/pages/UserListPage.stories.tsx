import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { User } from '@/types';
import { UserListPage } from './UserListPage';

export default {
  title: 'app/User/pages/UserListPage',
  component: UserListPage,
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
          Normal: 0,
          NotFound: 1,
        },
      },
    },
  },
} as Meta;

const Template: Story = args => {
  const mock = new MockAdapter(axios);

  let rows: User[] = [];
  if (!args.props) {
    rows = [
      {
        id: 1,
        name: 'テスト01',
        login_id: 'loginID',
        password: undefined,
        role: 1,
      },
    ];
  }

  useEffect(() => {
    mock.onPost('/api/user/fetch').reply(200, {
      success: true,
      data: {
        rows,
        pager: {
          currentPage: 1,
          lastPage: 1,
          perPage: 20,
          from: 1,
          to: rows.length,
          total: rows.length,
        },
      },
    });
    return () => {
      mock.reset();
    };
  });
  return <UserListPage {...args} />;
};

export const showPage = Template.bind({});
showPage.args = {};
