import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Header, Loading, ErrorAlert } from './components';
import Routes from '@/routes/Routes';
import { useApp, useIsInitialized } from '@/app/App/uses/useApp';

const App: React.VFC = () => {
  const { init } = useApp();
  const isInitialized = useIsInitialized();

  init();

  return (
    <BrowserRouter>
      {!isInitialized ? (
        <div className="loading-txt">Loading...</div>
      ) : (
        <div>
          <Header />
          <div className="page">
            <Routes />
          </div>
          <Loading />
          <ErrorAlert />
        </div>
      )}
    </BrowserRouter>
  );
};

export default App;
