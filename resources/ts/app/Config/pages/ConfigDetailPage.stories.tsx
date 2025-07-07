import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { ConfigDetailPage } from './ConfigDetailPage';
import { Config } from '@/types';

export default {
  title: 'app/Config/pages/ConfigDetailPage',
  component: ConfigDetailPage,
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
  const mock = new MockAdapter(axios);

  useEffect(() => {
    mock.onGet('/api/config').reply(200, {
      success: true,
      data: {
        company_name: '自社名',
        zip_code: '123-4567',
        address1: '住所1',
        address2: '住所2',
        tel: '000-000-0000',
        fax: '111-1111-1111',
        email: 'test@test.com',
        company_class: 1,
        company_level: 'A',
        bank_name1: '銀行名①',
        branch_name1: '支店名①',
        account_name1: '口座名①',
        account_type1: '口座種別①',
        account_number1: '口座番号①',
        bank_name2: '銀行名②',
        branch_name2: '支店名②',
        account_name2: '口座名②',
        account_type2: '口座種別②',
        account_number2: '口座番号②',
        sales_tax_rate: 10,
        pre_tax_rate: 8,
        tax_rate_change_date: '2019/05/01',
        currencies: [
          { id: 1, name: 'ドル', rate: 120.143 },
          { id: 2, name: 'ポンド', rate: 140.5 },
        ],
      } as Config,
    });
    return () => {
      mock.reset();
    };
  });

  return <ConfigDetailPage />;
};

export const showConfigPage = Template.bind({});
showConfigPage.args = {};
