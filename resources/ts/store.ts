import { combineReducers, createStore, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import * as AppModule from '@/app/App/modules/appModule';
import { UserListPageState, UserListPageReducer } from '@/app/User/modules/userListPageModule';
import {
  SupplierListPageState,
  SupplierListPageReducer,
} from '@/app/Supplier/modules/supplierListPageModule';
import {
  CustomerListPageState,
  CustomerListPageReducer,
} from '@/app/Customer/modules/customerListPageModule';
import {
  ItemClassificationListPageState,
  ItemClassificationListPageReducer,
} from '@/app/ItemClassification/modules/itemClassificationListPageModule';
import { ItemListPageState, ItemListPageReducer } from '@/app/Item/modules/itemListPageModule';
import {
  SetItemListPageState,
  SetItemListPageReducer,
} from '@/app/SetItem/modules/setItemListPageModule';
import {
  EstimateListPageState,
  EstimateListPageReducer,
} from '@/app/Estimate/modules/estimateListPageModule';
import {
  ReceiveOrderListPageState,
  ReceiveOrderListPageReducer,
} from '@/app/ReceiveOrder/modules/receiveOrderListPageModule';
import {
  ReceiveOrderStatusListPageState,
  ReceiveOrderStatusListPageReducer,
} from '@/app/ReceiveOrderStatus/modules/receiveOrderStatusListPageModule';
import { SalesListPageState, SalesListPageReducer } from '@/app/Sales/modules/salesListPageModule';
import {
  PlaceOrderListPageState,
  PlaceOrderListPageReducer,
} from '@/app/PlaceOrder/modules/placeOrderListPageModule';
import {
  ShipmentPlanListPageState,
  ShipmentPlanListPageReducer,
} from '@/app/ShipmentPlan/modules/shipmentPlanListPageModule';
import {
  PurchaseListPageState,
  PurchaseListPageReducer,
} from '@/app/Purchase/modules/purchaseListPageModule';
import {
  InvoiceListPageState,
  InvoiceListPageReducer,
} from '@/app/Invoice/modules/invoiceListPageModule';
import {
  ReceiptListPageState,
  ReceiptListPageReducer,
} from '@/app/Receipt/modules/receiptListPageModule';

const storeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export type RootState = {
  app: AppModule.AppState;
  userListPage: UserListPageState;
  supplierListPage: SupplierListPageState;
  customerListPage: CustomerListPageState;
  itemClassificationListPage: ItemClassificationListPageState;
  itemListPage: ItemListPageState;
  setItemListPage: SetItemListPageState;
  estimateListPage: EstimateListPageState;
  receiveOrderListPage: ReceiveOrderListPageState;
  receiveOrderStatusListPage: ReceiveOrderStatusListPageState;
  salesListPage: SalesListPageState;
  placeOrderListPage: PlaceOrderListPageState;
  shipmentPlanListPage: ShipmentPlanListPageState;
  purchaseListPage: PurchaseListPageState;
  invoiceListPage: InvoiceListPageState;
  receiptListPage: ReceiptListPageState;
};

const store = createStore(
  combineReducers<RootState>({
    app: AppModule.AppReducer,
    userListPage: UserListPageReducer,
    supplierListPage: SupplierListPageReducer,
    customerListPage: CustomerListPageReducer,
    itemClassificationListPage: ItemClassificationListPageReducer,
    itemListPage: ItemListPageReducer,
    setItemListPage: SetItemListPageReducer,
    estimateListPage: EstimateListPageReducer,
    receiveOrderListPage: ReceiveOrderListPageReducer,
    receiveOrderStatusListPage: ReceiveOrderStatusListPageReducer,
    salesListPage: SalesListPageReducer,
    placeOrderListPage: PlaceOrderListPageReducer,
    shipmentPlanListPage: ShipmentPlanListPageReducer,
    purchaseListPage: PurchaseListPageReducer,
    invoiceListPage: InvoiceListPageReducer,
    receiptListPage: ReceiptListPageReducer,
  }),
  storeEnhancers(applyMiddleware(thunk))
);

export default store;
