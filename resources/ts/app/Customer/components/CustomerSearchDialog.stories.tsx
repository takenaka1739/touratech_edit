import React, { useEffect, ComponentProps } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { CustomerSearchDialog } from './CustomerSearchDialog';

type CustomerSearchDialogProps = ComponentProps<typeof CustomerSearchDialog>;

export default {
  title: 'app/Customer/components/CustomerSearchDialog',
  component: CustomerSearchDialog,
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

const Template: Story<CustomerSearchDialogProps> = args => {
  const mock = new MockAdapter(axios);

  const rows = Array.from(new Array(20)).map((v, i) => {
    return {
      id: i + 1,
      name: `得意先${i + 1}`,
      zip_code: '000-0000',
      address1: '愛知県岡崎市',
      address2: '十王町',
      tel: '0564-99-0001',
      fax: '0564-99-0002',
      v,
    };
  });

  useEffect(() => {
    mock.onPost('/api/customer/dialog').reply(200, {
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

  return <CustomerSearchDialog {...args} />;
};

export const showSearchDialog = Template.bind({});
showSearchDialog.args = {
  isShown: true,
};
