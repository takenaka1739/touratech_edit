import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { Item, ItemClassification, Supplier } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { ItemClassificationSearchDialog } from '@/app/ItemClassification/components/ItemClassificationSearchDialog';
import { SupplierSearchDialog } from '@/app/Supplier/components/SupplierSearchDialog';
import { ItemRefSearchDialog } from '@/app/Item/components/ItemRefSearchDialog';
import { SpecialSalesDialog } from '@/app/Item/components/SpecialSalesDialog';
import { useSpecialSalesPage } from '@/app/Item/uses/useSpecialSalesPage';
import { createUrl } from '@/app/Item/utils/createUrl';
import { TEMPLATE_ITEM_URLS } from '@/constants/TEMPLATE_ITEM_URLS';
import { AppActions } from '@/app/App/modules/appModule';
import { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { appAlert } from '@/components';
import { validateItemState } from '@/app/Item/utils/validation';
import { ItemPayload } from '@/types/ItemPayload';

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
    onClickDelete,
  } = useCommonDetailPage<Item & { selected: number[] | undefined; }>(slug, {
    id: undefined,
    supplier_id: undefined,
    code: '',
    name: '',
    item_number: undefined,
    variations1: '',
    variations2: '',
    variations3: '',
    variations4: '',
    explanation: '',
    explanation_details: '',
    name_note: '',
    name_label: '',
    is_sell: false,
    purchase_price: undefined,
    sales_price: 0,
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
    is_payment_id1: false,
    is_payment_id2: false,
    is_payment_id3: false,
    is_payment_id4: false,
    is_payment_id5: false,
    payErrorMessage: '',
    display_status: 0,
    variItems: [[]],  // variItemsとimageListの要素数・要素内容は対（要素0の管理IDまたはnewで判定）
    backVariItems: [[]],
    //image_name: undefined,
    imageList: [[]], // variItemsとimageListの要素数・要素内容は対（要素0の管理IDまたはnewで判定）
    shipping_pay: undefined,

    category_id: undefined,
    category_name: '',
    supplier_name: '',
    domestic_stocks: undefined,
    overseas_stocks: undefined,
    is_set_item: false,

    item_id: undefined,
    is_sales_members_only: false,
    start_at: '',
    end_at: '',
    special_sale_price: 0,
    refund_rate: 0,
    codeList: [],
    categoryList: [],
    specialSalesList: [],
    specialSalesDelFlag: false,
    selected: undefined,
    preImageList: [[]],
    combination_id: undefined,
    combIdList: [],
    send_trader: undefined,
    send_personal: undefined,
    type_status: undefined,
    type_name: '',
    file_name: '',
    document_id: undefined,
    pdf: undefined,
    documentFileList: [],
    categoryListAll: []
  });

  //type imageItem = {
  //  id: number | null;
  //  category_id: number | null;
  //  item_id: number | undefined;
  //  name: string;
  //  order_by: number;
  //  url: any;
  //};

  type Category = {
    combId: number | undefined;
    categoryId: number | null;
    name: string;
    status: string;
    initialcategoryId: number | undefined;
  };

  //const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.item_number);
  const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.item_number);

  const [variItems, setVariItems] = useState([['', '', '', '', '', '', '']]);
  const [checkBock, setCheckBock] = useState({ color: '#EDF2F7', flag: false });
  const [backColor, setbackColor] = useState('#ffffff');
  const [variChangeItem, setVariChangeItem] = useState<string[][]>([]);
  const dispatch = useDispatch();
  const [onFocusItem, setonFocusItem] = useState<string[]>();
  const location = useLocation<any>();
  const [categoryChangeFlag, setCategoryChangeFlag] = useState(false);
  const [supplierChangeFlag, setSupplierChangeFlag] = useState(false);
  const [variClickFlag, setvariClickFlag] = useState(false);
  const [variDelItem, setVariDelItem] = useState<string[][]>([]);
  const [typeName, setTypeName] = useState('');
  const [typeNameBackColor, setTypeNameBackColor] = useState('#EDF2F7');
  const [changeCategoryIndex, setChangeCategoryIndex] = useState<number | null>(null);
  const [changeCategoryFlag, setChangeCategoryFlag] = useState(false);
  const [preCategoryId, setPreCategoryId] = useState<number | undefined>(undefined);
  const [domestic_url, setDomestic_url] = useState<string>('');

  // 初期値設定
  useEffect(() => {
    const isValid = Array.isArray(state.variItems) &&
      state.variItems.length > 0 &&
      state.variItems[0].length > 0;
    setVariItems(isValid ? state.variItems : [['new1', '', '', '', '', '', '']]);
    if(!(state.imageList[0].length > 0)){
      setState(prev => ({
        ...prev,
        imageList: [['new1']],
      }));
    }

    if (!state.variItems || state.variItems.length === 0 || state.variItems.every(row => row.length === 0)) {
      setState(prev => ({
        ...prev,
        variItems: [['new1', '', '', '', '', '', '']],
      }));
    }

    if(state.type_status === undefined){
      setState(prev => ({
        ...prev,
        type_status: 0
      }));
    }

    if (state.categoryList.length === 0) {
      const arr: Category = {
        combId: undefined,
        categoryId: null,
        name: "",
        status: 'new1',
        initialcategoryId: undefined,
      };
      setState(prev => ({
        ...prev,
        categoryList: [arr]
      }));
    }
  }, [state, state.variItems, state.purchase_price, state.number_reservations,
    state.specialSalesList, state.imageList]);

  // state.categoryListの初期値（新規作成時の1行目の作成）
  useEffect(() => {
    if (Array.isArray(state.categoryList) && state.categoryList.length === 0) {
      addNewCategory();
    }
  }, [state.categoryList]);

  useEffect(() => {
    if (state.shipping_pay === null || state.shipping_pay === undefined) {
      if (state.display_status === 2) {
        setState({ ...state, shipping_pay: state.send_trader })
      } else {
        setState({ ...state, shipping_pay: state.send_personal })
      }
    }
  }, []);

  useEffect(() => {
    if (state.is_payment_id1 === true || state.is_payment_id2 === true || state.is_payment_id3 === true ||
        state.is_payment_id4 === true || state.is_payment_id5 === true) {
      setErrors(prev => ({
        ...prev,
        payErrorMessage: '',
      }));

    }
  }, [state.is_payment_id1, state.is_payment_id2, state.is_payment_id3, state.is_payment_id4, state.is_payment_id5]);

  // 取扱説明書の題目名設定
  useEffect(() => {
    let name: string | undefined = '';
    if (state.type_status === 0) {
      name = 'なし';
    } else if (state.type_status === 1) {
      name = '取扱説明書';
    } else if (state.type_status === 2) {
      name = 'サイズ表';
    } else {
      setTypeNameBackColor('#FFFFFF');
      setState(prev => ({
        ...prev,
        type_name: typeName,
      }));
    }

    if (state.type_status !== 3) {
      setTypeName('');
      setTypeNameBackColor('#EDF2F7');
      setState(prev => ({
        ...prev,
        type_name: name,
      }));
    }
  }, [state.type_status, typeName]);

  // 国内リンクの初期値設定
  useEffect(() => {
    if(state.category_name == undefined){
      setDomestic_url(`https://touratech.matrix.jp/ec/category-products/カテゴリーの一覧/${state.categoryList[0].name}/${state.id}`);
    }
  }, [state.category_name]);

  const onChangeTypeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTypeName(event.target.value);
  }

  // 取扱説明書の題目名設定
  useEffect(() => {
    if (state.type_status === 3) {
      if (state.type_name) setTypeName(state.type_name ?? '');
    }
  }, [state.type_name]);

  const prevIdRef = useRef(state.id);
  useEffect(() => {
    // 前回の id を保持する ref

    // 次回のために更新
    prevIdRef.current = state.id;
  }, [state.id]); // id の変化だけ監視

  const {
    open: openItemClassDialog,
    searchDialogProps: itemClassSearchDialogProps,
  } = useCommonSearchDialogProps<ItemClassification>('item_classification', async props => {
    const { id, name } = props;
    updateState({
      category_id: id,
      category_name: name,
    });

    if (preCategoryId !== undefined && state.category_id !== undefined) {
      if (preCategoryId === state.category_id) {
        const matched = state.categoryList.find(
          item => item.categoryId === preCategoryId
        );
        if ((matched?.status !== 'del') && (matched !== undefined)) {
          setChangeCategoryFlag(true);
        } else {
          changeCategory();
        }
      } else {
        changeCategory();
      }
    }
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
    console.log('state1');
    console.log(state);
    const { id, name } = props;
    {
      updateState({
        id: id,
        name: name,
      });
      updateErrors({
        id: '',
      });
      return true;
    }
  });

  console.log('state2');
  console.log(state);

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
    updateState({ selected });
  };

  const changeState = (value: any) => {
    console.log('changeState');
    console.log(value['imageList']);
    setState(prev => ({
      ...prev,
      item_number: value['item_number'],
      name: value['name'],
      name_note: value['name_note'],
      name_label: value['name_label'],
      categoryList: value['categoryList'],
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
      //image_name: value['image_name'],
      is_sales_members_only: value['is_sales_members_only'],
      refund_rate: value['refund_rate'],
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
      document_id: value['document_id'],
      type_status: value['type_status'],
      type_name: value['type_name'],
      file_name: value['file_name']
    }));

    setVariChangeItem([]);
    //setSpecialItem(value['specialSalesList']);
    //setImageItems(value['imageList']);
    setCategoryChangeFlag(false);
    setSupplierChangeFlag(false);
    setvariClickFlag(false);
    setVariDelItem([]);
    if (value['type_status'] === 3) {
      setTypeName(value['type_name']);
    } else {
      setTypeName('');
    }
  }

  const onClickPrint = async () => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/output`, { ...state, isPrintPrice: true });
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
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
    let variArr: any = [null, null, null, null, null, null, null];
    let imgArr: any = [null];

    // 選択されたバリエーション以下に空白設定
    for (let i = 0; i < variArr.length; i++) {
      if (selctIndex <= i) {
        variArr[i] = ''
      }
    }

    const newCount = state.variItems.filter(
      (value) => typeof value[0] === 'string' && value[0].includes('new')
    ).length + 1;

    variArr[0] = 'new' + newCount;
    imgArr[0] = 'new' + newCount;
    let insertIndex = selectRow + 1;

    while (
      insertIndex < state.variItems.length &&
      state.variItems[insertIndex][selctIndex] === null
    ) {
      insertIndex++;
    };

    // 挿入処理
    setState(prev => ({
      ...prev,
      variItems: [
        ...prev.variItems.slice(0, insertIndex),
        variArr,
        ...prev.variItems.slice(insertIndex),
      ],
    }));

    setState(prev => ({
      ...prev,
      backVariItems: [
        ...prev.backVariItems.slice(0, insertIndex),
        variArr,
        ...prev.backVariItems.slice(insertIndex),
      ],
    }));

    // 挿入処理
    setState(prev => ({
      ...prev,
      imageList: [
        ...prev.imageList.slice(0, insertIndex),
        imgArr,
        ...prev.imageList.slice(insertIndex),
      ],
    }));
  }

  // 商品分類の行追加
  // select:選択された行、index:選択された列
  const addNewCategory = () => {
    setChangeCategoryFlag(false);

    setState(prev => {
      // categoryList が未定義/null の場合は空配列にして扱う
      const currentList = Array.isArray(prev.categoryList) ? prev.categoryList : [];

      // status が "newX" のものを抽出
      const newStatuses = currentList
        .map(item => item.status)
        .filter(status => /^new\d+$/.test(status));

      // 数字部分を取り出して最大値を算出
      const maxNumber =
        newStatuses.length > 0
          ? Math.max(...newStatuses.map(s => parseInt(s.replace("new", ""), 10)))
          : 0;

      // 次の番号を作成
      const nextStatus = `new${maxNumber + 1}`;
      const arr: Category = {
        combId: undefined,
        categoryId: null,
        name: "",
        status: nextStatus,
        initialcategoryId: undefined,
      };

      const nextList = [...currentList, arr];
      return { ...prev, categoryList: nextList };
    });
  };

  useEffect(() => {
    if (changeCategoryIndex !== null) {
      if (state.category_id !== undefined && state.category_name !== undefined) {
        // 同じカテゴリが選択されているかのチェック
        const flag = state.categoryList.some(
          item =>
            item.categoryId !== null && // ← nullは無視
            item.status !== "del" &&
            item.categoryId === state.category_id
        );

        setChangeCategoryFlag(flag);

        if (!flag) {
          setState((prev) => {
            const delIndex = prev.categoryList.findIndex(
              (item) =>
                item.status === "del" &&
                item.categoryId === state.category_id
            );

            if (delIndex !== -1) {
              const delItem = prev.categoryList[delIndex];

              // 1. 復活処理
              const revivedList = prev.categoryList.map((item, idx) => {
                if (idx === changeCategoryIndex) {
                  return {
                    ...item,
                    combId: delItem.combId,
                    categoryId: delItem.categoryId,
                    name: delItem.name,
                    initialcategoryId: delItem.initialcategoryId,
                    status:
                      delItem.categoryId === delItem.initialcategoryId
                        ? "no update"
                        : "update",
                  };
                }
                return item;
              });

              // 2. 最大 newX 行を探索
              const maxNewIndex = revivedList.reduce(
                (acc, item, idx) => {
                  if (item.categoryId == null && /^new\d+$/.test(item.status)) {
                    const num = parseInt(item.status.replace("new", ""), 10);
                    if (num > acc.value) {
                      return { value: num, index: idx };
                    }
                  }
                  return acc;
                },
                { value: -1, index: -1 }
              );

              // 3. 見つかった newX 行を削除（復活させた行が changeCategoryIndex の場合のみ）
              let filteredList = revivedList;
              if (maxNewIndex.index !== -1 && delIndex === changeCategoryIndex) {
                filteredList = revivedList.filter(
                  (_, idx) => idx !== maxNewIndex.index
                );
              }

              // 4. 最終結果
              return { ...prev, categoryList: filteredList };
            }

            // del 行がなければ通常処理
            return {
              ...prev,
              categoryList: prev.categoryList.map((item, index) => {
                if (index !== changeCategoryIndex) return item;

                if (item.status.includes("new")) {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: item.status,
                  };
                } else if (state.category_id === item.initialcategoryId) {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: "no update",
                  };
                } else {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: "update",
                  };
                }
              }),
            };
          });
        } else {
          setChangeCategoryFlag(true);
        }
      }
      setPreCategoryId(state.category_id);
    }
  }, [state.category_id, state.category_name]);

  const changeCategory = () => {
    if (changeCategoryIndex !== null) {
      if (state.category_id !== undefined && state.category_name !== undefined) {
        // 同じカテゴリが選択されているかのチェック
        const flag = state.categoryList.some(
          item =>
            item.categoryId !== null && // ← nullは無視
            item.status !== "del" &&
            item.categoryId === state.category_id
        );
      
        setChangeCategoryFlag(flag);
      
        if (!flag) {
          setState((prev) => {
            const delIndex = prev.categoryList.findIndex(
              (item) =>
                item.status === "del" &&
                item.categoryId === state.category_id
            );
          
            if (delIndex !== -1) {
              const delItem = prev.categoryList[delIndex];
            
              // 1. 復活処理
              const revivedList = prev.categoryList.map((item, idx) => {
                if (idx === changeCategoryIndex) {
                  return {
                    ...item,
                    combId: delItem.combId,
                    categoryId: delItem.categoryId,
                    name: delItem.name,
                    initialcategoryId: delItem.initialcategoryId,
                    status:
                      delItem.categoryId === delItem.initialcategoryId
                        ? "no update"
                        : "update",
                  };
                }
                return item;
              });
            
              // 2. 最大 newX 行を探索
              const maxNewIndex = revivedList.reduce(
                (acc, item, idx) => {
                  if (item.categoryId == null && /^new\d+$/.test(item.status)) {
                    const num = parseInt(item.status.replace("new", ""), 10);
                    if (num > acc.value) {
                      return { value: num, index: idx };
                    }
                  }
                  return acc;
                },
                { value: -1, index: -1 }
              );
            
              // 3. 見つかった newX 行を削除（復活させた行が changeCategoryIndex の場合のみ）
              let filteredList = revivedList;
              if (maxNewIndex.index !== -1 && delIndex === changeCategoryIndex) {
                filteredList = revivedList.filter(
                  (_, idx) => idx !== maxNewIndex.index
                );
              }
            
              // 4. 最終結果
              return { ...prev, categoryList: filteredList };
            }
            // del 行がなければ通常処理
            return {
              ...prev,
              categoryList: prev.categoryList.map((item, index) => {
                if (index !== changeCategoryIndex) return item;
              
                if (item.status.includes("new")) {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: item.status,
                  };
                } else if (state.category_id === item.initialcategoryId) {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: "no update",
                  };
                } else {
                  return {
                    ...item,
                    categoryId: state.category_id,
                    name: state.category_name,
                    status: "update",
                  };
                }
              }),
            };
          });
        } else {
          setChangeCategoryFlag(true);
        }
      }
      setPreCategoryId(state.category_id);
    }
  }

  const onChangeCategory = (originalIndex: number) => {
    setChangeCategoryFlag(false);
    setChangeCategoryIndex(originalIndex);
    openItemClassDialog();
  };

  const categoryDelButton = (originalIndex: number) => {
    setCategoryChangeFlag(true);
    setChangeCategoryFlag(false);

    setState(prev => {
      const target = prev.categoryList[originalIndex];

      // status が new の場合は削除
      if (target.status.includes("new")) {
        return {
          ...prev,
          categoryList: prev.categoryList.filter((_, index) => index !== originalIndex),
        };
      }

      // update / no update の場合は status を del に変更
      return {
        ...prev,
        categoryList: prev.categoryList.map((item, index) =>
          index === originalIndex
            ? { ...item, status: "del" }
            : item
        ),
      };
    });
    setChangeCategoryIndex(originalIndex);
  };

  const delButton = (selectIndex: number) => {
    setvariClickFlag(true);
    if (selectIndex === -1) {
      onClickDelete();
    } else {
      setState((prevState) => ({
        ...prevState,
        variItems: prevState.variItems.filter((_, index) => index !== selectIndex),
      }));

      setState((prevState) => ({
        ...prevState,
        imageList: prevState.imageList.filter((_, index) => index !== selectIndex),
      }));

      const target = String(state.variItems[selectIndex]);
      if (typeof target === "string" && !target.includes("new")) {
        setVariDelItem([...variDelItem, state.variItems[selectIndex]]);
      }
    }

    if (Array.isArray(variChangeItem)) {
      const updatedItems = variChangeItem.filter(item => item[0] !== variItems[selectIndex][0]);
      setVariChangeItem(updatedItems);
    }
  }

  // チェックボックスのチェックが変更された場合、Stateの更新
  const handleCheck = (e: any) => {
    // 操作したチェックボックスの値
    // チェックされている場合
    if (e.target.checked) {
      // 値の追加
      setCheckBock({ color: '#ffffff', flag: true });
      setbackColor('#EDF2F7');
      setState(prev => ({
        ...prev,
        sales_price: 0
      }));
    } else {
      //チェックがはずされた場合
      //値の削除
      setCheckBock({ color: '#EDF2F7', flag: false });
      setbackColor('#ffffff');
    }
  };

  // 子コンポーネントから受け取った値を格納するstate
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
      sales_price: salesPrice
    }));

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

  const onChangeValue = (event: React.ChangeEvent<HTMLInputElement>, select: number, selectIndex: number) => {
    setvariClickFlag(true);
    event.persist();
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

  const outForcus = (item: string[]) => {
    setvariClickFlag(true);
    // 変更されたバリデーションが何もない時
    if (!(onFocusItem?.every((value, index) => value === item[index]))) {
      let targetChangeItem: any = [];
      // バリデーションが1行以上ある時
      if (variItems.length > 0) {
        // 変更したバリデーションの中に現在変更中のバリデーションが存在しているか
        const target = variChangeItem.filter(row => row[0] === item[0]);
        // 編集している行の一つ上のインデックスの取得
        const targetIndex = (variItems.findIndex(row => row[0] === item[0])) - 1;
        const indexItem = variChangeItem[targetIndex];
        if (target.length > 0) {
          target[0].forEach((value, index) => {
            if (value === null) {
              targetChangeItem.push(indexItem[index]);
            } else {
              let pushValue = item[index] !== null ? item[index] : value;
              targetChangeItem.push(pushValue);
            }
          });
          const deleIndex = variChangeItem.findIndex(row => row[0] === item[0]);
          variChangeItem.splice(deleIndex, 1); // その行を削除
          state.backVariItems.splice(deleIndex, 1);
          setVariChangeItem((changeItem) => [...changeItem, targetChangeItem]);
        } else {
          const target2 = variItems.filter(row => row[0] === item[0]);
          const targetIndex = (variItems.findIndex(row => row[0] === item[0])) - 1;
          const indexItem = variItems[targetIndex];
          if (target2.length > 0) {
            target2[0].forEach((value, index) => {
              if (value === null) {
                let fallbackValue = indexItem[index];
                // indexItem[index] が null の場合、variChangeItem を上に辿って補完
                if (fallbackValue === null) {
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
      } else {
        setVariChangeItem((changeItem) => [...changeItem, item]);
      }
    } else {
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
    navigation.push({
      pathname: '/item/shop-image',
      state: {
        item_id: state.id,
        preVariItem: variItems,
        exDetail: state.explanation_details,
        variItems: filledItems,
        variChangeItem: variChangeItem,
        backVariItems: state.backVariItems,
        imageItems: state.imageList,
        categoryChangeFlag: categoryChangeFlag,
        supplierChangeFlag: supplierChangeFlag,
        items: state
      }
    });
  }

  // ショップイメージから戻ってきた時の値取得
  useEffect(() => {
    if (location.state !== undefined) {
      setvariClickFlag(false);
      if (Array.isArray(location.state.imageItem)) {
        setCategoryChangeFlag(location.state.categoryChangeFlag);
        setSupplierChangeFlag(location.state.supplierChangeFlag);
        setState(prev => ({
          ...prev,
          imageList: location.state.imageItem
        }));
      }

      if (variClickFlag !== true) {
        setVariChangeItem(location.state.variChangeItem);
        if (location.state.preState.type_status === 3) setTypeName(location.state.preState.type_name);
        setState(prev => {
          return {
            ...prev,
            category_name: location.state.preState.category_name,
            category_id: location.state.preState.category_id,
            name: location.state.itemName,
            explanation_details: location.state.exDetail,
            variItems: location.state.preVariItem,
            supplier_name: location.state.preState.supplier_name,
            supplier_id: location.state.preState.supplier_id,
            type_status: location.state.preState.type_status,
            type_name: location.state.preState.type_name,
            file_name: location.state.preState.file_name,
            categoryList: location.state.preState.categoryList,
            pdf: location.state.preState.pdf,
          };
        });
      }
    }

  }, [location, state.variItems]);

  useEffect(() => {
    if (location.state !== undefined && Array.isArray(location.state.imageItem)) {
      updateState(location.state.preState);
    }
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file); // プレビュー用URL

      setState(prev => ({
        ...prev,
        file_name: file.name,
        document_url: url,
        pdf: file, // ← ファイルそのものも state に保持
      }));
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const history = useHistory();
  const backPage = () => history.push(`/item`);

  /**
   * 商品マスタへの新規登録処理を行う。
   * 
   * @param state - 商品情報を保持するオブジェクト (Item型)
   * @returns boolean - true：登録成功、false：登録失敗
   */
  const storeItem = async (payload: ItemPayload): Promise<boolean> => {
    try {
      dispatch(AppActions.request());

      const res = await axios.post('/api/item/store', payload);

      if (res.status === 200) {
        dispatch(AppActions.success());
        if (res.data.success) {
          return true;
        } else {
          setErrors(res.data.errors);
          return false;
        }
      } else {
        dispatch(AppActions.failed('リクエストに失敗しました。'));
        return false;
      }
    } catch (error) {
      dispatch(AppActions.failed('通信エラーが発生しました。'));
      return false;
    }
  };

  /**
   * 商品マスタへの編集登録処理を行う。
   * 
   * @param state - 商品情報を保持するオブジェクト (Item型)
   * @returns boolean - true：登録成功、false：登録失敗
   */
  const updateItem = async (payload: ItemPayload): Promise<boolean> => {
    try {
      dispatch(AppActions.request());

      const res = await axios.put(`/api/item/${payload.id}/update_transaction`, payload);

      if (res.status === 200) {
        dispatch(AppActions.success());
        if (res.data.success) {
          return true;
        } else {
          setErrors(res.data.errors);
          return false;
        }
      } else {
        dispatch(AppActions.failed('リクエストに失敗しました。'));
        return false;
      }
    } catch (error) {
      dispatch(AppActions.failed('通信エラーが発生しました。'));
      return false;
    }
  };

  /**
   * 商品画像・動画・YouTubeリンクの配列を生成するユーティリティ関数。
   * 
   * @param imageList 
   * @returns 
   */
  const buildImageInfo = (imageList: (File | string)[][]): string[][] => {
    return imageList.map(value => {
      const itemId = String(value[0]);
      const files = value.slice(1);

      // File（商品画像・動画）ならファイル名、文字列（YouTubeリンク）ならそのまま取り出し
      const fileNames = files.map(file => {
        if (file instanceof File) {
          return file.name;
        } else if (typeof file === "string" && file.trim() !== "") {
          return file;
        }
        // 例外は空文字
        return "";
      }).filter((name): name is string => !!name);    // 空文字を除外

      // [id, fileName1/link1, fileName2/link2, ...] の形で返す
      return [itemId, ...fileNames];
    });
  };

  /**
   * 商品画像・動画・取扱説明書などの複数ファイルを一括アップロードする。
   * 
   * @param files 
   * @returns 
   */
const uploadImages = async (imageList: any[][] | null, document?: File): Promise<string[]> => {
  // 画像・動画・説明書のいずれも無い場合は即座に空配列を返す
  if ((!imageList || imageList.length === 0) && !document) return [];

  const formData = new FormData();
  let hasFile = false;

  // 商品画像・動画のみアップロード対象（YouTubeリンクは除外）
  imageList?.forEach((items) => {
    if (!items) return;

    items.slice(1).forEach((item) => {
      if (item instanceof File) {
        // 商品画像
        if (item.type.startsWith("image/")) {
          formData.append("images[]", item);
          hasFile = true;

        // 動画
        } else if (item.type.startsWith("video/")) {
          formData.append("videos[]", item);
          hasFile = true;
        }
      }
    });
  });

  // 取扱説明書があれば追加
  if (document instanceof File) {
    formData.append("document", document);
    hasFile = true;
  }

  // 商品画像・動画・取扱説明書がなければ空配列を返す
  if (!hasFile) return [];

  try {
    dispatch(AppActions.request());
    const res = await axios.post("/api/item/store_image_transaction", formData);
    return res.data.paths;
  } catch (error: any) {
    throw error;
  }
};

  /**
   * 商品マスタ関連の新規登録をリクエストする。
   */
  const handleNewItem = async () => {
    try {
      // 商品画像・動画のアップロード
      await uploadImages(state.imageList, state.pdf);

      // アップロードに成功したらDB更新
      const images = buildImageInfo(state.imageList);
      const payload: ItemPayload = { ...state, images };
      const success = await storeItem(payload);

      if (success) {
        await appAlert('新規保存しました。');
        backPage();
      } else {
        dispatch(AppActions.failed('データの保存に失敗しました。'));
      }
    } catch (error) {
      // アップロード失敗時はDB更新を行わずエラー扱い
      dispatch(AppActions.failed('ファイルのアップロードに失敗しました。'));
    }
  };

  /**
   * 商品マスタ関連の編集登録をリクエストする。
   */
  const handleEditItem = async () => {
    try {
      // 商品画像・動画のアップロード
      await uploadImages(state.imageList, state.pdf);

      // アップロードに成功したらDB更新
      const images = buildImageInfo(state.imageList);
      const payload: ItemPayload = { ...state, images };
      const success = await updateItem(payload);

      if (success) {
        await appAlert('編集保存しました。');
        backPage();
      } else {
        dispatch(AppActions.failed('データの保存に失敗しました。'));
      }
    } catch (error) {
      // アップロード失敗時はDB更新を行わずエラー扱い
      dispatch(AppActions.failed('ファイルのアップロードに失敗しました。'));
    }
  };

  /**
   * 保存ボタンクリック時の処理。
   * - 必須入力項目の検証
   * - 新規登録か編集登録かの判断
   * - 永続化のリクエスト
   * 
   * @returns 
   */
  const saveClick: () => void = async () => {

    // 必須入力項目の未入力チェック
    const validationErrors = validateItemState(state);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      dispatch(AppActions.failed('必須項目を入力してください'));
      return;
    }

    // 新規登録
    if (state.id === undefined) {
      await handleNewItem();
    // 編集登録
    } else {
      await handleEditItem();
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
          error={errors?.item_number}
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
          maxLength={401}
        />
        <Forms.FormGroupInputText
          labelText="商品名（納品書）"
          name="name_note"
          value={state.name_note}
          error={errors?.name_note}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={401}
        />
        <Forms.FormGroupInputText
          labelText="商品名（ラベル用）"
          name="name_label"
          value={state.name_label ?? ''}
          error={errors?.name_label}
          onChange={onChange}
          className="max-w-lg"
          maxLength={401}
        />
        <div style={{ display: 'flex', marginTop: '6px' }}>
          <div style={{ width: '790px', display: 'flex' }}>
            <div style={{ display: 'flex', marginTop: '8px', marginLeft: '60px' }}>
              <label>商品分類</label>
              <label className="label-required">必須</label>
            </div>
            <div>
              {state.categoryList
                .map((item, originalIndex) => ({ ...item, originalIndex }))
                .filter(item => item.status !== "del")
                .map((item, index) => {
                  // 条件付きでボーダーカラーを決定
                  const borderColor =
                    changeCategoryFlag && item.originalIndex === changeCategoryIndex
                      ? "red"   // 重複している行は赤枠
                      : "#BCC7D4"; // 通常はグレー枠
                  return (
                    <div key={item.originalIndex}>
                      <div style={{ display: "flex" }}>
                        <input
                          className="vari-row-input"
                          style={{
                            border: `1px solid ${borderColor}`,
                            backgroundColor: "#EDF2F7",
                            marginTop: "5px",
                            width: "512px",
                          }}
                          value={item.name}
                        />
                        <button
                          className="btn py-0 px-2"
                          style={{ marginTop: "5px", marginLeft: '8px' }}
                          onClick={() => onChangeCategory(item.originalIndex)}
                        >
                          ...
                        </button>
                        {index >= 1 && (
                          <button
                            className="btn-delete"
                            style={{ marginTop: "5px", marginLeft: "5px", whiteSpace: "nowrap" }}
                            onClick={() => categoryDelButton(item.originalIndex)}
                          >
                            削除
                          </button>
                        )}
                      </div>

                      {/* 重複チェック */}
                      {changeCategoryFlag && item.originalIndex === changeCategoryIndex && (
                        <div className="form-error">重複した商品分類です</div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
          <button className="category-plus-button" onClick={() => addNewCategory()}>＋</button>
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
              required
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
              />
            </Forms.FormGroup>
          </div>
          <div>
            <Forms.FormGroupInputDate
              labelText="廃盤日"
              name="discontinued_at"
              value={state.discontinued_at}
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
                checked={state.is_display}
                onChange={onChange}
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
              labelText: '表示（一般含む）',
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
        <div style={{ alignItems: 'center', marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '627px' }}>
            <Forms.FormGroupInputRadio
              labelText="取扱説明書設定"
              name="type_status"
              value={state.type_status}
              error={errors?.type_status}
              onChange={onChange}
              items={[
                {
                  labelText: 'なし',
                  id: 'type_status_0',
                  value: 0,
                },
                {
                  labelText: '取扱説明書',
                  id: 'type_status_1',
                  value: 1,
                },
                {
                  labelText: 'サイズ表',
                  id: 'type_status_2',
                  value: 2,
                },
                {
                  labelText: 'その他',
                  id: 'type_status_3',
                  value: 3,
                }
              ]}
              required={false}
            />
            <input className="vari-row-input" /*type={value == null ? 'hidden' : 'text'}*/
              disabled={state.type_status !== 3} style={{
                borderRight: '1px solid #a0aec0', backgroundColor: typeNameBackColor,
                width: '200px',
              }}
              value={typeName} onChange={(event) => onChangeTypeName(event)}
            />
            {/*<Forms.FormInputText
              name="type_name"
              value={typeName}
              className="type_name"
            />*/}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginLeft: '160px', marginTop: '10px' }}>
            <label style={{ marginRight: '5px' }}>ファイル選択</label>
            <Forms.FormInputText
              name="file_name"
              value={state.file_name}
              error={errors?.file_name}
              className="file_name"
              readOnly
            />
            <button onClick={handleClick} className="file_btn ml-2 py-0 px-2">...</button>
            <input
              type="file"
              ref={inputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>
        <div>
          <hr className="border-dashed border-gray-400 mt-4 mb-4" />
          <div className="button-erea" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={useMovePage} className="btn ml-5">ショップイメージ</button>
            <button className="btn ml-5" onClick={openItemListDialog}>
              他商品情報参照
            </button>
            <ItemRefSearchDialog selectId={state.id} {...itemListSearchDialogProps} onChangeState={changeState} />
            <button className="btn ml-5" onClick={openSpecialSalesDialog}>
              特売設定
            </button>
            <SpecialSalesDialog
              state={state}
              {...specialSalesProps}
              onValueChange={handleValueChange}
            />
          </div>
          <div className="is-public" style={{ marginLeft: '1px' }}>
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
          <div style={{ marginTop: '8px' }}>
            <label>バリエーション追加</label>
            <label className="label-optional">任意</label>
            <input style={{ marginTop: '5px' }} type="checkbox" onChange={handleCheck} />
          </div>
          <div style={{ marginLeft: "160px" }}>
            {/* ヘッダー部分 */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <label style={{whiteSpace: "nowrap"}}>バリエーション1</label>
              <label style={{whiteSpace: "nowrap", marginLeft: '60px'}}>バリエーション2</label>
              <label style={{whiteSpace: "nowrap", marginLeft: '60px'}}>バリエーション3</label>
              <label style={{whiteSpace: "nowrap", marginLeft: '60px'}}>バリエーション4</label>
              <label style={{whiteSpace: "nowrap", marginLeft: '55px'}}>品番</label>
              <label style={{whiteSpace: "nowrap", marginLeft: '100px'}}>販売価格（税込）</label>
            </div>
            {/* 入力部分 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {state.variItems.map((item, itemIndex) => (
                <div key={itemIndex} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  {item.map((value, index) =>
                    index > 0 ? (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', visibility: value == null ? 'hidden' : 'visible' }}>
                        <input
                          className="vari-row-input"
                          style={{ borderRight: '1px solid #a0aec0', backgroundColor: checkBock.color, marginRight: '5px' }}
                          disabled={!checkBock.flag}
                          value={item[index]}
                          onChange={(event) => onChangeValue(event, itemIndex, index)}
                          onFocus={() => handleFocus(item)}
                          onBlur={() => outForcus(item)}
                        />
                        {index < 5 && (
                          <button
                            disabled={!checkBock.flag}
                            style={{ backgroundColor: checkBock.color }}
                            className="plus-button"
                            onClick={() => addNewVari(itemIndex, index)}
                          >
                            ＋
                          </button>
                        )}
                      </div>
                    ) : null
                  )}
                  {state.variItems.length > 1 && (
                    <button
                      className="btn-delete"
                      style={{ height: '26px', padding: '0 5px', whiteSpace: "nowrap" }}
                      onClick={() => delButton(itemIndex)}
                      disabled={isDisabled}
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {errors?.variation && (
              <div style={{ color: 'red', marginTop: '5px' }}>
                {errors.variation}
              </div>
            )}
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
            <div className="price-erea" style={{ marginLeft: '1px', marginTop: '10px' }}>
              <label style={{ marginTop: '5px', marginLeft: '11px', display: "block", textAlign: "right" }}>販売価格（税込）</label>
              <label style={{ marginTop: '5px' }} className="label-required">必須</label>
              <input type="number" className="input w-full text-right max-w-8"
                value={state.sales_price}
                disabled={checkBock.flag} style={{ backgroundColor: backColor }}
                onChange={(event) => salesPriceChange(event.target.value)}
              />
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
              labelText="別途追加送料"
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
            <Forms.FormGroup
              labelText="支払い方法"
              groupClassName="items-center mt-4"
              required={true}
            >
              <div className="payment-kind" style={{ display: 'flex' }}>
                <Forms.FormInputCheck
                  id="is_payment_id1"
                  name="is_payment_id1"
                  labelText='現金'
                  checked={state.is_payment_id1}
                  onChange={onChange}
                />
                <Forms.FormInputCheck
                  id="is_payment_id2"
                  name="is_payment_id2"
                  labelText='売掛'
                  checked={state.is_payment_id2}
                  onChange={onChange}
                />
                <Forms.FormInputCheck
                  id="is_payment_id3"
                  name="is_payment_id3"
                  labelText='宅配代引'
                  checked={state.is_payment_id3}
                  onChange={onChange}
                />
                <Forms.FormInputCheck
                  id="is_payment_id4"
                  name="is_payment_id4"
                  labelText='銀行振込'
                  checked={state.is_payment_id4}
                  onChange={onChange}
                />
                <Forms.FormInputCheck
                  id="is_payment_id5"
                  name="is_payment_id5"
                  labelText='クレジットカード'
                  checked={state.is_payment_id5}
                  onChange={onChange}
                />
              </div>
            </Forms.FormGroup>
            {errors?.payErrorMessage && (
              <div className="form-error ml-32">
                {errors?.payErrorMessage}
              </div>
            )}
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
