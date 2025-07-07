import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '@/store';
import { Header } from './Header';

export default {
  title: 'components/Header',
  decorators: [
    (story: () => React.ReactNode) => (
      <Provider store={store}>
        <BrowserRouter>{story()}</BrowserRouter>
      </Provider>
    ),
  ],
};

export const showHeader = () => <Header />;
