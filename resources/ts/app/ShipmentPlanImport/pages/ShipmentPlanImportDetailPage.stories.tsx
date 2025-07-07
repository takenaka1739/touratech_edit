import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Story, Meta } from '@storybook/react';
import store from '@/store';
import { ShipmentPlanImportDetailPage } from './ShipmentPlanImportDetailPage';

export default {
  title: 'app/ShipmentPlanImport/pages/ShipmentPlanImportDetailPage',
  component: ShipmentPlanImportDetailPage,
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
  return <ShipmentPlanImportDetailPage />;
};

export const showDetailPage = Template.bind({});
showDetailPage.args = {};
