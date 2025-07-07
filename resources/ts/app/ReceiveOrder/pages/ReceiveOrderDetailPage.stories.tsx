import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { ReceiveOrderDetailPage, ReceiveOrderDetailPageProps } from './ReceiveOrderDetailPage';
import { ReceiveOrder } from '@/types';

export default {
  title: 'app/ReceiveOrder/pages/ReceiveOrderDetailPage',
  component: ReceiveOrderDetailPage,
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

const Template: Story<ReceiveOrderDetailPageProps> = args => {
  const mock = new MockAdapter(axios);

  useEffect(() => {
    mock.onGet('/api/extimate/edit/1').reply(200, {
      success: true,
      data: {
        id: 1,
        receive_order_date: '2019/01/02',
        delivery_date: '2021/03/24',
        customer_id: 11,
        customer_name: '得意先01',
        send_flg: false,
        name: '届け先名01',
        zip_code: '000-0000',
        address1: '住所１',
        address2: '住所２',
        tel: '000-0000-0000',
        fax: '111-1111-1111',
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
      } as ReceiveOrder,
    });
    return () => {
      mock.reset();
    };
  });

  return <ReceiveOrderDetailPage {...args} />;
};

export const showDetailPage = Template.bind({});
showDetailPage.args = {};
