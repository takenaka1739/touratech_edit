import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { SetItemDetailPage, SetItemDetailPageProps } from './SetItemDetailPage';
import { SetItem } from '@/types';

export default {
  title: 'app/SetItem/pages/SetItemDetailPage',
  component: SetItemDetailPage,
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

const Template: Story<SetItemDetailPageProps> = args => {
  const mock = new MockAdapter(axios);

  useEffect(() => {
    mock.onGet('/api/set_item/edit/1').reply(200, {
      success: true,
      data: {
        id: 1,
        item_number: 'A0001',
        name: '商品名01',
        sales_unit_price: 1001,
        discontinued_date: undefined,
        details: [
          {
            id: 1,
            item_id: 10,
            item_number: '0-1001-01',
            item_name: 'テスト',
            quantity: 5000,
          },
        ],
      } as SetItem,
    });
    return () => {
      mock.reset();
    };
  });

  return <SetItemDetailPage {...args} />;
};

export const showDetailPage = Template.bind({});
showDetailPage.args = {};
