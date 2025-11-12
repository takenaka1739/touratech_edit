import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
//import { Item, ItemClassification, Supplier, SpecialSale } from '@/types';
//import { Item, ItemClassification, Supplier, SpecialSale } from '@/types';
import { Item, ItemClassification, Supplier } from '@/types';
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
import { useHistory, useLocation  } from 'react-router-dom';
import { appAlert } from '@/components';
//import { PageErrors } from '@/types';
//import { ConfirmModal } from '@/components/appConfirm';
//import { ConfirmModal } from '@/components/appConfirm';

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
    setState,
    updateState,
    updateErrors,
    onChange,
    setErrors,
    //onChangeItem,
    //onClickSave,
    onClickDelete,
  } = useCommonDetailPage<Item & {selected: number[] | undefined;}>(slug, {
    id: undefined,
    supplier_id: undefined,
    //consumption_tax_id: undefined,
    code: '',
    name: '',
    item_number: undefined,
    itemNumberItem: [],
    variations1: '',
    variations2: '',
    variations3: '',
    variations4: '',
    variations5: '',
    explanation: '',
    explanation_details: '',
    name_note: '',
    name_label: '',
    is_sell: false,
    purchase_price: undefined,
    sales_price: 0,
    salesPriceItem: [],
    special_sale_id: undefined,
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
    variItems: [[]],
    backVariItems: [[]],
    image_name: undefined,
    shipping_pay: undefined,

    category_id: undefined,
    category_name: '',
    supplier_name: '',
    domestic_stocks: undefined,
    overseas_stocks: undefined,
    is_set_item: false,
    imageItem:[[]],

    item_id: undefined,
    is_sales_members_only: false,
    start_at: '',
    end_at: '',
    special_sale_price: 0,
    refund_rate:  0,
    codeList: [],
    specialSalesList: [],
    specialSalesDelFlag: false,
    selected: undefined,
    imageList: [[]],
    combination_id: undefined,
    combIdList: [],
    send_trader: undefined,
    send_personal: undefined
  });

  type imageItem = { id: number | null;
                     category_id: number | null;
                     item_id: number | undefined;
                     name: string;
                     order_by: number;
                     url: any;
                   };

  //const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.item_number);
  const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.itemNumberItem[0]);
  //const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.item_number);
  const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.itemNumberItem[0]);

  const [variItems, setVariItems] = useState([['', '', '', '', '', '', '']]);
  //const [salesPriceItems, setsalesPriceItems] = useState(state.salesPriceItem);
  //const [purchase_price, setPurchasePricee] = useState(state.purchase_price);
  //const [number_reservations, setnumberReservations] = useState(state.number_reservations);
  const [checkBock, setCheckBock] = useState({color:'#EDF2F7', flag:false});
  const [backColor, setbackColor] = useState('#ffffff');
  //const [backVariItems, setBackVariItems] = useState(state.backVariItems);
  const [variChangeItem, setVariChangeItem] = useState<string[][]>([]);
  const dispatch = useDispatch();
  const [onFocusItem, setonFocusItem] = useState<string[]>();
  const [specialItem, setSpecialItem] = useState(state.specialSalesList);
  const [imageItems, setImageItems] = useState(state.image_name);
  const location = useLocation<any>();
  const [categoryChangeFlag, setCategoryChangeFlag]= useState(false);
  const [supplierChangeFlag, setSupplierChangeFlag]= useState(false);
  //const [errors, setErrors] = useState<PageErrors>(undefined);
  const [variClickFlag, setvariClickFlag] = useState(false);
  const [variDelItem, setVariDelItem] = useState<string[][]>([]);

  // 初期値設定
  useEffect(() => {
    const isValid = Array.isArray(state.variItems) &&
                    state.variItems.length > 0 &&
                    state.variItems[0].length > 0;
    setVariItems(isValid ? state.variItems : [['new1', '', '', '', '', '', '']]);
    //setBackVariItems(state.backVariItems);
    //setsalesPriceItems(state.salesPriceItem);
    setSpecialItem(state.specialSalesList);
    //setImageItems(state.image_name);
    if ((!imageItems || !Array.isArray(imageItems)) && (Array.isArray(state.image_name))) {
      setImageItems(state.image_name);
    }

    if (!state.variItems || state.variItems.length === 0 || state.variItems.every(row => row.length === 0)) {  
      setState(prev => ({
        ...prev,
        variItems: [['new1', '', '', '', '', '', '']],
      }));
    }
    //setState(state);
  }, [state, state.variItems, state.itemNumberItem, state.salesPriceItem, state.purchase_price, state.number_reservations, 
      state.specialSalesList, state.image_name]);

  useEffect(() => {
    if(state.shipping_pay === null || state.shipping_pay === undefined){
      if(state.display_status === 2){
        setState({...state, shipping_pay:state.send_trader})
      }else{
        setState({...state, shipping_pay:state.send_personal})
      }
    }
  }, []);

  // 初期値設定
  //useEffect(() => {
  //  state.variItems = variItems;
  //}, [state]);

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
    setCategoryChangeFlag(true);
    return true;
  });

  const {
    open: openSupplierDialog,
    searchDialogProps: supplierSearchDialogProps,
  } = useCommonSearchDialogProps<Supplier>('supplier', async props => {
    const { id, name } = props;
    updateState({
      supplier_id: id,
      supplier_name: name,
    });
    updateErrors({
      supplier_id: '',
    });
    setSupplierChangeFlag(true); 
    return true;
  });

  const {
    open: openItemListDialog,
    searchDialogProps: itemListSearchDialogProps,
  } = useCommonSearchDialogProps<Item>('m_items', async props => {
    const { id, name } = props;
    console.dir(props);
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
    searchDialogProps: specialSalesProps
  } = useSpecialSalesPage<any>(state);

  const onSelected = (no: number) => {
    let selected: number[] = [];
    if (state.selected?.includes(no)) {
      selected = state.selected.filter(i => i != no);
    } else {
      selected = state.selected ?? [];
      selected.push(no);
    }
    updateState({selected});
  };

  const changeState = (value: any) => {
    console.log(value);
    setState(prev => ({
      ...prev,
      item_number: value['item_number'],
      name: value['name'],
      name_note: value['name_note'],
      name_label: value['name_label'],
      category_name: value['category_name'],
      category_id: value['category_id'],
      sales_unit_price: value['sales_unit_price'],
      purchase_unit_price: value['purchase_unit_price'],
      sample_price: value['sample_price'],
      supplier_name: value['supplier_name'],
      supplier_id: value['supplier_id'],
      is_discontinued: value['is_discontinued'],
      discontinued_at: value['discontinued_at'],
      is_display: value['is_display'],
      domestic_stocks: value['domestic_stocks'],
      overseas_stocks: value['overseas_stocks'],
      display_status: value['display_status'],
      remarks: value['remarks'],
      is_sell: value['is_sell'],
      code: value['code'],
      variItems: value['variItems'],
      explanation: value['explanation'],
      explanation_details: value['explanation_details'],
      sales_price: value['sales_price'],
      purchase_price: value['purchase_price'],
      number_reservations: value['number_reservations'],
      is_shipping_fee: value['is_shipping_fee'],
      shipping_pay: value['shipping_pay'],
      additional_shipping_fee: value['additional_shipping_fee'],
      is_cash_delivery_fee: value['is_cash_delivery_fee'],
      is_point_rebates: value['is_point_rebates'],
      is_payment_id1: value['is_payment_id1'],
      is_payment_id2: value['is_payment_id2'],
      is_payment_id3: value['is_payment_id3'],
      is_payment_id4: value['is_payment_id4'],
      is_payment_id5: value['is_payment_id5'],

      backVariItems: value['backVariItems'],
      codeList: value['codeList'],
      combIdList: value['combIdList'],
      combination_id: value['combination_id'],
      imageList: value['imageList'],
      image_name: value['image_name'],
      is_sales_members_only: value['is_sales_members_only'],
      is_special_sale: value['is_special_sale'],
      itemNumberItem: value['itemNumberItem'],
      refund_rate: value['refund_rate'],
      salesPriceItem: value['salesPriceItem'],
      send_personal: value['send_personal'],
      send_trader: value['send_trader'],
      specialSalesList: value['specialSalesList'],
      special_sale_id: value['special_sale_id'],
      special_sale_item_id: value['special_sale_item_id'],
      special_sale_price: value['special_sale_price'],
      start_at: value['start_at'],
      end_at: value['end_at'],
      variations1: value['variations1'],
      variations2: value['variations2'],
      variations3: value['variations3'],
      variations4: value['variations4'],
    }));

    setVariChangeItem([]);
    setSpecialItem(value['specialSalesList']);
    setImageItems(value['image_name']);
    setCategoryChangeFlag(false);
    setSupplierChangeFlag(false);
    setvariClickFlag(false);
    setVariDelItem([]);
    //setVariItems(value['variItems']);
    //setsalesPriceItems(value['salesPriceItem']);
    //setPurchasePricee(value['purchase_price']);
    //setnumberReservations(value['number_reservations']);
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

  // バリエーションの行追加
  // select:選択された行、index:選択された列
  const addNewVari = (selectRow: number, selctIndex: number) => {
    setvariClickFlag(true);
    let arr: any = [null, null, null, null, null, null, null]

    // 選択されたバリエーション以下に空白設定
    for (let i = 0; i < arr.length; i++) {
      if (selctIndex <= i) {
        arr[i] = ''
      }
    }

    const newCount = state.variItems.filter(
      (value) => typeof value[0] === 'string' && value[0].includes('new')
    ).length + 1;

    arr[0] = 'new' + newCount;
    let insertIndex = selectRow + 1;

    while (
      insertIndex < state.variItems.length &&
      state.variItems[insertIndex][selctIndex] === null
    ) {
      insertIndex++;
    };

    // 挿入処理
    //setState((variItems) => [
    //  ...variItems.slice(0, insertIndex),
    //  arr,
    //  ...variItems.slice(insertIndex),
    //])

    // 挿入処理
    setState(prev => ({
      ...prev,
      variItems: [
        ...prev.variItems.slice(0, insertIndex),
        arr,
        ...prev.variItems.slice(insertIndex),
      ],
    }));

    setState(prev => ({
      ...prev,
      backVariItems: [
        ...prev.backVariItems.slice(0, insertIndex),
        arr,
        ...prev.backVariItems.slice(insertIndex),
      ],
    }));
  }

  const delButton = (selectIndex:number) => {
    setvariClickFlag(true);
    if(selectIndex === -1){
      onClickDelete();
    }else{
      setState((prevState) => ({
        ...prevState,
        variItems: prevState.variItems.filter((_, index) => index !== selectIndex),
      }));

      const target = String(state.variItems[selectIndex]);
      if (typeof target === "string" && !target.includes("new")) {
        setVariDelItem([...variDelItem, state.variItems[selectIndex]]);
      }
    }

    if(Array.isArray(variChangeItem)){
      const updatedItems = variChangeItem.filter(item => item[0] !== variItems[selectIndex][0]);
      setVariChangeItem(updatedItems);
    }
  }

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

  // 子コンポーネントから受け取った値を格納するstate
  //const [value, setValue] = useState<SpecialSale>();

  // 子コンポーネントから受け取った値を親コンポーネントのstateに格納
  const handleValueChange = (newValue: any) => {
    state.specialSalesDelFlag = newValue.specialSalesDelFlag
    state.is_sales_members_only = newValue.is_sales_members_only;
    state.start_at = newValue.start_at;
    state.end_at = newValue.end_at;
    state.special_sale_price = newValue.special_sale_price;
    state.refund_rate = newValue.refund_rate;
  };

  const salesPriceChange = (salesPrice: any) => {
    setState(prev => ({
      ...prev,
      sales_price: salesPrice}));

  setState(prev => ({
    ...prev,
    variItems: prev.variItems.map(row =>
      Number(row[0]) === Number(prev.id)
        ? [
            row[0], // idはそのまま
            row[1], // 必要なら変更
            row[2], // 必要なら変更
            row[3], // 例えば sales_price を row[3] に入れるならここ
            row[4], // 他の値はそのまま
            row[5],
            salesPrice,
          ]
        : row
      ),
    }));
  }

  const onChangeValue = (event: React.ChangeEvent<HTMLInputElement>, select:number, selectIndex:number) => {
    setvariClickFlag(true);
    event.persist();
    //setVariItems(variItems => 
    //  variItems.map((row, rIdx) =>
    //    rIdx === select
    //    ? row.map((val, cIdx) => (cIdx === selectIndex ? event.target.value : val))
    //    : row
    //  )
    //);

    setState(prev => ({
      ...prev,
      variItems: prev.variItems.map((row, rowIndex) =>
        rowIndex === select
          ? row.map((cell, colIndex) =>
              colIndex === selectIndex ? String(event.target.value) : cell
            )
          : row
      ),
    }));

    setState(prev => ({
      ...prev,
      backVariItems: prev.backVariItems.map((row, rowIndex) =>
        rowIndex === select
          ? row.map((cell, colIndex) =>
              colIndex === selectIndex ? String(event.target.value) : cell
            )
          : row
      ),
    }));


    setState(prev => ({
      ...prev,
      variItems: prev.variItems.map((row, rowIndex) =>
        rowIndex === select
          ? row.map((cell, colIndex) => {
              if (colIndex === selectIndex) {
                if (selectIndex === 7 && Number(row[0]) === Number(state.id)) {
                  return String(state.sales_price);
                }
                return String(event.target.value);
              }
              return cell;
            })
          : row
      ),
    }));
  }

  const handleFocus = (item: string[]) => {
    setvariClickFlag(true);
    setonFocusItem(item);
  };

  //const outForcus = (item: string[], selectIndex:number) => {
  const outForcus = (item: string[]) => {
    setvariClickFlag(true);
    // 変更されたバリデーションが何もない時
    if(!(onFocusItem?.every((value, index) => value === item[index]))){
      let targetChangeItem:any = [];
      // バリデーションが1行以上ある時
      if(variItems.length > 1){
        //setChangeItem((changeItem) => [...changeItem, item]);
        // 変更したバリデーションの中に現在変更中のバリデーションが存在しているか
        const target =  variChangeItem.filter(row => row[0] === item[0]);
        // 編集している行の一つ上のインデックスの取得
        const targetIndex = (variItems.findIndex(row => row[0] === item[0])) - 1;
        const indexItem = variChangeItem[targetIndex];
        if(target.length > 0){
          target[0].forEach((value, index) => {
            if(value === null){
              targetChangeItem.push(indexItem[index]);
            }else{
              let pushValue = item[index] !== null ? item[index] : value;
              targetChangeItem.push(pushValue);
            }
          });
          const deleIndex = variChangeItem.findIndex(row => row[0] === item[0]);
          variChangeItem.splice(deleIndex, 1); // その行を削除
          state.backVariItems.splice(deleIndex, 1);
          setVariChangeItem((changeItem) => [...changeItem, targetChangeItem]);
        }else{
          const target2 = variItems.filter(row => row[0] === item[0]);
          const targetIndex = (variItems.findIndex(row => row[0] === item[0])) - 1;
          const indexItem = variItems[targetIndex];
          if (target2.length > 0) {
            target2[0].forEach((value, index) => {
              if (value === null) {
                let fallbackValue = indexItem[index];
                // indexItem[index] が null の場合、variChangeItem を上に辿って補完
                if (fallbackValue === null) {
                  //let searchRowIndex = variItems.length - 1;
                  let searchRowIndex = targetIndex;
                  while (searchRowIndex >= 0) {
                    const previousRow = variItems[searchRowIndex];
                    const candidate = previousRow?.[index];
                    if ((candidate !== null) && (candidate !== undefined)) {
                      fallbackValue = candidate;
                      break;
                    }
                    searchRowIndex--;
                  }
                }
                targetChangeItem.push(fallbackValue);
              } else {
                let pushValue = item[index] !== null ? item[index] : value;
                targetChangeItem.push(pushValue);
              }
            });
            setVariChangeItem((changeItem) => [...changeItem, targetChangeItem]);
          }
        }
      // バリデーションが1行以下の時
      }else{
        setVariChangeItem((changeItem) => [...changeItem, item]);
      }
    }else{
      // 値に変更なし
    }
  }

  const navigation = useHistory();
  // 遷移用ボタンアクション
  const filledItems = variItems.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      if (cell !== null) return cell;

      // 過去の行を遡って null 以外の値を探す
      for (let i = rowIndex - 1; i >= 0; i--) {
        const prev = variItems[i][colIndex];
        if (prev !== null) {
          return prev;
        }
      }

      // 最後まで見つからなければそのまま null
      return null;
    });
  });

  const useMovePage = () => {
    navigation.push({ pathname: '/item/shop-image',
                      state: { item_id:state.id,
                               //itemName:state.name,
                               preVariItem:variItems,
                               exDetail:state.explanation_details,
                               variItems:filledItems,
                               variChangeItem: variChangeItem,
                               backVariItems:state.backVariItems,
                               imageItems: imageItems,
                               categoryChangeFlag: categoryChangeFlag,
                               supplierChangeFlag: supplierChangeFlag,
                               items: state}});
  }

  //const [changeImageItem, setChangeImageItem] = useState<imageItem[]>();
  //const [formItem, setFormItem] = useState<File[]>();

// ショップイメージから戻ってきた時の値取得
  useEffect(() => {
    if (location.state !== undefined){
      setvariClickFlag(false);
      if(Array.isArray(location.state.imageItem)) {
        const matrix: imageItem[] = [];
        const formItem: any[] = [];
        const form = new FormData();
        setCategoryChangeFlag(location.state.categoryChangeFlag);
        setSupplierChangeFlag(location.state.supplierChangeFlag);
        //updateState(location.state.preState);
        location.state.imageItem.forEach((item: any) => {
          const matchedRows = Array.isArray(location.state.preImageItem)
            ? location.state.preImageItem.filter((row: any) => row[0] === item[0])
            : [];

          if (matchedRows.length > 0 && item.length > matchedRows[0].length) {
            item.forEach((value: any, index: number) => {
              if (index > 0) {
                if (value instanceof File) {
                  const imageItem: imageItem = {
                    id: null,
                    category_id: null,
                    item_id: item[0],
                    name: value.name,
                    order_by: index + 1,
                    url: value,
                  };
                  form.append('file', value);
                  formItem.push(value);
                  matrix.push(imageItem);
                }
              }
            });
          }else{
            setImageItems(location.state.imageItem);
          }
        });
        setImageItems(location.state.imageItem);
        //setImageItems((prev: imageItem[]) => [...prev, ...matrix]);
      }

      if(variClickFlag !== true){
        console.log('編集したい');
        console.log(variClickFlag);
        //if(location.state.transFlag){
        setVariChangeItem(location.state.variChangeItem);
        setState(prev => {
          //const updatedVariItems = prev.variItems.map((row, index) => {
          //  const newRow = [...row];
          //  newRow[6] = location.state.variItems?.[index]?.[6] ?? row[6];
          //  return newRow;
          //});

          console.log(location.state.exDetail);

          return {
            ...prev,
            category_name: location.state.preState.category_name,
            category_id: location.state.preState.category_id,
            name: location.state.itemName,
            explanation_details: location.state.exDetail,
            variItems: location.state.preVariItem,
            supplier_name: location.state.preState.supplier_name,
            supplier_id: location.state.preState.supplier_id,

          };
        });
      }
      //}
      //setState(prev => ({...prev, explanation_details: location.state.exDetail}));
//
      //setState(prev => ({
      //  ...prev,
      //  variItems: prev.variItems.map((row, index) => {
      //    const newRow = [...row];
      //    newRow[6] = location.state.variItems?.[index]?.[6] ?? row[6];
      //    return newRow;
      //  }),
      //}));
    }

  //}, [location, state.explanation_details, state.name]);
  //}, [location, state.explanation_details, state.name, state.variItems]);
  }, [location, state.explanation_details, state.name, state.variItems]);

  useEffect(() => {
    if (location.state !== undefined && Array.isArray(location.state.imageItem)) {
      updateState(location.state.preState);
    }
  }, []);

  const edit: (url: string) => Promise<boolean> = async url => {
    dispatch(AppActions.request());
    //const res = await axios.put(`/api/${slug}/edit/${id}`, state);
    const res = await axios.put(`/api/${url}`, state);
    console.dir(res);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  //const categoryEdit = async (url: string, item:any): Promise<boolean> => {
  const categoryEdit = async (url: string): Promise<boolean> => {
    dispatch(AppActions.request());
    const res = await axios.put(`/api/${url}`, state);
    //const res = await axios.put(`/api/${url}`, item);
    if (res.status === 200) {
    //if (false) {
      dispatch(AppActions.success());
      if (res.data.success) {
      //if (false) {
        //await appAlert('編集保存しました。');
        return true;
      } else {
        //setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
      return false;
    }
    return res.data.success;
  };

  const history = useHistory();
  const backPage = () => history.push(`/item`);

  const store: (url: string) => Promise<any> = async url => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${url}`, state);
    console.log(res);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        //setErrors(undefined);
        //await appAlert('新規保存しました。');
        //backPage();
        return res;
      } else {
        //setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return undefined;
  }

  const destroy: (url: string) => Promise<boolean> = async url => {
    dispatch(AppActions.request());
    const res = await axios.delete(url);
    console.log(res);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        return true;
      } else {
        if (res.data.errMsg) {
          await appAlert(res.data.errMsg, 'error');
        }
        //setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの削除に失敗しました。'));
    }
    return false;
  };

  //const imageSave = async (url: string, curd: string, variIndex:string | number | null): Promise<boolean> => {
  const imageSave = async (variIndex:string | number | null): Promise<boolean> => {
    let res: any = {};
    let serverRes: any = {};
    let type:any = null;
    let fileName:string = '';
    // 画像編集があった場合
      if((location.state !== undefined)){
        if(location.state.imageItem !== undefined){
          const filtered = location.state.imageItem.length > 1
                           ? location.state.imageItem.filter((row: any[]) => row[0] === variIndex)
                           : location.state.imageItem;
          // 画像保存の商品が複数ある場合
          if(((Array.isArray(filtered)) && (filtered.length > 0) && (filtered[0][2] !== undefined))){
            const rows = filtered[0];
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
              // データ型の取得
              type = typeof rows[rowIndex];
              //データ型がナンバー以外で、stringの時は/images/を切り取ったファイル名、objectの場合はnameでファイル名を取得
              if(type !== 'number') fileName = type === 'string' ? rows[rowIndex].replace('/images/', '')
                                             : type === 'object' ? rows[rowIndex].name : '';
              const image: imageItem = { id: null, category_id: null, item_id: state.item_id, name: fileName, order_by: rowIndex, url: ''};
              // データ型がobjectの場合は新規ファイルの為、store処理
              if(type === 'object'){
                const hasYoutube = rows[rowIndex].name.includes("youtube.com");
                res = await axios.post(`/api/item/image_store`, image);
                if(((res.data.success) && (hasYoutube === false))){
                  const formData = new FormData();
                  const kaku = fileName.split('.').pop();
                  if(kaku === 'mp4' || kaku === 'mov'){
                    formData.append('video', rows[rowIndex]);
                    formData.append('filename', rows[rowIndex].name); // 任意のファイル名
                    serverRes = await axios.post('/api/item/video_server_store', formData, {headers: {'Content-Type': 'multipart/form-data',}});
                  }else{
                    formData.append('image', rows[rowIndex]);
                    formData.append('filename', rows[rowIndex].name); // 任意のファイル名
                    serverRes = await axios.post('/api/item/image_server_store', formData, {headers: {'Content-Type': 'multipart/form-data'}});
                  }
                }
              // データ型がstringの場合は既存ファイルの為、updata処理
              }else if(type === 'string'){
                // 既存ファイルかの確認（IDとファイル名）
                const matchedItems = state.imageList.filter(item => (item[1] === rows[0]) && (item[2] === fileName)).sort((a, b) => b[3] - a[3]);
                if(matchedItems.length > 0){
                  for (let index = 0; index < matchedItems.length; index++){
                    if(matchedItems[index][3] !== rowIndex){
                      const image: imageItem = { id: matchedItems[index][0], category_id: null, item_id: state.item_id, name: fileName,
                                                 order_by: rowIndex, url: ''};
                      res = await axios.put(`/api/item/image_update/${matchedItems[index][0]}`, image);
                      if(res.data.success === 200){
                        serverRes.status = 201;
                      }
                    }
                  }
                }else{
                  // データベースに情報がなく、youtubeだったら新規登録
                  const image: imageItem = { id: null, category_id: null, item_id: state.item_id, name: fileName, order_by: rowIndex, url: ''};
                  const hasYoutube = rows[rowIndex].includes("youtube.com");
                  if(hasYoutube){
                    res = await axios.post(`/api/item/image_store`, image);
                    if(res.data.success === 200){
                      serverRes.status = 201;
                    }
                  }
                }
              }else{
                serverRes.status = 201;
              }
            }
          }else{
            const hasNew = typeof variIndex === "string" && variIndex?.toLowerCase().includes("new");
            if(hasNew) serverRes.status = 201;
          }
        }

        // 削除されたデータあった場合
        if(location.state.delimageItem.length !== 0){
          for (const delItem of location.state.delimageItem ?? []){
            const matchedItems = state.imageList.filter(item => ((item[1] === delItem[0]) && (item[2] === delItem[1])));

            if (matchedItems.length > 0 && matchedItems[0][0] !== undefined) {
              await destroy(`/api/item/image_delete/${Number(matchedItems[0][0])}`);
            }
          }
        }
      }else{
        // 処理なしなのでtrue
        serverRes.status = 201;
      }
    return serverRes.status === 201 || serverRes.status === 200;
  }

  const specialSaleSave = async (url: string, curd: string): Promise<{success: boolean; id?: number;}> => {
    let specialSaleSaveFlag:boolean = false;
    state.is_sales_members_only = state.is_sales_members_only !== null ? state.is_sales_members_only : false;
    state.special_sale_id = state.specialSalesList[0]?.special_sale_id ?? undefined;

    if(curd === 'store'){
      specialSaleSaveFlag = await store(url);
    }else{
      if((state.specialSalesDelFlag === false) || (state.specialSalesDelFlag === undefined)){
        if((state.special_sale_id !== null) && (state.special_sale_id !== undefined)){
          state.is_sales_members_only = specialItem[0].is_sales_members_only !== state.is_sales_members_only ? 
                                                 state.is_sales_members_only : specialItem[0].is_sales_members_only;
          state.start_at = specialItem[0].start_at !== state.start_at ? 
                                    state.start_at : specialItem[0].start_at;
          state.end_at = specialItem[0].end_at !== state.end_at ?
                                  state.end_at : specialItem[0].end_at;
          state.special_sale_price = specialItem[0].special_sale_price !== state.special_sale_price ?
                                              state.special_sale_price : specialItem[0].special_sale_price;
          state.refund_rate = specialItem[0].refund_rate !== state.refund_rate ?
                                       state.refund_rate : specialItem[0].refund_rate;
          state.item_id = state.id;
          //state.is_sales_members_only = state.is_sales_members_only !== null ? state.is_sales_members_only : false;
          //specialSaleSaveFlag = (await specialSaleSave(`item/special_sale_update/${state.special_sale_id}`, 'edit')).success;
          specialSaleSaveFlag = await edit(`item/special_sale_update/${state.special_sale_id}`); // ✅ ここで await が使える！
        }else{
          specialSaleSaveFlag = await store("item/special_sale_store");
        }
      }else{
        state.special_sale_id = state.specialSalesList[0].special_sale_id;
        if(state.special_sale_id !== null){
          specialSaleSaveFlag = await destroy(`/api/item/special_sale_delete/${Number(state.special_sale_id)}`);
        }
      }
    }

    return {success: specialSaleSaveFlag, id: state.special_sale_id};
  }

  const categorySave = async (url: string, curd: string): Promise<{success: boolean; id?: number;}> => {
    let res: any = {};
    if (curd === 'store') {
      //state.item_id = id;
      res = await store(url);
    }

    return {success: res.data.success, id: res.data.id};
  }

  const itemSave = async (url: string, curd: string): Promise<{success: boolean; id?: number;}> => {
    let res: any = {};
    if (curd === 'store') {
      res = await store(url);
    }
    return {success: res.data.success, id: res.data.id};
  }

  // 保存処理
  const storeSavaItem: (variIndex:string | number | null, crud: string) => Promise<boolean> = async (variIndex, crud) => {
    let reFlag = false;
    //let imageSaveRes = false;
    const itemSaveRes = await itemSave("item/store", 'store');
    console.log(itemSaveRes);
    // 項目の保存
    if(itemSaveRes.success){
      if(crud === 'store') state.item_id = itemSaveRes.id;
      // カテゴリーの保存
      const categorySaveRes = await categorySave("item/category_store", crud);
      console.log(categorySaveRes);
      // 特売設定の保存
      const specilSaleSaveRes = await specialSaleSave("item/special_sale_store", 'store');
      console.log(specilSaleSaveRes);
      // 画像の保存
      console.log(variIndex);
      const imageSaveRes = await imageSave(variIndex);
      console.log(imageSaveRes);

      reFlag = categorySaveRes.success && specilSaleSaveRes.success && imageSaveRes;
    }else{
      reFlag = false;
    }

    //if(reFlag){
    //  await appAlert('新規保存しました。');
    //  backPage();
    //}

    return reFlag;
  }

  const upDateSaveItem: (variIndex:string | number | null, pattern:string) => Promise<boolean> = async (variIndex, pattern) => {
    let reFlag = false;
    let itemSaveFlag = false;
    let imgSaveFlag = false;
    let specialSaleSaveFlag = false;
    let categoryCombSaveFlag = false;

    if(pattern === '2'){
      console.log('pattern === 2');
      itemSaveFlag = await edit(`item/update/${variIndex}`);
      console.log(itemSaveFlag);
      imgSaveFlag = await imageSave(variIndex);
      console.log(imgSaveFlag);
      specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
      console.log(specialSaleSaveFlag);
      reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag;

    }else if(pattern === '3'){
      console.log('pattern === 3');
      console.log(state.id);
      itemSaveFlag = await edit(`item/update/${state.id}`);
      console.log(itemSaveFlag);
      imgSaveFlag = await imageSave(Number(state.id));
      console.log(imgSaveFlag);
      specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
      console.log(specialSaleSaveFlag);

      reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag;
    }else if(pattern === '4'){
      console.log('pattern === 4');
      state.item_id = Number(variIndex);
      itemSaveFlag = await edit(`item/update/${Number(variIndex)}`);
      console.log(itemSaveFlag);
      if(itemSaveFlag){
        if(((state.combination_id !== null) && (state.combination_id !== undefined))){
          categoryCombSaveFlag = await categoryEdit(`item/category_edit/${state.combination_id}`);
          console.log(categoryCombSaveFlag);
        }else{
          categoryCombSaveFlag = (await categorySave("item/category_store", 'store')).success;
          console.log(categoryCombSaveFlag);
        }
      }

      imgSaveFlag = await imageSave(Number(state.id));
      console.log(imgSaveFlag);
      specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
      console.log(specialSaleSaveFlag);

      reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag && categoryCombSaveFlag;
    }else if(pattern === '5'){
      console.log('pattern === 5');
      state.item_id = Number(variIndex);

      itemSaveFlag = await edit(`item/update/${Number(variIndex)}`);
      console.log(`itemSaveFlag：${itemSaveFlag}`);
      if(itemSaveFlag){
        if(((state.combination_id !== null) && (state.combination_id !== undefined))){
          categoryCombSaveFlag = await categoryEdit(`item/category_edit/${state.combination_id}`);
          console.log(`categoryCombSaveFlag：${categoryCombSaveFlag}`);
        }else{
          categoryCombSaveFlag = (await categorySave("item/category_store", 'store')).success;
          console.log(`categoryCombSaveFlag：${categoryCombSaveFlag}`);
        }
      }

      imgSaveFlag = await imageSave(Number(state.id));
      console.log(`imgSaveFlag：${imgSaveFlag}`);
      specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
      console.log(`specialSaleSaveFlag：${specialSaleSaveFlag}`);
      reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag && categoryCombSaveFlag;
    }

    //if(reFlag){
    //  await appAlert('編集保存しました。');
    //  backPage();
    //}

    return reFlag;
  }

  const delFanc: () => Promise<boolean> = async () => {
    let delFlag = false;
    if (Array.isArray(variDelItem) && variDelItem.length > 0) {
      for (let i = variDelItem.length - 1; i >= 0; i--) {
        const id = Number(variDelItem[i][0]);
        delFlag = await destroy(`/api/item/delete/${id}`);
        console.log(delFlag);
        variDelItem.splice(i, 1); // 戻り値に関係なく削除
      }
    }else{
      delFlag = true;
    }

    return delFlag;
  } 

  const saveClick: () => void = async () => {
    if((state.item_number !== null) && (state.item_number !== undefined) && (state.name !== null) && (state.name !== undefined) &&
       (state.name_note !== null) && (state.name_note !== undefined) && (state.category_name !== null) && (state.category_name !== undefined) &&
       (state.supplier_name !== null) && (state.supplier_name !== undefined) && (state.supplier_name !== '') &&
       (state.display_status !== null) && (state.display_status !== undefined) &&
       (state.code !== null) && (state.code !== undefined) && (state.code !== '') &&
       (state.is_payment_id1 !== null) && (state.is_payment_id1 !== undefined) && (state.is_payment_id2 !== null) && (state.is_payment_id2 !== undefined) &&
       (state.is_payment_id3 !== null) && (state.is_payment_id3 !== undefined) && (state.is_payment_id4 !== null) && (state.is_payment_id4 !== undefined) &&
       (state.is_payment_id5 !== null) && (state.is_payment_id5 !== undefined)){
      // 新規登録
      if(state.id === undefined){
        console.log('1163行');
        console.log('新規登録');
        console.dir(state);
        let saveFlag = false;
        let crud = 'store';
        // バリエーションが複数ある場合
        if(variChangeItem.length > 1){
          for (const value of variChangeItem) {
            state.variations1 = value[1];
            state.variations2 = value[2];
            state.variations3 = value[3];
            state.variations4 = value[4];
            state.item_number = value[5];
            state.sales_price = Number(value[6]);
            saveFlag = await storeSavaItem(value[0], crud);
          }
          if(saveFlag){
            await appAlert('新規保存しました。');
            backPage();
          }else{
            dispatch(AppActions.failed('データの保存に失敗しました。'));
          }
        // バリエーションが1つある場合
        }else if(variChangeItem.length > 0){
          const hasAnyValue = variChangeItem.slice(1).some(row =>row.some(cell => typeof cell === 'string' && cell.trim() !== ''));
          // バリエーションが1つある場合
          if(hasAnyValue){
            let saveFlag = false;
            for (const value of variChangeItem) {
              state.variations1 = value[1];
              state.variations2 = value[2];
              state.variations3 = value[3];
              state.variations4 = value[4];
              state.item_number = value[5];
              state.sales_price = Number(value[6]);

              //if(await savaItem(value[0])) backPage();
              //if(await storeSavaItem(value[0], crud)){
                //saveFlag = await appAlert('新規保存しました。');
                //backPage();
              //}
            }
            if(saveFlag){
              await appAlert('新規保存しました。');
              backPage();
            }else{
              dispatch(AppActions.failed('データの保存に失敗しました。'));
            }
          // バリエーションがない場合
          }else{
            //await storeSavaItem(null, crud);
            if(await storeSavaItem(null, crud)){
              await appAlert('新規保存しました。');
              backPage();
            }else{
              dispatch(AppActions.failed('データの保存に失敗しました。'));
            }
          }
        }else{
          if(await storeSavaItem(null, crud)){
            await appAlert('新規保存しました。');
            backPage();
          }else{
            dispatch(AppActions.failed('データの保存に失敗しました。'));
          }
        }
      // 編集登録
      }else{
        let updateSaveFlag = false;
        let storeSaveFlag = false;
        // カテゴリーと仕入先に変更がない場合
        if(((categoryChangeFlag === false) && (supplierChangeFlag === false))){
          // バリデーションの変更が複数ある場合
          if(variChangeItem.length > 0){
            for (const value of variChangeItem) {
              // すでに登録されているかの確認
              if (state.codeList.find(e => e.id == value[0])) {
                state.item_id = Number(value[0]);
                state.id = Number(value[0]);
                state.variations1 = value[1];
                state.variations2 = value[2];
                state.variations3 = value[3];
                state.variations4 = value[4];
                state.item_number = value[5];
                state.sales_price = Number(value[6]);

                //if(variChangeItem.length === 1)
                storeSaveFlag = true;
                console.log('true');
                updateSaveFlag = await upDateSaveItem(Number(value[0]), '2');
              // バリデーションの新規登録
              } else {
                state.id = undefined;          
                state.variations1 = value[1];
                state.variations2 = value[2];
                state.variations3 = value[3];
                state.variations4 = value[4];
                state.item_number = value[5];
                state.sales_price = Number(value[6]);
              
                console.log('false');
                //if(variChangeItem.length === 1)
                updateSaveFlag = true;
                storeSaveFlag = await storeSavaItem(value[0], 'store');
                //variSaveFlag = await store("item/store"); // ✅ ここで await が使える！
              }
            }

            console.log(updateSaveFlag);
            console.log(storeSaveFlag);
            if(updateSaveFlag && storeSaveFlag){
              if(await delFanc()){
                await appAlert('編集保存しました。');
                backPage();
              }
            }else{
              dispatch(AppActions.failed('データの保存に失敗しました。'));
            }
          // バリデーションに変更がない場合
          }else{
            if(state.variItems.length > 0){
              let flag = false;
              for (const value of state.variItems) {
                // すでに登録されているかの確認
                if (state.codeList.find(e => e.id === value[0])) {
                  const matchedRow = state.codeList.find(item => item.id === value[0]);
                  //const combId = state.combIdList.find(item => item?.item_id === value[0]);
                  const combId = Array.isArray(state.combIdList)
                                 ? state.combIdList.find(item => item?.item_id === value[0])
                                 : undefined;
                  if(combId !== undefined){
                    state.combination_id = combId.id;
                  }else{
                    state.combination_id = undefined;
                  }

                  state.id = Number(value[0]);
                  state.item_id = Number(value[0]);

                  state.variations1 = matchedRow.variations1;
                  state.variations2 = matchedRow.variations2;
                  state.variations3 = matchedRow.variations3;
                  state.variations4 = matchedRow.variations4;
                  state.item_number = matchedRow.item_number;
                  state.sales_price = matchedRow.sales_price;
                  state.special_sale_id = matchedRow.special_sale_id;

                  //await upDateSaveItem(Number(value[0]), '5');

                }
                flag = await upDateSaveItem(Number(state.id), '3')
              }

              if(flag){
                if(await delFanc()){
                  await appAlert('編集保存しました。');
                  backPage();
                }
              }else{
                dispatch(AppActions.failed('データの保存に失敗しました。'));
              }
            }else{
              //await upDateSaveItem(Number(state.id), '3');
              if(await upDateSaveItem(Number(state.id), '3')){
                if(await delFanc()){
                  await appAlert('編集保存しました。');
                  backPage();
                }
              }else{
                dispatch(AppActions.failed('データの保存に失敗しました。'));
              }
            }
          }
        // カテゴリーか仕入先に変更があった場合
        }else{
          // バリエーションが複数変更されている場合
          if(variChangeItem.length > 0){
            // 現在編集中の商品ID
            const editId = state.id;
            const category_id = state.category_id;
            if (state.codeList.find(e => e.id === state.id)) {
              const changeItem = variChangeItem.find(item => Number(item[0]) === state.id);
              if (changeItem) {
                state.id = Number(changeItem[0]);
                state.item_id = Number(changeItem[0]);
                state.category_id = category_id;

                state.variations1 = changeItem[1];
                state.variations2 = changeItem[2];
                state.variations3 = changeItem[3];
                state.variations4 = changeItem[4];
                state.item_number = changeItem[5];
                state.sales_price = Number(changeItem[6]);
              }
              updateSaveFlag = await upDateSaveItem(Number(state.id), '4');
            }else{
              // 処理なし
            }

            for (const value of state.variItems){
              if (state.codeList.find(e => e.id === value[0])) {
                if(editId !== Number(value[0])){
                  const changeItem = variChangeItem.find(item => item[0] === value[0]);
                  const matchedRow = state.codeList.find(item => item.id === value[0]);
                  // カテゴリに変更がなければ既存のカテゴリで保存
                  //if(categoryChangeFlag === false){
                    const combId = Array.isArray(state.combIdList)
                                   ? state.combIdList.find(item => item?.item_id === value[0])
                                   : state.combination_id;
                  if (combId) {
                    state.combination_id = combId.id;
                  }

                  if (changeItem) {
                    state.id = Number(changeItem[0]);
                    state.item_id = Number(changeItem[0]);
                  
                    state.variations1 = changeItem[1];
                    state.variations2 = changeItem[2];
                    state.variations3 = changeItem[3];
                    state.variations4 = changeItem[4];
                    state.item_number = changeItem[5];
                    state.sales_price = Number(changeItem[6]);
                  }else{
                    state.variations1 = matchedRow.variations1;
                    state.variations2 = matchedRow.variations2;
                    state.variations3 = matchedRow.variations3;
                    state.variations4 = matchedRow.variations4;
                    state.item_number = matchedRow.item_number;
                    state.sales_price = matchedRow.sales_price;
                  }
                
                  if(supplierChangeFlag === false) state.supplier_id = matchedRow.supplier_id;
                  state.category_id = category_id;
                  //state.code = matchedRow.code;
                  //state.name = matchedRow.name;
                  //state.item_number = matchedRow.item_number;
                  //state.explanation = matchedRow.explanation;
                  //state.explanation_details = matchedRow.explanation_details;
                  //state.name_note = matchedRow.name_note;
                  //state.name_label = matchedRow.name_label;
                  //state.is_sell = matchedRow.is_sell;
                  //state.purchase_price = matchedRow.purchase_price;
                  //state.sales_price = matchedRow.sales_price;
                  //state.sales_unit_price = matchedRow.sales_unit_price;
                  //state.purchase_unit_price = matchedRow.purchase_unit_price;
                  //state.sample_price = matchedRow.sample_price;
                  //state.is_discontinued = matchedRow.is_discontinued;
                  //state.discontinued_at = matchedRow.discontinued_at;
                  //state.is_display = matchedRow.is_display;
                  //state.domestic_stock = matchedRow.domestic_stock;
                  //state.overseas_stock = matchedRow.overseas_stock;
                  //state.display_status = matchedRow.display_status;
                  //state.remarks = matchedRow.remarks;
                  //state.number_reservations = matchedRow.number_reservations;
                  //state.is_shipping_fee = matchedRow.is_shipping_fee;
                  //state.is_cash_delivery_fee = matchedRow.is_cash_delivery_fee;
                  //state.additional_shipping_fee = matchedRow.additional_shipping_fee;
                  //state.is_special_sale = matchedRow.is_special_sale;
                  //state.is_point_rebates = matchedRow.is_point_rebates;
                  //state.shipping_pay = matchedRow.shipping_pay;
                  //state.is_payment_id1 = matchedRow.is_payment_id1;
                  //state.is_payment_id2 = matchedRow.is_payment_id2;
                  //state.is_payment_id3 = matchedRow.is_payment_id3;
                  //state.is_payment_id4 = matchedRow.is_payment_id4;
                  //state.is_payment_id5 = matchedRow.is_payment_id5;
                
                  updateSaveFlag = await upDateSaveItem(Number(value[0]), '4');
                }
              }else{
                const changeItem = variChangeItem.find(item => item[0] === value[0]);

                if (changeItem) {
                  state.category_id = category_id;
                  state.id = undefined;          
                  state.variations1 = changeItem[1];
                  state.variations2 = changeItem[2];
                  state.variations3 = changeItem[3];
                  state.variations4 = changeItem[4];
                  state.item_number = changeItem[5];
                  state.sales_price = Number(changeItem[6]);

                  storeSaveFlag = await storeSavaItem(value[0], 'store');
                }
                //variSaveFlag = await store("item/store"); // ✅ ここで await が使える！
              }
            }
            console.log(updateSaveFlag);
            console.log(storeSaveFlag);
            if(updateSaveFlag && storeSaveFlag){
              if(await delFanc()){
                await appAlert('編集保存しました。');
                backPage();
              }
            }else{
              dispatch(AppActions.failed('データの保存に失敗しました。'));
            }
          // バリデーションに変更がない場合(バリエーションが複数の場合、カテゴリーと仕入先は共通の為、一括変更)
          }else{
            if(state.variItems.length > 0){
              for (const value of state.variItems) {
                // すでに登録されているかの確認
                if (state.codeList.find(e => e.id === value[0])) {
                  const matchedRow = state.codeList.find(item => item.id === value[0]);
                  //const combId = state.combIdList.find(item => item?.item_id === value[0]);
                  const combId = Array.isArray(state.combIdList)
                                 ? state.combIdList.find(item => item?.item_id === value[0])
                                 : undefined;
                  if(combId !== undefined){
                    state.combination_id = combId.id;
                  }else{
                    state.combination_id = undefined;
                  }

                  state.id = Number(value[0]);
                  state.item_id = Number(value[0]);
                  //state.combination_id = combId.id;

                  state.variations1 = matchedRow.variations1;
                  state.variations2 = matchedRow.variations2;
                  state.variations3 = matchedRow.variations3;
                  state.variations4 = matchedRow.variations4;
                  state.item_number = matchedRow.item_number;
                  state.sales_price = matchedRow.sales_price;

                  if(supplierChangeFlag === false) state.supplier_id = matchedRow.supplier_id;
                  //state.supplier_id = matchedRow.supplier_id;
                  //state.code = matchedRow.code;
                  //state.name = matchedRow.name;
                  //state.item_number = matchedRow.item_number;
                  //state.explanation = matchedRow.explanation;
                  //state.explanation_details = matchedRow.explanation_details;
                  //state.name_note = matchedRow.name_note;
                  //state.name_label = matchedRow.name_label;
                  //state.is_sell = matchedRow.is_sell;
                  //state.purchase_price = matchedRow.purchase_price;
                  //state.sales_price = matchedRow.sales_price;
                  //state.sales_unit_price = matchedRow.sales_unit_price;
                  //state.purchase_unit_price = matchedRow.purchase_unit_price;
                  //state.sample_price = matchedRow.sample_price;
                  //state.is_discontinued = matchedRow.is_discontinued;
                  //state.discontinued_at = matchedRow.discontinued_at;
                  //state.is_display = matchedRow.is_display;
                  //state.domestic_stock = matchedRow.domestic_stock;
                  //state.overseas_stock = matchedRow.overseas_stock;
                  //state.display_status = matchedRow.display_status;
                  //state.remarks = matchedRow.remarks;
                  //state.number_reservations = matchedRow.number_reservations;
                  //state.is_shipping_fee = matchedRow.is_shipping_fee;
                  //state.is_cash_delivery_fee = matchedRow.is_cash_delivery_fee;
                  //state.additional_shipping_fee = matchedRow.additional_shipping_fee;
                  //state.is_special_sale = matchedRow.is_special_sale;
                  //state.is_point_rebates = matchedRow.is_point_rebates;
                  //state.shipping_pay = matchedRow.shipping_pay;
                  //state.is_payment_id1 = matchedRow.is_payment_id1;
                  //state.is_payment_id2 = matchedRow.is_payment_id2;
                  //state.is_payment_id3 = matchedRow.is_payment_id3;
                  //state.is_payment_id4 = matchedRow.is_payment_id4;
                  //state.is_payment_id5 = matchedRow.is_payment_id5;

                  //await upDateSaveItem(Number(value[0]), '5');
                  updateSaveFlag = await upDateSaveItem(Number(value[0]), '5');
                  //if(await upDateSaveItem(Number(value[0]), '5')){
                  //  if(await delFanc()){
                  //    await appAlert('編集保存しました。');
                  //    backPage();
                  //  }
                  //}else{
                  //  dispatch(AppActions.failed('データの保存に失敗しました。'));
                  //}
                }
              }

              if(updateSaveFlag){
                if(await delFanc()){
                  await appAlert('編集保存しました。');
                  backPage();
                }else{
                  console.log('elseだよ');
                }
              }else{
                dispatch(AppActions.failed('データの保存に失敗しました。'));
              }
            }else{
              // 処理なし
            }
          }
        }
      }

    }else{
      if((state.item_number === null) || (state.item_number === undefined) || (state.item_number === '')) setErrors({...errors, item_number: '品番を入力してください'});
      else if((state.name === null) || (state.name === undefined) || (state.name === '')) setErrors({...errors, name: '商品名を入力してください'});
      else if((state.name_note === null) || (state.name_note === undefined) || (state.name_note === '')) setErrors({...errors, name_note: '商品名（納品書）を入力してください'});
      else if((state.category_name === null) || (state.category_name === undefined) || (state.category_name === '')) setErrors({...errors, category_name: '商品分類を入力してください'});
      else if((state.supplier_name === null) || (state.supplier_name === undefined) || (state.supplier_name === '')) setErrors({...errors, supplier_name: '仕入先を入力してください'});
      else if((state.display_status === null) || (state.display_status === undefined)) setErrors({...errors, display_status: '在庫表示を選択してください'});
      else if((state.code === null) || (state.code === undefined) || (state.code === '')) setErrors({...errors, code: '商品コードを入力してください'});
      else
        if(((state.is_payment_id1 === null) && (state.is_payment_id1 === undefined) && (state.is_payment_id1 === false)) &&
          ((state.is_payment_id2 === null) && (state.is_payment_id2 === undefined) && (state.is_payment_id2 === false)) && 
          ((state.is_payment_id3 === null) && (state.is_payment_id3 === undefined) && (state.is_payment_id3 === false)) &&
          ((state.is_payment_id4 === null) && (state.is_payment_id4 === undefined) && (state.is_payment_id4 === false)) &&
          ((state.is_payment_id5 === null) && (state.is_payment_id5 === undefined) && (state.is_payment_id5 === false))) 
            setErrors({...errors, is_payment_id1: '支払い方法を選択してください'});

      dispatch(AppActions.failed('必須項目を入力してください'));
    }
  }

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
          value={state.item_number}
          //value={state.itemNumberItem}
          error={errors?.item_number}
          //error={errors?.itemNumberItem}
          onChange={onChange}
          groupClassName="mt-0"
          className="max-w-lg"
          required
          autoFocus
        />
        <Forms.FormGroupInputText
          labelText="商品名"
          name="name"
          value={state.name}
          error={errors?.name}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={400}
        />
        <Forms.FormGroupInputText
          labelText="商品名（納品書）"
          name="name_note"
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
          <Forms.FormGroup labelText="商品分類" required error={errors?.category_name}>
            <div className="flex">
              <Forms.FormInputText
                name="category_name"
                //value={state.item_classification_name ?? ''}
                value={state.category_name}
                error={errors?.category_name}
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
          <Forms.FormGroup labelText="仕入先" required error={errors?.supplier_name}>
            <div className="flex">
              <Forms.FormInputText
                name="supplier_name"
                value={state.supplier_name}
                error={errors?.supplier_name}
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
                //onChange={() => a()}
              />
            </Forms.FormGroup>
          </div>
          <div>
            <Forms.FormGroupInputDate
              labelText="廃盤日"
              name="discontinued_at"
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
              name="domestic_stocks"
              value={state.domestic_stocks ?? '0'}
              className="max-w-8 text-right"
              readOnly
              removeOptionalLabel
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="国外在庫数"
              name="overseas_stocks"
              value={state.overseas_stocks ?? '0'}
              className="max-w-8 text-right"
              readOnly
              removeOptionalLabel
            />
          </div>
        </div>
        <Forms.FormGroupInputRadio
          labelText="在庫表示"
          name="display_status"
          value={state.display_status}
          error={errors?.display_status}
          onChange={onChange}
          items={[
            {
              labelText: '非表示',
              id: 'display_status_0',
              value: 0,
            },
            {
              labelText: '表示',
              id: 'display_status_1',
              value: 1,
            },
            {
              labelText: '表示（業者のみ）',
              id: 'display_status_2',
              value: 2,
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
          <div className="button-erea" style={{display: 'flex', justifyContent: 'flex-end'}}>
            <button onClick={useMovePage} className="btn ml-5">ショップイメージ</button>
            {/*<a className="shop-image" href={"/item/shop-image"}>ショップイメージ</a>*/}
            {/*<Route path="/Senni" element={<Senni id={1} text={'ID1'} />} />*/}
            <button className="btn ml-5" onClick={openItemListDialog}>
              他商品情報参照
            </button>
            <ItemRefSearchDialog selectId={state.id} {...itemListSearchDialogProps} onChangeState={changeState}/>
            <button className="btn ml-5" onClick={openSpecialSalesDialog}>
            {/*<button className="ref-items" onClick={clickSpecialSalesDialog}>*/}
              特売設定
            </button>
            <SpecialSalesDialog
              state={state}
              {...specialSalesProps}
              //{...state}
              onValueChange={handleValueChange}
            />
          </div>
          <div className="is-public" style={{marginLeft: '1px'}}>
            <Forms.FormGroup
              labelText="ショップ公開"
              error={errors?.is_sell}
              groupClassName="items-required mt-4"
            >
              <Forms.FormInputCheck
                id="is_sell"
                name="is_sell"
                checked={state.is_sell}
                onChange={onChange}
              />
            </Forms.FormGroup>
          </div>
            <Forms.FormGroupInputText
              labelText="商品コード"
              name="code"
              value={state.code}
              error={errors?.code}
              onChange={onChange}
              className="max-w-lg"
              required
              maxLength={400}
            />
          <div>
            <div style={{marginTop: '5px'}}>
              <label>バリエーション追加</label>
              <label className="label-required">必須</label>
              <input style={{marginTop: '5px'}} type="checkbox" onChange={handleCheck}/>
            </div>
            <div style={{marginLeft: "10px"}}>
              <div style={{marginLeft: '10px'}}>
                <label style={{marginLeft: "145px"}}>バリエーション1</label>
                <label style={{marginLeft: "56px"}}>バリエーション2</label>
                <label style={{marginLeft: "65px"}}>バリエーション3</label>
                <label style={{marginLeft: "65px"}}>バリエーション4</label>
                <label style={{marginLeft: "60px"}}>品番</label>
                <label style={{marginLeft: "100px"}}>金額</label>
              </div>
              <div style={{display: 'flex', marginLeft: "150px"}}>
                {/*<div>{variItems.map((item, itemIndex) => {*/}
                <div>{state.variItems.map((item, itemIndex) => {
                  return (
                    <div key={itemIndex} style={{display: 'flex'}}>{
                      item.map((value, index) => 
                        index > 0 ? (
                          <div key={index} style={{display: 'flex', marginBottom: '5px', visibility: value == null ? 'hidden':'visible'}}>
                            <input className="vari-row-input" /*type={value == null ? 'hidden' : 'text'}*/
                                   style={{borderRight: '1px solid #a0aec0', backgroundColor: checkBock.color}}
                                   disabled={!checkBock.flag} value={item[index]} onChange={(event) => onChangeValue(event, itemIndex, index)}
                                   onFocus={() => handleFocus(item)}
                                   onBlur={() => outForcus(item)}/>
                              {index < 5 &&
                                <button disabled={!checkBock.flag} style={{backgroundColor: checkBock.color}}
                                  className="plus-button" onClick={() => addNewVari(itemIndex, index)}>＋</button>
                              }
                          </div>
                        ) : null
                      )
                    }
                    <button className="btn-delete" style={{ marginLeft:'1px', height: '26px', paddingTop: '0px', paddingBottom: '0px'}}
                            onClick={() => delButton(itemIndex)} disabled={isDisabled}>
                      削除
                    </button>
                    </div>
                  )
                })}</div>
              </div>
            </div>
          </div>

          <div>
            <Forms.FormGroupTextarea
              labelText="商品説明"
              name="explanation"
              value={state.explanation ?? ''}
              error={errors?.explanation}
              className="max-w-lg"
              onChange={onChange}
              maxLength={500}
            />
            <Forms.FormGroupTextarea
              labelText="商品説明（詳細）"
              name="explanation_details"
              value={state.explanation_details ?? ''}
              error={errors?.explanation_details}
              className="max-w-lg my-1"
              onChange={onChange}
              maxLength={500}
            />
            <div className="price-erea" style={{marginLeft: '60px', marginTop: '10px'}}>
              <label>販売価格</label>
              <label className="label-required">必須</label>
              <input className="input-text"
                     value={state.sales_price}
                     disabled={checkBock.flag} style={{backgroundColor: backColor}}
                     onChange={(event) => salesPriceChange(event.target.value)}/>
            </div>
            <Forms.FormGroupInputNumber
              labelText="仕入価格"
              name="purchase_price"
              value={state.purchase_price}
              error={errors?.purchase_price}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              min={0}
            />
           <Forms.FormGroupInputNumber
              labelText="予約受付数"
              name="number_reservations"
              value={state.number_reservations}
              error={errors?.number_reservations}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              min={0}
            />
            {/*<div className="price-erea" style={{marginLeft: '60px', marginTop: '13px'}}>
              <label>仕入価格</label>
              <label className="label-required">必須</label>
              <input className="input-text" value={purchase_price} onChange={(event) => setPurchasePricee(Number(event.target.value))}/>
            </div>*/}
            {/*<div className="pre-order" style={{marginLeft: '49px', marginTop: '13px'}}>
              <label>予約受付数</label>
              <label className="label-optional">任意</label>
              <input className="input-text" value={number_reservations} onChange={(event) => setnumberReservations(Number(event.target.value))}/>
            </div>*/}
            <Forms.FormGroup
              labelText="送料適用"
              error={errors?.is_shipping_fee}
              groupClassName="items-center my-1"
            >
              <Forms.FormInputCheck
                id="is_shipping_fee"
                name="is_shipping_fee"
                checked={state.is_shipping_fee}
                onChange={onChange}
              />
            </Forms.FormGroup>
            <Forms.FormGroupInputNumber
              labelText="送料"
              name="shipping_pay"
              value={state.shipping_pay}
              error={errors?.shipping_pay}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              min={0}
            />
            <Forms.FormGroupInputNumber
              labelText="別途追加料金"
              name="additional_shipping_fee"
              value={state.additional_shipping_fee}
              error={errors?.additional_shipping_fee}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              min={0}
            />
            <Forms.FormGroup
              labelText="代引手数料適用"
              error={errors?.is_cash_delivery_fee}
              groupClassName="items-center my-1"
            >
              <Forms.FormInputCheck
                id="is_cash_delivery_fee"
                name="is_cash_delivery_fee"
                checked={state.is_cash_delivery_fee}
                onChange={onChange}
              />
            </Forms.FormGroup>
            <Forms.FormGroup
              labelText="ポイント還元"
              error={errors?.is_point_rebates}
              groupClassName="items-center mt-4"
            >
              <Forms.FormInputCheck
                id="is_point_rebates"
                name="is_point_rebates"
                checked={state.is_point_rebates}
                onChange={onChange}
              />
            </Forms.FormGroup>
            <div className="payment-how" style={{marginLeft: '23px'}}>
              <div>
                <label>支払い方法適用</label>
                <label className="label-required">必須</label>
              </div>
              <div className="payment-kind" style={{display: 'flex'}}>
                <Forms.FormInputCheck
                  id="is_payment_id1"
                  name="is_payment_id1"
                  checked={state.is_payment_id1}
                  onChange={onChange}
                />
                <label style={{marginLeft: '-16px', paddingTop: '7px'}}>現金</label>
              </div>
              <div className="payment-kind" style={{display: 'flex'}}>
                <Forms.FormInputCheck
                  id="is_payment_id2"
                  name="is_payment_id2"
                  checked={state.is_payment_id2}
                  onChange={onChange}
                />
                <label style={{marginLeft: '-16px', paddingTop: '7px'}}>掛売</label>
              </div>
              <div className="payment-kind" style={{display: 'flex'}}>
                <Forms.FormInputCheck
                  id="is_payment_id3"
                  name="is_payment_id3"
                  checked={state.is_payment_id3}
                  onChange={onChange}
                />
                <label style={{marginLeft: '-16px', paddingTop: '7px'}}>宅配代引</label>
              </div>
              <div className="payment-kind" style={{display: 'flex'}}>
                <Forms.FormInputCheck
                  id="is_payment_id4"
                  name="is_payment_id4"
                  checked={state.is_payment_id4}
                  onChange={onChange}
                />
                <label style={{marginLeft: '-16px', paddingTop: '7px'}}>クレジットカード</label>
              </div>
              <div className="payment-kind" style={{display: 'flex'}}>
                <Forms.FormInputCheck
                  id="is_payment_id5"
                  name="is_payment_id5"
                  checked={state.is_payment_id5}
                  onChange={onChange}
                />
                <label style={{marginLeft: '-16px', paddingTop: '7px'}}>銀行振込</label>
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
          <button className="btn" onClick={() => saveClick()} disabled={isDisabled}>
            保存
          </button>
        </div>
        {id && (
          <button className="btn-delete" onClick={() => delButton(-1)} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
