import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { AdminRoute } from '@/components';
import { CustomerListPage } from '@/app/Customer/pages/CustomerListPage';
import { CustomerDetailPage } from '@/app/Customer/pages/CustomerDetailPage';
import { NotFound } from '@/app/App/pages/NotFound';

const RouteCustomer: React.VFC = () => (
  <Switch>
    <AdminRoute exact path="/customer" component={CustomerListPage} />
    <AdminRoute exact path="/customer/detail/:id(\d*)?" component={CustomerDetailPage} />
    <Route component={NotFound} />
  </Switch>
);

export default RouteCustomer;
