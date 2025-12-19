import React, { useEffect, ComponentProps } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { Item } from '@/types';
import { ItemSearchDialog } from './ItemSearchDialog';

type ItemSearchDialogProps = ComponentProps<typeof ItemSearchDialog>;

export default {
  title: 'app/Item/components/ItemSearchDialog',
  component: ItemSearchDialog,
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

const Template: Story<ItemSearchDialogProps & { props: number }> = args => {
  const mock = new MockAdapter(axios);

  let rows: Item[] = [];
  if (!args.props) {
    rows = Array.from(new Array(20)).map((v, i) => {
      return {
        id: i + 1,
        code: `01-000-0000-${i + 1}`,
        name: `商品名${i + 1}`,
        name_note: `商品名JP${i + 1}`,
        sales_unit_price: 123456789.12,
        sales_price: 0,
        item_number: '',
        item_id: undefined,
        itemNumberItem: [],
        salesPriceItem: [],
        combination_id: undefined,
        purchase_unit_price: 4200,
        discontinued_at: undefined,
        is_display: true,
        is_set_item: false,
        variations1: '',
        variations2: '',
        variations3: '',
        variations4: '',
        variations5: '',
        display_status: 0,
        variItems: [],
        backVariItems: [],
        imageItem: [],
        image_name: undefined,
        is_sales_members_only: false,
        start_at: '',
        end_at: '',
        special_sale_price: 0,
        refund_rate: 0,
        codeList: [],
        categoryList: [],
        specialSalesList: [],
        imageList: [[]],
        combIdList: [],
        specialSalesDelFlag: false,
        categoryListAll: [],
        preImageList: [],
        v,
      };
    });
  }

  useEffect(() => {
    mock.onPost('/api/item/dialog').reply(200, {
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

  return <ItemSearchDialog {...args} />;
};

export const showSearchDialog = Template.bind({});
showSearchDialog.args = {
  isShown: true,
};
