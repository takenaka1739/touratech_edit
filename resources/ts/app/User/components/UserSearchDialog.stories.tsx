import React, { ComponentProps, useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { UserSearchDialog } from './UserSearchDialog';

type UserSearchDialogProps = ComponentProps<typeof UserSearchDialog>;

export default {
  title: 'app/User/components/UserSearchDialog',
  component: UserSearchDialog,
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
    match: {
      control: {
        type: 'select',
        options: {
          option1: {},
          option2: {
            params: {
              id: 1,
            },
          },
        },
      },
    },
  },
} as Meta;

const Template: Story<UserSearchDialogProps> = args => {
  const mock = new MockAdapter(axios);

  const rows = Array.from(new Array(20)).map((v, i) => {
    return {
      id: i + 1,
      name: `担当者${i + 1}`,
      v,
    };
  });

  useEffect(() => {
    mock.onPost('/api/user/dialog').reply(200, {
      success: true,
      data: {
        rows,
        pager: {
          currentPage: 1,
          lastPage: 2,
          perPage: 20,
          from: 1,
          to: 20,
          total: 21,
        },
      },
    });
    return () => {
      mock.reset();
    };
  });

  return <UserSearchDialog {...args} />;
};

export const showSearchDialog = Template.bind({});
showSearchDialog.args = {
  isShown: true,
};
