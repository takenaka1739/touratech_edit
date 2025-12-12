import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { Item } from '@/types';
import { ItemListPage } from './ItemListPage';

export default {
  title: 'app/Item/pages/ItemListPage',
  component: ItemListPage,
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

  let rows: Item[] = [];
  if (!args.props) {
    rows = [
      {
        id: 1,
        name: 'テスト01',
        //name_jp: 'テスト01',
        name_note: 'テスト01',
        item_number: '00-0000-0000-0',
        code: '00-0000-0000-0',
        sales_unit_price: 32000.5,
        purchase_unit_price: 30000,
        //discontinued_date: undefined,
        discontinued_at: undefined,
        is_display: true,
        is_set_item: false,
        variations1: '',
        variations2: '',
        variations3: '',
        variations4: '',
        display_status: 0,
        variItems: [],
        backVariItems: [],
        //image_name: undefined,
        imageList: [[]],
        item_id: undefined,
        is_sales_members_only: false,
        start_at: '',
        end_at: '',
        special_sale_price: 0,
        refund_rate: 0,
        codeList: [],
        categoryList: [],
        specialSalesList: [],
        preImageList: [[]],
        combination_id: undefined,
        combIdList: [],
        sales_price: 0,
        specialSalesDelFlag: false,
        categoryListAll: []
      },
    ];
  }

  useEffect(() => {
    mock.onPost('/api/item/fetch').reply(200, {
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
  return <ItemListPage {...args} />;
};

export const showPage = Template.bind({});
showPage.args = {};
