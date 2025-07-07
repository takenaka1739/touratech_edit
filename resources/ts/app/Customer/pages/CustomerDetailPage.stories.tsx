import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { CustomerDetailPage, CustomerDetailPageProps } from './CustomerDetailPage';

export default {
  title: 'app/Customer/pages/CustomerDetailPage',
  component: CustomerDetailPage,
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

const Template: Story<CustomerDetailPageProps> = args => {
  const mock = new MockAdapter(axios);

  useEffect(() => {
    mock.onGet('/api/customer/edit/1').reply(200, {
      success: true,
      data: {
        name: '担当者1',
        zip_code: '1234567',
      },
    });
    return () => {
      mock.reset();
    };
  });

  return <CustomerDetailPage {...args} />;
};

export const showDetailPage = Template.bind({});
showDetailPage.args = {};
