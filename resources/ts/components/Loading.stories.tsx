import React from 'react';
import { Story, Meta } from '@storybook/react';
import { Loading } from './Loading';
import { Provider } from 'react-redux';
import store from '@/store';
import { AppActions } from '@/app/App/modules/appModule';

store.dispatch(AppActions.request());

export default {
  title: 'components/Loading',
  component: Loading,
  decorators: [(story: () => React.ReactNode) => <Provider store={store}>{story()}</Provider>],
} as Meta;

const Template: Story = () => <Loading />;

export const showLoading = Template.bind({});
