import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { SupplierDetailPage, SupplierDetailPageProps } from './SupplierDetailPage';

export default {
  title: 'app/Supplier/pages/SupplierDetailPage',
  component: SupplierDetailPage,
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

const Template: Story<SupplierDetailPageProps> = args => {
  const mock = new MockAdapter(axios);

  useEffect(() => {
    mock.onGet('/api/supplier/edit/1').reply(200, {
      success: true,
      data: {
        name: '仕入先名01',
        zip_code: '1234567',
        address1: '住所1-01',
        address2: '住所2-01',
        tel: '000-000-0000',
        fax: '111-1111-1111',
        email: 'test@test.com',
        foreign_currency_type: '',
        remarks: '備考01',
      },
    });
    return () => {
      mock.reset();
    };
  });

  return <SupplierDetailPage {...args} />;
};

export const showDetailPage = Template.bind({});
showDetailPage.args = {};
