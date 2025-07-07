import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useIsOther } from '@/app/App/uses/useApp';
import { TopPage } from '@/app/App/pages/TopPage';
import { NotFound } from '@/app/App/pages/NotFound';
import { SimpleSearchDetailPage } from '@/app/SimpleSearch/pages/SimpleSearchDetailPage';

const RouteConfig = React.lazy(() => import('./RouteConfig'));
const RouteCustomer = React.lazy(() => import('./RouteCustomer'));
const RouteEstimate = React.lazy(() => import('./RouteEstimate'));
const RouteHiden = React.lazy(() => import('./RouteHiden'));
const RouteHomeDataImport = React.lazy(() => import('./RouteHomeDataImport'));
const RouteInventoryImport = React.lazy(() => import('./RouteInventoryImport'));
const RouteInventoryPrinting = React.lazy(() => import('./RouteInventoryPrinting'));
const RouteInvoice = React.lazy(() => import('./RouteInvoice'));
const RouteItemClassification = React.lazy(() => import('./RouteItemClassification'));
const RouteItem = React.lazy(() => import('./RouteItem'));
const RoutePlaceOrderExport = React.lazy(() => import('./RoutePlaceOrderExport'));
const RoutePlaceOrder = React.lazy(() => import('./RoutePlaceOrder'));
const RoutePurchase = React.lazy(() => import('./RoutePurchase'));
const RouteReceipt = React.lazy(() => import('./RouteReceipt'));
const RouteReceiveOrderStatus = React.lazy(() => import('./RouteReceiveOrderStatus'));
const RouteReceiveOrder = React.lazy(() => import('./RouteReceiveOrder'));
const RouteSales = React.lazy(() => import('./RouteSales'));
const RouteSetItem = React.lazy(() => import('./RouteSetItem'));
const RouteShipmentPlanImport = React.lazy(() => import('./RouteShipmentPlanImport'));
const RouteShipmentPlan = React.lazy(() => import('./RouteShipmentPlan'));
const RouteSupplier = React.lazy(() => import('./RouteSupplier'));
const RouteUser = React.lazy(() => import('./RouteUser'));

const Routes: React.VFC = () => {
  const isOther = useIsOther();

  return isOther ? (
    <Switch>
      <Route exact path="/" component={SimpleSearchDetailPage} />
      <Route component={NotFound} />
    </Switch>
  ) : (
    <React.Suspense fallback={<div />}>
      <Switch>
        <Route exact path="/" component={TopPage} />
        <Route path="/config" component={RouteConfig} />
        <Route path="/customer" component={RouteCustomer} />
        <Route path="/estimate" component={RouteEstimate} />
        <Route path="/hiden" component={RouteHiden} />
        <Route path="/home_data_import" component={RouteHomeDataImport} />
        <Route path="/inventory_import" component={RouteInventoryImport} />
        <Route path="/inventory_printing" component={RouteInventoryPrinting} />
        <Route path="/invoice" component={RouteInvoice} />
        <Route path="/item_classification" component={RouteItemClassification} />
        <Route path="/item" component={RouteItem} />
        <Route path="/place_order_export" component={RoutePlaceOrderExport} />
        <Route path="/place_order" component={RoutePlaceOrder} />
        <Route path="/purchase" component={RoutePurchase} />
        <Route path="/receipt" component={RouteReceipt} />
        <Route path="/receive_order_status" component={RouteReceiveOrderStatus} />
        <Route path="/receive_order" component={RouteReceiveOrder} />
        <Route path="/sales" component={RouteSales} />
        <Route path="/set_item" component={RouteSetItem} />
        <Route path="/shipment_plan_import" component={RouteShipmentPlanImport} />
        <Route path="/shipment_plan" component={RouteShipmentPlan} />
        <Route path="/supplier" component={RouteSupplier} />
        <Route path="/user" component={RouteUser} />
        <Route component={NotFound} />
      </Switch>
    </React.Suspense>
  );
};

export default Routes;
