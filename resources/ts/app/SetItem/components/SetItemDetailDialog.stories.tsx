import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import store from '@/store';
import { SetItemDetailDialog, SetItemDetailDialogProps } from './SetItemDetailDialog';

export default {
  title: 'app/SetItem/components/SetItemDetailDialog',
  component: SetItemDetailDialog,
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

const Template: Story<SetItemDetailDialogProps> = args => {
  return <SetItemDetailDialog {...args} />;
};

export const showSearchDialog = Template.bind({});
showSearchDialog.args = {
  isShown: true,
  state: {
    set_item_id: undefined,
    id: 1,
    item_id: 1,
    item_number: '00-0000-000-0',
    item_name: '商品名',
    item_name_jp: '商品名（納品書）',
    quantity: 451,
    set_price: 2000,
    sales_unit_price: 3000,
  },
};
