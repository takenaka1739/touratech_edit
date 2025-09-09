import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
//import { Item, ItemClassification, Supplier, SpecialSale } from '@/types';
import { Item, ItemClassification, Supplier, SpecialSale } from '@/types';
//import { Item, ItemClassification, Supplier } from '@/types';
//import { Item, Category, Supplier } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
//import { CategorySearchDialog } from '@/app/Category/components/CategorySearchDialog';
import { ItemClassificationSearchDialog } from '@/app/ItemClassification/components/ItemClassificationSearchDialog';
import { SupplierSearchDialog } from '@/app/Supplier/components/SupplierSearchDialog';
//import { ItemSearchDialog } from '@/app/Item/components/ItemSearchDialog';
import { ItemRefSearchDialog } from '@/app/Item/components/ItemRefSearchDialog';
import { SpecialSalesDialog } from '@/app/Item/components/SpecialSalesDialog';
import { useSpecialSalesPage } from '@/app/Item/uses/useSpecialSalesPage';
import { createUrl } from '@/app/Item/utils/createUrl';
import { TEMPLATE_ITEM_URLS } from '@/constants/TEMPLATE_ITEM_URLS';
import { AppActions } from '@/app/App/modules/appModule';
//import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
//import { forEach } from 'lodash';
//import { ShopImagePage } from './ShopImagePage';
import { useHistory  } from 'react-router-dom';

export type ItemDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 商品マスタ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const ItemDetailPage: React.VFC<ItemDetailPageProps> = () => {
  const title = '商品マスタ';
  const slug = 'item';

  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    updateState,
    updateErrors,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<Item & {selected: number[] | undefined;}>(slug, {
    id: undefined,
    supplier_id: undefined,
    consumption_tax_id: undefined,
    code: '',
    name: '',
    itemNumberItem: [],
    variations1: '',
    variations2: '',
    variations3: '',
    variations4: '',
    variations5: '',
    //explanation: '',
    explanation_details: '',
    name_note: '',
    name_label: '',
    is_sell: false,
    purchase_price: undefined,
    //sales_price: undefined,
    salesPriceItem: [],
    sales_unit_price: undefined,
    purchase_unit_price: undefined,
    sample_price: undefined,
    is_discontinued: false,
    discontinued_at: '',
    is_display: false,
    is_point_rebates: false,
    number_reservations: undefined,
    is_shipping_fee: false,
    is_cash_delivery_fee: false,
    additional_shipping_fee: undefined,
    is_special_sale: false,
    is_payment_id1: false,
    is_payment_id2: false,
    is_payment_id3: false,
    is_payment_id4: false,
    is_payment_id5: false,
    display_status: 0,
    testArra: [[]],
    image_name: undefined,

    category_id: undefined,
    category_name: '',
    supplier_name: '',
    domestic_stock: undefined,
    overseas_stock: undefined,
    is_set_item: false,
    imageItem:[[]],

    is_sales_members_only: false,
    start_at: '',
    end_at: '',
    special_sale_price: 0,
    refund_rate:  0,
    codeList: [],
    specialSalesList: [],
    
    //$variItems: undefined,

    //item_number: '',
    //name: '',
    //name_jp: '',
    //name_label: '',
    //category_id: undefined,
    //category_name: '',
    //item_classification_name: '',
    //sales_unit_price: undefined,
    //purchase_unit_price: undefined,
    //sample_price: undefined,
    //supplier_id: undefined,
    //supplier_name: '',
    //is_discontinued: false,
    //discontinued_date: undefined,
    //is_display: true,
    //is_set_item: false,
    //domestic_stock: undefined,
    //overseas_stock: undefined,
    //stock_display: 1,
    //remarks: '',

    selected: undefined,
  });

  const {
    open: openItemClassDialog,
    searchDialogProps: itemClassSearchDialogProps,
  } = useCommonSearchDialogProps<ItemClassification>('item_classification', async props => {
  //} = useCommonSearchDialogProps<Category>('category', async props => {
    const { id, name } = props;
    updateState({
      category_id: id,
      //item_classification_name: name,
      category_name: name,
    });
    return true;
  });

  const {
    open: openSupplierDialog,
    searchDialogProps: supplierSearchDialogProps,
  } = useCommonSearchDialogProps<Supplier>('m_suppliers', async props => {
    const { id, name } = props;
    updateState({
      supplier_id: id,
      supplier_name: name,
    });
    updateErrors({
      supplier_id: '',
    });
    return true;
  });

  const {
    open: openItemListDialog,
    searchDialogProps: itemListSearchDialogProps,
  } = useCommonSearchDialogProps<Item>('m_items', async props => {
    const { id, name } = props;
    {updateState({
      id: id,
      name: name,
    });
    updateErrors({
      id: '',
    });

    return true;
  }});

const {
  open: openSpecialSalesDialog,
  searchDialogProps: specialSalesProps,
} = useSpecialSalesPage<SpecialSale>({
  id: state.id,
  item_id: undefined,
  is_sales_members_only: true,
  start_at: state.start_at,
  end_at: state.end_at,
  special_sale_price: state.special_sale_price,
  refund_rate: state.refund_rate,
})

  const onSelected = (no: number) => {
    let selected: number[] = [];
    if (state.selected?.includes(no)) {
      selected = state.selected.filter(i => i != no);
    } else {
      selected = state.selected ?? [];
      selected.push(no);
    }
    updateState({ selected });
  };

  const dispatch = useDispatch();

  const changeState = (value: any) => {
    console.log(`value['id']：${value['id']}`);
    setItemName(value['name']);
    setVariItems(value['testArra']);
    setsalesPriceItems(value['salesPriceItem']);
    setexplanation(value['explanation']);
    setExplanDetail(value['explanation_details']);
    setPurchasePricee(value['purchase_price']);
    setnumberReservations(value['number_reservations']);
  }

  const onClickPrint = async () => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/output`, { ...state, isPrintPrice: true });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        // updateErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.target = '_blank';
        link.click();

        return true;
      } else {
        // updateErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }
    return false;
  };

  const onClickPrintNoPrice = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, { ...state, isPrintPrice: false });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        // updateErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.target = '_blank';
        link.click();

        return true;
      } else {
        // updateErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }
    return false;
  };

  //const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.item_number);
  const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.itemNumberItem[0]);
  //const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.item_number);
  const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.itemNumberItem[0]);

  //let variItem:string[] = [];
  //const [variKindItem, setVariKind] = useState(variItem);

  const [itemName, setItemName] = useState(state.name);
  const [variItems, setVariItems] = useState(state.testArra);
  const [salesPriceItems, setsalesPriceItems] = useState(state.salesPriceItem);
  const [explanation, setexplanation] = useState(state.explanation);
  const [explanation_details, setExplanDetail] = useState(state.explanation_details);
  //const [sales_price, setSalesPrice] = useState(state.sales_price);
  const [purchase_price, setPurchasePricee] = useState(state.purchase_price);
  const [number_reservations, setnumberReservations] = useState(state.number_reservations);

  //const [is_shipping_fee, setShippingFee] = useState(state.is_shipping_fee);
  //const [is_cash_delivery_fee, setCashDeliveryFee] = useState(state.is_cash_delivery_fee);
  //const [is_special_sale, setSpecialSale] = useState(state.is_special_sale);
  //const [is_point_rebates, setPointRebates] = useState(state.is_point_rebates);
  //const [is_payment_id1, setPaymentId1] = useState(state.is_payment_id1);
  //const [is_payment_id2, setPaymentId2] = useState(state.is_payment_id2);
  //const [is_payment_id3, setPaymentId3] = useState(state.is_payment_id3);
  //const [is_payment_id4, setPaymentId4] = useState(state.is_payment_id4);
  //const [is_payment_id5, setPaymentId5] = useState(state.is_payment_id5);

  // 初期値設定
  useEffect(() => {
    console.log(`useEffect実行 ： ${state.explanation}`);
    setItemName(state.name);
    setVariItems(state.testArra);
    setsalesPriceItems(state.salesPriceItem);
    setexplanation(state.explanation);
    setExplanDetail(state.explanation_details);
    //setSalesPrice(state.sales_price);
    //setPurchasePricee(state.purchase_price);
    //setnumberReservations(state.number_reservations);
    //setShippingFee(state.is_shipping_fee);
    //setCashDeliveryFee(state.is_cash_delivery_fee);
    //setSpecialSale(state.is_special_sale);
    //setPointRebates(state.is_point_rebates);
    //setPaymentId1(state.is_payment_id1);
    //setPaymentId2(state.is_payment_id2);
    //setPaymentId3(state.is_payment_id3);
    //setPaymentId4(state.is_payment_id4);
    //setPaymentId5(state.is_payment_id5);
  }, [state.name, state.explanation, state.testArra, state.explanation_details, state.variations1, state.variations2, state.variations3, state.variations4,
      state.itemNumberItem, state.salesPriceItem, state.purchase_price, state.number_reservations,
      state.is_shipping_fee, state.is_cash_delivery_fee, state.is_special_sale, state.is_point_rebates, 
      state.is_payment_id1, state.is_payment_id2, state.is_payment_id3, state.is_payment_id4, state.is_payment_id5]);

  //const {
  //  open: openSpecialSalesDialog,
  //  searchDialogProps: specialSalesProps,
  //} = useSpecialSalesPage<SpecialSale>({
  //  id: state.id,
  //  item_id: undefined,
  //  is_sales_members_only: true,
  //  start_at: state.start_at,
  //  end_at: state.end_at,
  //  special_sale_price: state.special_sale_price,
  //  refund_rate: state.refund_rate,
  //})

  //const {
  //  open: openSpecialSalesDialog,
  //  searchDialogProps: specialSalesProps,
  //} = useSpecialSalesPage<SpecialSale>({
  //  id: state.id,
  //  item_id: undefined,
  //  is_sales_members_only: true,
  //  start_at: state.start_at,
  //  end_at: state.end_at,
  //  special_sale_price: state.special_sale_price,
  //  refund_rate: state.refund_rate,
  //})

  // バリエーションの行追加
  // select:選択された行、index:選択された列
  const addNewVari = (selectRow:number, selctIndex:number) => {
    console.log(`selectRow：${selectRow}`);
    let array:string[][] = [[]];
    let arr:any = [null, null, null, null, null, null];
    // 値のコピー
    variItems.forEach(value => {
      array.push(value);
    });

    // 選択されたバリエーション以下に空白設定
    for (let i = 0; i < arr.length; i++) {
      if(selctIndex <= i){
        arr[i] = '';
      }
    }

    let addRow = selectRow + 2;

    for(let i = selectRow; i < array.length; i++){
      if(array[i][selctIndex] == null){
        addRow = i + 1;
      }
    }

    array.splice(addRow, 0, arr);
    setVariItems(array);
  }

  const onChangeValue = (event:any, select:number, selectIndex:number) => {
    let array:string[][] = [[]];
    let arr:string[] = [];

    variItems[select].forEach(value => {
      arr.push(value);
    });

    arr[selectIndex] = event.target.value;

    variItems.forEach(value => {
      array.push(value);
    });

    array.splice(select + 1, 1, arr);
    setVariItems(array);
  }

  const [checkBock, setCheckBock] = useState({color:'#EDF2F7', flag:false});
  const [backColor, setbackColor] = useState('#ffffff');

  // チェックボックスのチェックが変更された場合、Stateの更新
  const handleCheck = (e:any) => {
    // 操作したチェックボックスの値
    //const choice = e.target.value;

    // チェックされている場合
    if (e.target.checked) {
        // 値の追加
        setCheckBock({color:'#ffffff', flag:true});
        setbackColor('#EDF2F7');
    } else {
      //チェックがはずされた場合
      //値の削除
      setCheckBock({color:'#EDF2F7', flag:false});
      setbackColor('#ffffff');
    }
  };

  const navigation = useHistory();
  // 遷移用ボタンアクション
  const useMovePage = () => {
    //const { file_id } = res.data.data;
    console.log(`variItems：${variItems}`);
    navigation.push({ pathname: '/item/shop-image',
                      state: { itemName:itemName,
                               exDetail:explanation_details,
                               variItems:variItems,
                               imageItems: state.image_name,}});
                               //page: `item/detail/${file_id}`}});
  }

  const a = () => {
    state.codeList.map(value => {
      //console.log(`specialSalesList.is_sales_members_only：${value.specialSalesList.is_sales_members_only}`);
      //console.log(`specialSalesList.start_at：${value.specialSalesList.start_at}`);
      if(value.id == String(state.id)){
        //console.log(`value.name：${value.name}`);
        //console.log(`value.category_id：${value.category_id}`);

        value.id = state.id;
        value.supplier_id = state.supplier_id;
        value.consumption_tax_id = state.consumption_tax_id;
        value.code = state.code;
        value.name = itemName;
        //value.item_number = state.item_number;
        value.variations1 = state.variations1;
        value.variations1 = state.variations1;
        value.variations3 = state.variations3;
        value.variations4 = state.variations4;
        value.explanation = state.explanation;
        value.explanation_details = state.explanation_details;
        value.name_note = state.name_note;
        value.name_label = state.name_label;
        value.is_sell = state.is_sell;
        value.purchase_price = state.purchase_price;
        //value.sales_price = state.sales_price;
        value.sales_unit_price = state.sales_unit_price;
        value.purchase_unit_price = state.purchase_unit_price;
        value.sample_price = state.sample_price;
        value.is_discontinued = state.is_discontinued;
        value.discontinued_at = state.discontinued_at;
        value.is_display = state.is_display;
        //value.overseas_stocks = state.overseas_stocks;
        value.display_status = state.display_status;
        value.remarks = state.remarks;
        value.is_point_rebates = state.is_point_rebates;
        value.number_reservations = state.number_reservations;
        value.is_shipping_fee = state.is_shipping_fee;
        value.is_cash_delivery_fee = state.is_cash_delivery_fee;
        value.additional_shipping_fee = state.additional_shipping_fee;
        value.is_special_sale = state.is_special_sale;
        value.is_payment_id1 = state.is_payment_id1;
        value.is_payment_id2 = state.is_payment_id2;
        value.is_payment_id3 = state.is_payment_id3;
        value.is_payment_id4 = state.is_payment_id4;
        value.is_payment_id5 = state.is_payment_id5;

        value.category_id = state.category_id;
        value.supplier_id = state.supplier_id;

        console.log(`value.name：${value.name}`);
        console.log(`value.category_id：${value.category_id}`);
      }
    });
    onClickSave();
  }

  console.log('return前');

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <Forms.FromGroupInputItemNumber
          labelText="品番"
          name="item_number"
          //value={state.item_number}
          value={state.itemNumberItem}
          //error={errors?.item_number}
          error={errors?.variation_code1}
          onChange={onChange}
          groupClassName="mt-0"
          className="max-w-lg"
          required
          autoFocus
        />
        <Forms.FormGroupInputText
          labelText="商品名"
          name="name"
          value={itemName}
          error={errors?.name}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={400}
        />
        <Forms.FormGroupInputText
          labelText="商品名（納品書）"
          name="name_jp"
          //value={state.name_jp ?? ''}
          value={state.name_note ?? ''}
          //error={errors?.name_jp}
          error={errors?.name_note}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={400}
        />
        <Forms.FormGroupInputText
          labelText="商品名（ラベル用）"
          name="name_label"
          value={state.name_label ?? ''}
          error={errors?.name_label}
          onChange={onChange}
          className="max-w-lg"
          maxLength={36}
        />
        <div>
          <Forms.FormGroup labelText="商品分類" error={errors?.category_id}>
            <div className="flex">
              <Forms.FormInputText
                name="item_classification_name"
                //value={state.item_classification_name ?? ''}
                value={state.category_name ?? ''}
                error={errors?.category_id}
                className="max-w-lg"
                readOnly
              />
              <input
                type="hidden"
                name="category_id"
                value={state.category_id ?? ''}
              />
              <button className="btn ml-2 py-0 px-2" onClick={openItemClassDialog}>
                ...
              </button>
            </div>
          </Forms.FormGroup>
          <ItemClassificationSearchDialog {...itemClassSearchDialogProps} />
        </div>
        <div className="flex flex-wrap max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="売上単価"
              name="sales_unit_price"
              value={state.sales_unit_price}
              error={errors?.sales_unit_price}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              min={0}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="仕入単価"
              name="purchase_unit_price"
              value={state.purchase_unit_price}
              error={errors?.purchase_unit_price}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              min={0}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="サンプル品単価"
              name="sample_price"
              value={state.sample_price}
              error={errors?.sample_price}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              min={0}
            />
          </div>
        </div>
        <div>
          <Forms.FormGroup labelText="仕入先" required error={errors?.supplier_id}>
            <div className="flex">
              <Forms.FormInputText
                name="supplier_name"
                value={state.supplier_name}
                error={errors?.supplier_id}
                className="max-w-lg"
                readOnly
              />
              <input type="hidden" name="supplier_id" value={state.supplier_id ?? ''} />
              <button className="btn ml-2 py-0 px-2" onClick={openSupplierDialog}>
                ...
              </button>
            </div>
          </Forms.FormGroup>
          <SupplierSearchDialog {...supplierSearchDialogProps} />
        </div>
        <div className="flex">
          <div>
            <Forms.FormGroup
              labelText="確認"
              error={errors?.is_discontinued}
              groupClassName="items-center mt-4"
            >
              <Forms.FormInputCheck
                id="is_discontinued"
                name="is_discontinued"
                checked={state.is_discontinued}
                onChange={onChange}
              />
            </Forms.FormGroup>
          </div>
          <div>
            <Forms.FormGroupInputDate
              labelText="廃盤日"
              name="discontinued_date"
              //value={state.discontinued_date}
              value={state.discontinued_at}
              //error={errors?.discontinued_date}
              error={errors?.discontinued_at}
              onChange={onChange}
              readOnly={!state.is_discontinued}
            />
          </div>
          <div>
            <Forms.FormGroup
              labelText="廃盤"
              error={errors?.is_display}
              groupClassName="items-center mt-4"
              removeOptionalLabel
            >
              <Forms.FormInputCheck
                id="is_display"
                name="is_display"
                checked={!state.is_display}
                onChange={(name, value) => {
                  onChange(name, !value);
                }}
              />
            </Forms.FormGroup>
          </div>
        </div>
        <div className="flex max-w-xl">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="国内在庫数"
              name="domestic_stock"
              value={state.domestic_stock ?? '0'}
              className="max-w-8 text-right"
              readOnly
              removeOptionalLabel
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="国外在庫数"
              name="overseas_stock"
              value={state.overseas_stock ?? '0'}
              className="max-w-8 text-right"
              readOnly
              removeOptionalLabel
            />
          </div>
        </div>
        <Forms.FormGroupInputRadio
          labelText="在庫表示"
          name="bank_class"
          value={state.display_status}
          error={errors?.display_status}
          onChange={onChange}
          items={[
            {
              labelText: '非表示',
              id: 'stock_display_1',
              value: 1,
            },
            {
              labelText: '表示',
              id: 'stock_display_2',
              value: 2,
            },
            {
              labelText: '表示（業者のみ）',
              id: 'stock_display_3',
              value: 3,
            },
          ]}
          required={true}
        />
        <Forms.FormGroupTextarea
          labelText="備考"
          name="remarks"
          value={state.remarks ?? ''}
          error={errors?.remarks}
          className="max-w-lg"
          onChange={onChange}
          maxLength={200}
        />
        <div>
          <hr className="border-dashed border-gray-400 mt-4 mb-4" />
          <div className="button-erea">
            <button onClick={useMovePage} className="shop-image">ショップイメージ</button>
            {/*<a className="shop-image" href={"/item/shop-image"}>ショップイメージ</a>*/}
            {/*<Route path="/Senni" element={<Senni id={1} text={'ID1'} />} />*/}
            {console.log('ボタン前')}
            <button className="ref-items" onClick={openItemListDialog}>
              他商品情報参照
            </button>
            <ItemRefSearchDialog selectId={state.id} {...itemListSearchDialogProps} onChangeState={changeState}/>
            <button className="ref-items" onClick={openSpecialSalesDialog}>
            {/*<button className="ref-items" onClick={clickSpecialSalesDialog}>*/}
              特売設定
            </button>
            <SpecialSalesDialog {...specialSalesProps}
              id={state.id}
              item_id={undefined}
              is_sales_members_only={true}
              start_at={state.start_at}
              end_at={state.end_at}
              special_sale_price={state.special_sale_price}
              refund_rate={state.refund_rate}/>
            {/*<SpecialSalesDialog isShown={true}/>*/}

          </div>
          <div className="is-public">
            <label>ショップへの公開</label>
            <label className="label-required">必須</label>
            <input type="checkbox"/>
          </div>
          <div>
            <div>
              <label>バリエーション追加</label>
              <label className="label-required">必須</label>
              <input type="checkbox" onChange={handleCheck}/>
            </div>
            <div style={{marginLeft: '10px'}}>
              <label style={{marginLeft: "145px"}}>バリエーション1</label>
              <label style={{marginLeft: "56px"}}>バリエーション2</label>
              <label style={{marginLeft: "65px"}}>バリエーション3</label>
              <label style={{marginLeft: "65px"}}>バリエーション4</label>
              <label style={{marginLeft: "60px"}}>品番</label>
              <label style={{marginLeft: "130px"}}>金額</label>
            </div>
            <div style={{display: 'flex', marginLeft: "150px"}}>
              <div>{variItems.map((item, itemIndex) => {
                return (
                  <div key={itemIndex} style={{display: 'flex'}}>{
                    item.map((value, index) => {
                      return (
                        <div key={index} style={{display: 'flex', marginBottom: '5px', visibility: value == null ? 'hidden':'visible'}}>
                          <input className="vari-row-input" /*type={value == null ? 'hidden' : 'text'}*/
                                 style={{borderRight: '1px solid #a0aec0', backgroundColor: checkBock.color}}
                                 disabled={!checkBock.flag} value={value} onChange={(event) => onChangeValue(event, itemIndex, index)}/>
                          <button disabled={!checkBock.flag} style={{backgroundColor: checkBock.color}}
                                  className="plus-button" onClick={() => addNewVari(itemIndex, index)}>＋</button>
                        </div>
                      )
                    })
                  }</div>
                )
              })}</div> 
            </div> 
          </div>
          <div>
            <div className="item-explanation">
              <label >商品説明</label>
              <label className="label-optional">任意</label>
              <textarea style={{flexDirection: 'row'}} className="item-detail"
                        value={explanation} onChange={(event) => setexplanation(event.target.value)}/>
            </div>
            <div className="item-explanation-detail">
              <label>商品説明（詳細）</label>
              <label className="label-optional">任意</label>
              <textarea style={{flexDirection: 'row'}} className="item-detail"
                        value={explanation_details} onChange={(event) => setExplanDetail(event.target.value)}/>
            </div>
            <div className="price-erea">
              <label>販売価格</label>
              <label className="label-required">必須</label>
              <input className="input-text"
                     value={salesPriceItems.length < 1 ? !checkBock.flag ? '0' : salesPriceItems[0] : salesPriceItems[0]}
                     disabled={checkBock.flag} style={{backgroundColor: backColor}}/>
            </div>
            <div className="price-erea">
              <label>仕入価格</label>
              <label className="label-required">必須</label>
              <input className="input-text" value={purchase_price ?? '0'} onChange={(event) => setPurchasePricee(Number(event.target.value))}/>
            </div>
            <div className="pre-order">
              <label>予約受付数</label>
              <label className="label-optional">任意</label>
              <input className="input-text" value={number_reservations ?? '0'} onChange={(event) => setnumberReservations(Number(event.target.value))}/>
            </div>
            <div style={{display: 'flex'}}>
              <div className="shipping-fee">
                <label>送料適用</label>
                <label className="label-optional">任意</label>
                <input type="checkbox"/>
              </div>
              <div className="shipping-fee">
                <label>送料</label>
                <label className="label-optional">任意</label>
                <input className="input-text"/>
              </div>
            </div>
            <div className="handling-fee">
              <label>代引手数料適用</label>
              <label className="label-optional">任意</label>
              <input type="checkbox"/>
            </div>
            <div className="special-sale">
              <label>特売期間のみ販売</label>
              <label className="label-optional">任意</label>
              <input type="checkbox"/>
            </div>
            <div className="point-reductive">
              <label>ポイント還元</label>
              <label className="label-optional">任意</label>
              <input type="checkbox"/>
            </div>
            <div className="payment-how">
              <div>
                <label>支払い方法適用</label>
                <label className="label-required">必須</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"/>
                <label>現金</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"/>
                <label>掛売</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"/>
                <label>宅配代引</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"/>
                <label>銀行振込</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"/>
                <label>クレジットカード</label>
              </div>
            </div>
          </div>
        </div>
        {id && (
          <>
            <hr className="border-dashed border-gray-400 mt-4" />
            <Forms.FormGroup labelText="国内リンク" removeOptionalLabel>
              <span
                className="text-xs text-blue-600 underline cursor-pointer"
                onClick={() => {
                  window.open(domestic_url, '_blank', 'left=100,top=100,noopener=yes');
                }}
              >
                {domestic_url}
              </span>
            </Forms.FormGroup>
            <Forms.FormGroup labelText="国外リンク" removeOptionalLabel>
              <span
                className="text-xs text-blue-600 underline cursor-pointer"
                onClick={() => {
                  window.open(overseas_url, '_blank', 'left=100,top=100,noopener=yes');
                }}
              >
                {overseas_url}
              </span>
            </Forms.FormGroup>
            <hr className="border-dashed border-gray-400 mt-4" />
            <div className="flex mt-4">
              <div className="w-40 pr-2 text-xs text-right">ラベル位置</div>
              <div className="w-full">
                <div className="flex ml-8">
                  <Forms.FormLabelSelector selected={state.selected} onSelected={onSelected} />
                  <div className="w-32">
                    <div className="form-group">
                      <button className="btn ml-8" onClick={onClickPrint}>
                        ラベル発行
                      </button>
                    </div>
                  </div>
                  <div className="w-64">
                    <div className="form-group">
                      <button className="btn ml-8" onClick={onClickPrintNoPrice}>
                        ラベル発行(金額なし)
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  {errors?.selected && <div className="form-error">{errors?.selected}</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-between">
        <div>
          {/*<button className="btn" onClick={onClickSave} disabled={isDisabled}>*/}
          <button className="btn" onClick={() => a()} disabled={isDisabled}>
            保存
          </button>
        </div>
        {id && (
          <button className="btn-delete" onClick={onClickDelete} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
