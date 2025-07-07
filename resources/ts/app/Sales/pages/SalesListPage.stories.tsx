import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { Sales } from '@/types';
import { SalesListPage } from './SalesListPage';

export default {
  title: 'app/Sales/pages/SalesListPage',
  component: SalesListPage,
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

  let rows: Sales[] = [];
  if (!args.props) {
    rows = [
      {
        id: 1,
        sales_date: '2021/02/24',
        delivery_date: '2021/03/24',
        customer_id: 11,
        customer_name: '得意先01',
        send_flg: false,
        name: '届け先名01',
        zip_code: '000-0000',
        address1: '住所１',
        address2: '住所２',
        tel: '000-0000-0000',
        fax: '000-0000-0000',
        corporate_class: 1,
        user_id: 1,
        user_name: 'テスト01',
        shipping_amount: 4000,
        fee: 300,
        discount: 340,
        total_amount: 2300,
        order_no: 'ORDER_NO01',
        remarks: undefined,
        rate: 1,
        sales_tax_rate: 10,
        fraction: 1,
        details: [],
      },
    ];
  }
  useEffect(() => {
    mock.onPost('/api/sales/fetch').reply(200, {
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
  return <SalesListPage {...args} />;
};

export const showPage = Template.bind({});
showPage.args = {};
