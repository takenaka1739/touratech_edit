import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Switch, Route } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { ItemDetailPage, ItemDetailPageProps } from './ItemDetailPage';
import { Item } from '@/types';

export default {
  title: 'app/Item/pages/ItemDetailPage',
  component: ItemDetailPage,
  decorators: [(story: () => React.ReactNode) => <Provider store={store}>{story()}</Provider>],
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

const Template: Story<ItemDetailPageProps> = args => {
  const mock = new MockAdapter(axios);

  useEffect(() => {
    mock.onGet('/api/item/edit/1').reply(200, {
      success: true,
      data: {
        id: 1,
        item_number: ['A0001'],
        code: '',
        name: '商品名01',
        name_jp: '商品名JP01',
        name_label: '商品label名01',
        category_id: 2,
        sales_unit_price: 1001,
        //sales_price: [],
        itemNumberItem: [],
        salesPriceItem: [],
        purchase_unit_price: 2001,
        sample_price: 3001,
        supplier_id: 3,
        is_discontinued: false,
        discontinued_at: '',
        is_display: true,
        stock_display: 1,
        is_set_item: false,
        variations1: [],
        variations2: [],
        variations3: [],
        variations4: [],
        variations5: [],
        display_status: 0,
        testArra: [],
      } as Item,
    });
    return () => {
      mock.reset();
    };
  });

  const id = args?.match?.params?.id;

  return id !== undefined ? (
    <MemoryRouter initialEntries={[`/item/detail/${args?.match?.params?.id}`]}>
      <Switch>
        <Route path={'/item/detail/:id'}>
          <ItemDetailPage {...args} />
        </Route>
      </Switch>
    </MemoryRouter>
  ) : (
    <MemoryRouter>
      <ItemDetailPage {...args} />
    </MemoryRouter>
  );
};

export const showDetailPage = Template.bind({});
showDetailPage.args = {};
