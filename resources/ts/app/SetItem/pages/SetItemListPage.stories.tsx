import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { SetItem } from '@/types';
import { SetItemListPage } from './SetItemListPage';

export default {
  title: 'app/SetItem/pages/SetItemListPage',
  component: SetItemListPage,
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

  let rows: SetItem[] = [];
  if (!args.props) {
    rows = [
      {
        id: 1,
        name: 'テスト01',
        name_jp: 'テスト01',
        item_number: '00-9999-xxxx',
        sales_unit_price: 4900.05,
        discontinued_date: undefined,
        is_display: true,
        is_set_item: true,
        total_quantity: 200,
        details: [],
      },
    ];
  }

  useEffect(() => {
    mock.onPost('/api/set_item/fetch').reply(200, {
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
  return <SetItemListPage {...args} />;
};

export const showPage = Template.bind({});
showPage.args = {};
