import React, { useEffect, ComponentProps } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import store from '@/store';
import { ItemClassificationSearchDialog } from './ItemClassificationSearchDialog';

type ItemClassificationSearchDialogProps = ComponentProps<typeof ItemClassificationSearchDialog>;

export default {
  title: 'app/ItemClassification/components/ItemClassificationSearchDialog',
  component: ItemClassificationSearchDialog,
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

const Template: Story<ItemClassificationSearchDialogProps> = args => {
  const mock = new MockAdapter(axios);

  const rows = Array.from(new Array(20)).map((v, i) => {
    return {
      id: i + 1,
      name: `分類名${i + 1}`,
      v,
    };
  });

  useEffect(() => {
    mock.onPost('/api/item_classification/fetch').reply(200, {
      success: true,
      data: {
        rows,
        pager: {
          currentPage: 1,
          lastPage: 1,
          perPage: 20,
          from: 1,
          to: 3,
          total: 2,
        },
      },
    });
    return () => {
      mock.reset();
    };
  });

  return <ItemClassificationSearchDialog {...args} />;
};

export const showSearchDialog = Template.bind({});
showSearchDialog.args = {
  isShown: true,
};
