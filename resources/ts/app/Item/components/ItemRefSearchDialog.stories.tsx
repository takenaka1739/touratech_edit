import React, { useEffect, ComponentProps } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { Item } from '@/types';
import { ItemRefSearchDialog } from './ItemRefSearchDialog';

type ItemSearchDialogProps = ComponentProps<typeof ItemRefSearchDialog>;

export default {
  title: 'app/Item/components/ItemSearchDialog',
  component: ItemRefSearchDialog,
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
        combination_id: undefined,
        name_note: `商品名JP${i + 1}`,
        sales_unit_price: 123456789.12,
        purchase_unit_price: 4200,
        sales_price: 0,
        item_id: undefined,
        item_number: '',
        itemNumberItem: [],
        salesPriceItem: [],
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
        specialSalesList: [],
        imageList: [[]],
        combIdList: [],
        specialSalesDelFlag: false,
        v,
      };
    });
  }

  useEffect(() => {
    mock.onPost('/api/item/refdialog').reply(200, {
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

  return <ItemRefSearchDialog {...args} />;
};

export const showSearchDialog = Template.bind({});
showSearchDialog.args = {
  isShown: true,
};
