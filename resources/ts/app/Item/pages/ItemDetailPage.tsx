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
    itemId: number | null; 
    name: string;
    status: string;
    initialcategoryId: number | undefined;
  };

  //const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.item_number);
  ///const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.itemNumberItem[0]);
  const domestic_url = createUrl('https://touratech.matrix.jp/ec/category-products/', `${state.category_name}/${state.id}/`);
  const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.item_number);
  //const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.itemNumberItem[0]);

  const [variItems, setVariItems] = useState([['', '', '', '', '', '', '']]);
  const [checkBock, setCheckBock] = useState({ color: '#EDF2F7', flag: false });
  const [backColor, setbackColor] = useState('#ffffff');
  const [variChangeItem, setVariChangeItem] = useState<string[][]>([]);
  const dispatch = useDispatch();
  const [onFocusItem, setonFocusItem] = useState<string[]>();
  //const [specialItem, setSpecialItem] = useState(state.specialSalesList);
  //const [imageItems, setImageItems] = useState(state.imageList);
  const location = useLocation<any>();
  const [categoryChangeFlag, setCategoryChangeFlag] = useState(false);
  const [supplierChangeFlag, setSupplierChangeFlag] = useState(false);
  const [variClickFlag, setvariClickFlag] = useState(false);
  const [variDelItem, setVariDelItem] = useState<string[][]>([]);
  const [backUpState, setBackUpState] = useState<any>();
  const [typeName, setTypeName] = useState('');
  const [typeNameBackColor, setTypeNameBackColor] = useState('#EDF2F7');
  const [changeCategoryIndex, setChangeCategoryIndex] = useState<number | null>(null);
  const [changeCategoryFlag, setChangeCategoryFlag] = useState(false);
  const [preCategoryId, setPreCategoryId] = useState<number | undefined>(undefined);

  console.log('state.categoryListAll');
  console.log(state.categoryListAll);

  // 初期値設定
  useEffect(() => {
    const isValid = Array.isArray(state.variItems) &&
      state.variItems.length > 0 &&
      state.variItems[0].length > 0;
    setVariItems(isValid ? state.variItems : [['new1', '', '', '', '', '', '']]);
    console.log('state.imageList');
    console.log(state.imageList);
    //setSpecialItem(state.specialSalesList);
    //const isImgValid = Array.isArray(state.imageList) &&
    //  state.imageList.length > 0 &&
    //  state.imageList[0].length > 0;
    //  console.log(`state.imageList：${state.imageList}`);
    if(!(state.imageList[0].length > 0)){
      setState(prev => ({
        ...prev,
        imageList: [['new1']],
      }));
    }

    if (!state.variItems || state.variItems.length === 0 || state.variItems.every(row => row.length === 0)) {
      console.log('こっち？');
      setState(prev => ({
        ...prev,
        variItems: [['new1', '', '', '', '', '', '']],
      }));
    }

    if (state.categoryList.length === 0) {
      const arr: Category = {
        combId: undefined,
        itemId: null,
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

    console.log('212行目state.variItems');
    console.log(state.variItems);

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
    setBackUpState(state);
  }, []);

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

    if (prevIdRef.current === undefined && state.id !== undefined) {
      setBackUpState(state);
    }

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

  console.log(state.imageList);

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
        itemId: null,
        categoryId: null,
        name: "",
        status: nextStatus,
        initialcategoryId: undefined,
      };

      const nextList = [...currentList, arr];
      return { ...prev, categoryList: nextList };
    });
  };

  console.log('changeCategoryIndex');
  console.log(changeCategoryIndex);
  console.log('state.categoryList');
  console.log(state.categoryList);

useEffect(() => {
  if (changeCategoryIndex !== null) {
    if (state.category_id !== undefined && state.category_name !== undefined) {
      // 同じカテゴリが選択されているかのチェック
      const flag = state.categoryList.some((item) => {
        if (item.categoryId == null) {
          return item.status !== "del" && !item.status?.includes("new");
        } else {
          if (item.status !== "del" && item.categoryId === state.category_id) {
            return true;
          }
          if (
            item.status === "del" &&
            item.combId != null &&
            item.categoryId === state.category_id
          ) {
            return false;
          }
          return false;
        }
      });

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
        const flag = state.categoryList.some((item) => {
          if (item.categoryId == null) {
            return item.status !== "del" && !item.status?.includes("new");
          } else {
            if (item.status !== "del" && item.categoryId === state.category_id) {
              return true;
            }
            if (
              item.status === "del" &&
              item.combId != null &&
              item.categoryId === state.category_id
            ) {
              return false;
            }
            return false;
          }
        });
      
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

  const onChangeCategory = (combId: any, status: string) => {
    //let preCategoryId = null;
    const filteredList = state.categoryList.filter(item => item.status !== "del");
    const matchIndex = filteredList.findIndex(item => {
      if (item.combId == null) {
        return item.status === status;
      }
      return item.combId === combId;
    });

    setChangeCategoryFlag(false);
    setChangeCategoryIndex(matchIndex);
    openItemClassDialog();
  };

  const categoryDelButton = (combId: any, status: string) => {
    setCategoryChangeFlag(true);
    setChangeCategoryFlag(false);
    const matchIndex = state.categoryList.findIndex(item => {
      // combId が null/undefined なら status で判定
      if (item.combId == null) {
        return item.status === status;
      }
      // それ以外は combId で判定
      return item.combId === combId;
    });

    setState(prev => {
      const target = prev.categoryList[matchIndex];

      // status が new の場合は削除
      if (target.status.includes("new")) {
        return {
          ...prev,
          categoryList: prev.categoryList.filter((_, index) => index !== matchIndex),
        };
      }

      // update / no update の場合は status を del に変更
      return {
        ...prev,
        categoryList: prev.categoryList.map((item, index) =>
          index === matchIndex
            ? { ...item, status: "del" }
            : item
        ),
      };
    });
    setChangeCategoryIndex(matchIndex);
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
        //const matrix: imageItem[] = [];
        //const formItem: any[] = [];
        //const form = new FormData();
        setCategoryChangeFlag(location.state.categoryChangeFlag);
        setSupplierChangeFlag(location.state.supplierChangeFlag);
        setState(prev => ({
          ...prev,
          imageList: location.state.imageItem
        }));
        //location.state.imageItem.forEach((item: any) => {
        //  const matchedRows = Array.isArray(location.state.preImageItem)
        //    ? location.state.preImageItem.filter((row: any) => row[0] === item[0])
        //    : [];
//
        //  if (matchedRows.length > 0 && item.length > matchedRows[0].length) {
        //    item.forEach((value: any, index: number) => {
        //      if (index > 0) {
        //        if (value instanceof File) {
        //          const imageItem: imageItem = {
        //            id: null,
        //            category_id: null,
        //            item_id: item[0],
        //            name: value.name,
        //            order_by: index + 1,
        //            url: value,
        //          };
        //          form.append('file', value);
        //          formItem.push(value);
        //          matrix.push(imageItem);
        //          console.log(matrix);
//
        //          //state.imageList = imageItem;
        //        }
        //      }
        //    });
        //  } else {
        //    
        //    setImageItems(location.state.imageItem);
        //  }
        //});
        //setImageItems(location.state.imageItem);

        console.log('location.state.imageItem');
        console.log(location.state.imageItem);
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

  console.log('state.imageList');
  console.log(state.imageList);
  console.log('state.variItems');
  console.log(state.variItems);

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

  //const edit: (url: string) => Promise<boolean> = async url => {
  //  dispatch(AppActions.request());
  //  console.log('1180行目');
  //  const res = await axios.put(`/api/${url}`, state);
  //  console.log('res');
  //  console.log(res);
  //  if (res.status === 200) {
  //    console.log('1109行目');
  //    dispatch(AppActions.success());
  //    if (res.data.success) {
  //      console.log('1112行目');
  //      return true;
  //    } else {
  //      setErrors(res.data.errors);
  //      return false;
  //    }
  //  } else {
  //    return false;
  //  }
  //};

  const history = useHistory();
  const backPage = () => history.push(`/item`);

  //const store: (url: string) => Promise<any> = async url => {
  //  dispatch(AppActions.request());
  //  const res = await axios.post(`/api/${url}`, state);
  //  console.log('res');
  //  console.log(res);
  //  if (res.status === 200) {
  //    dispatch(AppActions.success());
  //    if (res.data.success) {
  //      return res;
  //    } else {
  //      setErrors(res.data.errors);
  //      return false;
  //    }
  //  } else {
  //    dispatch(AppActions.failed('11データの保存に失敗しました。'));
  //  }
  //  return undefined;
  //}

  //const destroy: (url: string) => Promise<boolean> = async url => {
  //  dispatch(AppActions.request());
  //  const res = await axios.delete(url);
  //  if (res.status === 200) {
  //    dispatch(AppActions.success());
  //    if (res.data.success) {
  //      return true;
  //    } else {
  //      if (res.data.errMsg) {
  //        await appAlert(res.data.errMsg, 'error');
  //        return false;
  //      }
  //      //setErrors(res.data.errors);
  //    }
  //  } else {
  //    dispatch(AppActions.failed('データの削除に失敗しました。'));
  //  }
  //  return false;
  //};

  //const imageSave = async (variIndex: string | number | null): Promise<boolean> => {
  //  let res: any = {};
  //  let serverRes: any = {};
  //  let type: any = null;
  //  let fileName: string = '';
  //  let hasYoutube = false;
  //  // 画像編集があった場合
  //  if ((location.state !== undefined)) {
  //    if (location.state.imageItem !== undefined) {
  //      const filtered = location.state.imageItem.length > 1
  //        ? location.state.imageItem.filter((row: any[]) => row[0] === variIndex)
  //        : location.state.imageItem;
  //      // 画像保存の商品が複数ある場合
  //      // 新規追加
  //      if (((Array.isArray(filtered)) && (filtered.length > 0) && (filtered[0][1] !== undefined))) {
  //        const rows = filtered[0];
  //        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
  //          fileName = '';
  //          hasYoutube = false;
  //          //let hasYoutube = false; 
  //          // データ型の取得
  //          type = typeof rows[rowIndex];
  //          //データ型がナンバー以外で、stringの時は/images/を切り取ったファイル名、objectの場合はnameでファイル名を取得
  //          if (type !== 'number') fileName = type === 'string' ? rows[rowIndex].replace('/images/', '')
  //            : type === 'object' ? rows[rowIndex].name : '';
  //          const image: imageItem = { id: null, category_id: null, item_id: state.item_id, name: fileName, order_by: rowIndex, url: '' };
  //          // データ型がobjectの場合は新規ファイルの為、store処理
  //          if (type === 'object') {
  //            hasYoutube = rows[rowIndex].name.includes("youtube.com");
  //            res = await axios.post(`/api/item/image_store`, image);
  //            if (((res.data.success) && (hasYoutube === false))) {
  //              const formData = new FormData();
  //              const kaku = fileName.split('.').pop();
  //              if (kaku === 'mp4' || kaku === 'mov') {
  //                formData.append('video', rows[rowIndex]);
  //                formData.append('filename', rows[rowIndex].name); // 任意のファイル名
  //                serverRes = await axios.post('/api/item/video_server_store', formData, { headers: { 'Content-Type': 'multipart/form-data', } });
  //                console.log('画像保存1269行目serverRes');
  //                console.log(serverRes);
  //              } else {
  //                formData.append('image', rows[rowIndex]);
  //                formData.append('filename', rows[rowIndex].name); // 任意のファイル名
  //                serverRes = await axios.post('/api/item/image_server_store', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  //                console.log('画像保存1275行目serverRes');
  //                console.log(serverRes);
  //              }
  //            }
  //          } else if (type === 'string') {
  //            hasYoutube = rows[rowIndex].includes("youtube.com");
  //            // データ型がstringで"youtube.com"の文字がない場合は既存ファイルの為、updata処理
  //            // 既存ファイルかの確認（IDとファイル名）
  //            const matchedItems = state.preImageList.filter(item => (item[1] === rows[0]) && (item[2] === fileName)).sort((a, b) => b[3] - a[3]);
  //            if ((matchedItems.length > 0) && (hasYoutube === false)) {
  //              for (let index = 0; index < matchedItems.length; index++) {
  //                if (matchedItems[index][3] !== rowIndex) {
  //                  const image: imageItem = {
  //                    id: matchedItems[index][0], category_id: null, item_id: state.item_id, name: fileName,
  //                    order_by: rowIndex, url: ''
  //                  };
  //                  res = await axios.put(`/api/item/image_update/${matchedItems[index][0]}`, image);
  //                  console.log('画像保存1292行目res');
  //                  console.log(res);
  //                  if (res.data.success === 200) {
  //                    serverRes.status = 201;
  //                  }
  //                }
  //              }
  //            } else if ((matchedItems.length < 1) && (hasYoutube)) {
  //              // データベースに情報がなく、youtubeだったら新規登録
  //              const image: imageItem = { id: null, category_id: null, item_id: state.item_id, name: fileName, order_by: rowIndex, url: '' };
  //              //const hasYoutube = rows[rowIndex].includes("youtube.com");
  //              if (hasYoutube) {
  //                res = await axios.post(`/api/item/image_store`, image);
  //                console.log('画像保存1305行目res');
  //                console.log(res);
  //                if (res.data.success) {
  //                  serverRes.status = 201;
  //                }
  //              }
  //            }
  //          } else {
  //            serverRes.status = 201;
  //          }
  //        }
  //        // 編集
  //      } else if (((Array.isArray(filtered)) && (filtered.length > 0) && (filtered[0][1] !== undefined))) {
  //        const rows = filtered[0];
  //        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
  //          fileName = '';
  //          //hasYoutube = false;
  //          // データ型の取得
  //          type = typeof rows[rowIndex];
  //          //データ型がナンバー以外で、stringの時は/images/を切り取ったファイル名、objectの場合はnameでファイル名を取得
  //          if (type !== 'number') fileName = type === 'string' ? rows[rowIndex].replace('/images/', '')
  //            : type === 'object' ? rows[rowIndex].name : '';
  //          const image: imageItem = { id: null, category_id: null, item_id: state.item_id, name: fileName, order_by: rowIndex, url: '' };
  //          // データ型がobjectの場合は新規ファイルの為、store処理
  //          if (type === 'object') {
  //            hasYoutube = rows[rowIndex].name.includes("youtube.com");
  //            res = await axios.post(`/api/item/image_store`, image);
  //            console.log('画像保存1332行目res');
  //            console.log(res);
  //            if (((res.data.success) && (hasYoutube === false))) {
  //              const formData = new FormData();
  //              const kaku = fileName.split('.').pop();
  //              if (kaku === 'mp4' || kaku === 'mov') {
  //                formData.append('video', rows[rowIndex]);
  //                formData.append('filename', rows[rowIndex].name); // 任意のファイル名
  //                serverRes = await axios.post('/api/item/video_server_store', formData, { headers: { 'Content-Type': 'multipart/form-data', } });
  //                console.log('画像保存1341行目serverRes');
  //                console.log(serverRes);
  //              } else {
  //                formData.append('image', rows[rowIndex]);
  //                formData.append('filename', rows[rowIndex].name); // 任意のファイル名
  //                serverRes = await axios.post('/api/item/image_server_store', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  //                console.log('画像保存1347行目serverRes');
  //                console.log(serverRes);
  //              }
  //            }
  //            // データ型がstringの場合は既存ファイルの為、updata処理
  //          } else if (type === 'string') {
  //            hasYoutube = rows[rowIndex].includes("youtube.com");
  //            // 既存ファイルかの確認（IDとファイル名）
  //            const matchedItems = state.preImageList.filter(item => (item[1] === rows[0]) && (item[2] === fileName)).sort((a, b) => b[3] - a[3]);
  //            if ((matchedItems.length > 0) && (hasYoutube === false)) {
  //              for (let index = 0; index < matchedItems.length; index++) {
  //                if (matchedItems[index][3] !== rowIndex) {
  //                  const image: imageItem = {
  //                    id: matchedItems[index][0], category_id: null, item_id: state.item_id, name: fileName,
  //                    order_by: rowIndex, url: ''
  //                  };
  //                  res = await axios.put(`/api/item/image_update/${matchedItems[index][0]}`, image);
  //                  console.log('画像保存1364行目res');
  //                  console.log(res);
  //                  if (res.data.success === 200) {
  //                    serverRes.status = 201;
  //                  }
  //                }
  //              }
  //            } else if ((matchedItems.length < 1) && (hasYoutube)) {
  //              // データベースに情報がなく、youtubeだったら新規登録
  //              const image: imageItem = { id: null, category_id: null, item_id: state.item_id, name: fileName, order_by: rowIndex, url: '' };
  //              hasYoutube = rows[rowIndex].includes("youtube.com");
  //              if (hasYoutube) {
  //                res = await axios.post(`/api/item/image_store`, image);
  //                console.log('画像保存1377行目res');
  //                console.log(res);
  //                if (res.data.success === 200) {
  //                  serverRes.status = 201;
  //                }
  //              }
  //            }
  //          } else {
  //            serverRes.status = 201;
  //          }
  //        }
  //      } else {
  //        const hasNew = typeof variIndex === "string" && variIndex?.toLowerCase().includes("new");
  //        if (hasNew) serverRes.status = 201;
  //      }
  //    }
//
  //    // 削除されたデータあった場合
  //    if (location.state.delimageItem.length !== 0) {
  //      for (const delItem of location.state.delimageItem ?? []) {
  //        hasYoutube = false;
  //        hasYoutube = delItem[1].includes("youtube.com");
  //        let fileName = '';
  //        if (!hasYoutube) fileName = delItem[1].replace('/images/', '');
  //        else fileName = delItem[1];
  //        const matchedItems = state.preImageList.filter(item => ((item[1] === delItem[0]) && (item[2] === fileName)));
  //        if (matchedItems.length > 0 && matchedItems[0][0] !== undefined) {
  //          await destroy(`/api/item/image_delete/${Number(matchedItems[0][0])}`);
  //        }
  //      }
  //    }
  //  } else {
  //    // 処理なしなのでtrue
  //    serverRes.status = 201;
  //  }
  //  return serverRes.status === 201 || serverRes.status === 200;
  //}

  //const specialSaleSave = async (url: string, curd: string): Promise<{ success: boolean; id?: number; }> => {
  //  let specialSaleSaveFlag: boolean = false;
//
  //  if ((state.start_at !== null) && (state.start_at !== '') && (state.start_at !== undefined)) {
  //    state.is_sales_members_only = state.is_sales_members_only !== null ? state.is_sales_members_only : false;
  //    state.special_sale_id = state.specialSalesList[0]?.special_sale_id ?? undefined;
//
  //    if (curd === 'store') {
  //      specialSaleSaveFlag = await store(url);
  //    } else {
  //      if ((state.specialSalesDelFlag === false) || (state.specialSalesDelFlag === undefined)) {
  //        if ((state.special_sale_id !== null) && (state.special_sale_id !== undefined)) {
  //          state.is_sales_members_only = specialItem[0].is_sales_members_only !== state.is_sales_members_only ?
  //            state.is_sales_members_only != null ? false : true : specialItem[0].is_sales_members_only != null ? false : true;
  //          state.start_at = specialItem[0].start_at !== state.start_at ?
  //            state.start_at : specialItem[0].start_at;
  //          state.end_at = specialItem[0].end_at !== state.end_at ?
  //            state.end_at : specialItem[0].end_at;
  //          state.special_sale_price = specialItem[0].special_sale_price !== state.special_sale_price ?
  //            state.special_sale_price : specialItem[0].special_sale_price;
  //          state.refund_rate = specialItem[0].refund_rate !== state.refund_rate ?
  //            state.refund_rate : specialItem[0].refund_rate;
  //          state.item_id = state.id;
//
  //          specialSaleSaveFlag = await edit(`item/special_sale_update/${state.special_sale_id}`); // ✅ ここで await が使える！
  //        } else {
  //          specialSaleSaveFlag = await store("item/special_sale_store");
  //        }
  //      }
  //    }
  //  } else if (state.specialSalesList[0] !== undefined) {
  //    if ((state.specialSalesList[0].special_sale_id !== null) && (state.specialSalesList[0].special_sale_id !== '') && (state.specialSalesList[0].special_sale_id !== undefined)) {
  //      state.special_sale_id = state.specialSalesList[0].special_sale_id;
  //      if (state.special_sale_id !== null) {
  //        specialSaleSaveFlag = await destroy(`/api/item/special_sale_delete/${Number(state.special_sale_id)}`);
  //      } else {
  //        return { success: true, id: state.special_sale_id };
  //      }
  //    } else {
  //      return { success: true, id: state.special_sale_id };
  //    }
  //  } else {
  //    return { success: true, id: state.special_sale_id };
  //  }
  //  return { success: specialSaleSaveFlag, id: state.special_sale_id };
  //}
//
  //const categorySave = async (url: string, curd: string): Promise<{ success: boolean; id?: number; }> => {
  //  let res: any = {};
  //  if (curd === 'store') {
  //    res = await store(url);
  //  }
//
  //  return { success: res.data.success, id: res.data.id };
  //}

  // 取扱説明書設定の保存
  //const documentSave = async (variIndex: string | number | null): Promise<{ success: boolean; id?: number; }> => {
  //  let res: any = {};
  //  let docRes: any = {};
  //  let isImage = false;
  //  let isPdf = false;
//
  //  if (state.file_name) {
  //    // pdfかの確認
  //    isPdf = /\.pdf$/i.test(state.file_name);
  //    // 画像かの確認
  //    isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(state.file_name);
  //  }
//
  //  if ((backUpState.type_status !== state.type_status) || (backUpState.type_name !== state.type_name) ||
  //    (backUpState.file_name !== state.file_name)) {
  //    // 拡張子が pdf でも画像でもない場合 → true
  //    if (!isPdf && !isImage) {
  //      return { success: true, id: state.document_id };
  //    }
//
  //    if ((state.document_id === null) || (state.document_id === undefined)) {
  //      if (state.type_status !== 0) res = await store('item/document_store');
  //      if (res.data.success) {
  //        if (state.pdf) {
  //          const formData = new FormData();
  //          if (isPdf) {
  //            formData.append("pdf", state.pdf);          // ← Laravel側で $request->file('pdf') で受け取れる
  //            formData.append("filename", state.file_name ?? "");
  //            await axios.post("/api/item/document_server_store", formData, { headers: { "Content-Type": "multipart/form-data" } });
  //          } else if (isImage) {
  //            formData.append('image', state.pdf);
  //            formData.append('filename', state.file_name ?? ""); // 任意のファイル名
  //            axios.post('/api/item/document_images_server_store', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  //          }
  //        }
  //      }
  //    } else {
  //      if (state.type_status !== 0) {
  //        let flag = (backUpState.type_status !== state.type_status) || (backUpState.type_name !== state.type_name) ||
  //          (backUpState.file_name !== state.file_name);
  //        if (flag) {
  //          const matchedRows = state.documentFileList?.filter(item => item.item_id === variIndex) ?? [];
  //          docRes = await edit(`item/document_update/${matchedRows[0].id}`);
  //        }
  //      } else {
  //        const matchedRows = state.documentFileList?.filter(item => item.item_id === variIndex) ?? [];
  //        // 削除処理
  //        await destroy(`/api/item/document_delete/${matchedRows[0].id}`);
  //      }
  //    }
  //  } else {
  //    docRes = true;
  //  }
//
  //  return { success: docRes, id: state.document_id };
  //}
//
  //const itemSave = async (url: string, curd: string): Promise<{ success: boolean; id?: number; }> => {
  //  let res: any = {};
  //  if (curd === 'store') {
  //    res = await store(url);
  //  }
  //  return { success: res.data.success, id: res.data.id };
  //}

  // 保存処理
  //const storeSavaItem: (variIndex: string | number | null, crud: string) => Promise<boolean> = async (variIndex) => {
  //  //let reFlag = false;
  //  let categorySaveRes: { success: boolean; id?: number } = { success: false };
  //  let specilSaleSaveRes: { success: boolean; id?: number } = { success: false };
  //  let documentSaveRes: { success: boolean; id?: number } = { success: false };
  //  let imageSaveRes: boolean = false;
//
  //  // 商品マスタ保存
  //  console.log('商品保存');
  //  const itemSaveRes = await itemSave("item/store", 'store');
  //  console.log('itemSaveRes');
  //  console.log(itemSaveRes);
  //  // 関連テーブルの保存
  //  if (itemSaveRes.success) {
  //    state.item_id = itemSaveRes.id;
//
  //    // カテゴリーの保存
  //    for (const item of state.categoryList) {
  //      console.log('item');
  //      console.log(item);
  //      if (item.status?.includes("new")) {
  //        console.log("newを含む行:", item);
  //        state.category_id = item.categoryId;
  //        state.category_name = item.name;
  //        categorySaveRes = await categorySave("item/category_store", "store");
  //        console.log('categorySaveRes');
  //        console.log(categorySaveRes);
  //      }else{
  //        state.category_id = item.categoryId;
  //        state.category_name = item.name;
  //        categorySaveRes = await categorySave("item/category_store", "store");
  //      }
  //    }
//
  //    //categorySaveRes = await categorySave("item/category_store", 'store');
  //    // カテゴリーの保存に成功
  //    if (categorySaveRes.success) {
  //      // 特売設定の保存
  //      specilSaleSaveRes = await specialSaleSave("item/special_sale_store", 'store');
  //    } else {
  //      // 商品マスタのロールバック処理
  //      //await destroy(`/api/item/delete/${state.item_id}`);
  //      return false;
  //    }
//
  //    // 特売設定の保存に成功
  //    if (specilSaleSaveRes.success) {
  //      // 特売保存成功時
  //      // ファイルの保存
  //      documentSaveRes = await documentSave(null);
  //      //imageSaveRes = await imageSave(variIndex);
  //    } else {
  //      return false;
  //    }
//
  //    // 取扱説明書設定の保存に成功
  //    if (documentSaveRes.success) {
  //      // 特売保存成功時
//
  //      // 画像の保存
  //      imageSaveRes = await imageSave(variIndex);
  //    } else {
  //      return false;
  //    }
//
  //    // 画像の保存に失敗した時
  //    if (!imageSaveRes) {
  //      return false;
  //    }
//
  //    return categorySaveRes.success && specilSaleSaveRes.success && imageSaveRes;
  //  } else {
  //    return false;
  //  }
  //}

  console.log('backUpState');
  console.log(backUpState);

  //const upDateSaveItem: (variIndex: string | number | null, pattern: string) => Promise<boolean> = async (variIndex, pattern) => {
  //  let reFlag = false;
  //  let itemSaveFlag = false;
  //  let imgSaveFlag = false;
  //  let specialSaleSaveFlag = false;
  //  let categoryCombSaveFlag = false;
  //  let documentSaveFlag = false;
//
  //  console.log(`pattern：${pattern}`);
//
  //  if (pattern === '2') {
  //    itemSaveFlag = await edit(`item/update/${variIndex}`);
  //    if (!itemSaveFlag) return false;
//
  //    imgSaveFlag = await imageSave(variIndex);
  //    if (!imgSaveFlag) return false;
//
  //    specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
  //    if (!specialSaleSaveFlag) return false;
//
  //    documentSaveFlag = (await documentSave(variIndex)).success;
//
  //    reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag;
//
  //  } else if (pattern === '3') {
  //    itemSaveFlag = await edit(`item/update/${state.id}`);
  //    console.log('1666行目itemSaveFlag');
  //    console.log(itemSaveFlag);
  //    if (!itemSaveFlag) return false;
//
  //    imgSaveFlag = await imageSave(Number(state.id));
  //    console.log('1671行目imgSaveFlag');
  //    console.log(imgSaveFlag);
  //    if (!imgSaveFlag) return false;
//
  //    specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
  //    console.log('specialSaleSaveFlag');
  //    console.log(specialSaleSaveFlag);
  //    if (!specialSaleSaveFlag) return false;
//
  //    documentSaveFlag = (await documentSave(variIndex)).success;
  //    console.log('documentSaveFlag');
  //    console.log(documentSaveFlag);
  //    if (!documentSaveFlag) return false;
//
  //    reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag && documentSaveFlag;
//
  //  } else if (pattern === '4') {
  //    state.item_id = Number(variIndex);
  //    itemSaveFlag = await edit(`item/update/${Number(variIndex)}`);
  //    if (!itemSaveFlag) return false;
//
  //    imgSaveFlag = await imageSave(Number(state.id));
  //    if (!imgSaveFlag) return false;
//
  //    specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
  //    if (!specialSaleSaveFlag) return false;
//
  //    documentSaveFlag = (await documentSave(variIndex)).success;
  //    if (!documentSaveFlag) return false;
//
  //    reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag  && documentSaveFlag;
//
  //  } else if (pattern === '5') {
  //    state.item_id = Number(variIndex);
  //    itemSaveFlag = await edit(`item/update/${Number(variIndex)}`);
  //    if (!itemSaveFlag) return false;
//
  //    imgSaveFlag = await imageSave(Number(state.id));
  //    if (!imgSaveFlag) return false;
//
  //    specialSaleSaveFlag = (await specialSaleSave('', 'upDate')).success;
  //    if (!specialSaleSaveFlag) return false;
//
  //    documentSaveFlag = (await documentSave(variIndex)).success;
  //    if (!documentSaveFlag) return false;
//
  //    reFlag = itemSaveFlag && imgSaveFlag && specialSaleSaveFlag && documentSaveFlag;
  //  }
//
  //  if (itemSaveFlag) {
  //    console.log('categoryChangeFlag');
  //    console.log(categoryChangeFlag);
  //    console.log('state.item_id');
  //    console.log(state.item_id);
  //    // ① newX かつ categoryId == null のものを削除
  //    const cleanedList = state.categoryList.filter(
  //      (item) => !(item.categoryId == null && /^new\d+$/.test(item.status))
  //    );
//
  //    for (const item of cleanedList) {
  //      console.log('state.categoryList');
  //      console.log(state.categoryList);
  //      const matchObj = state.categoryListAll.find(obj => {
  //        const key = Object.keys(obj)[0];
  //        return Number(key) === state.item_id;
  //      });
  //      const matchRows = matchObj ? matchObj[Number(state.item_id)] : [];
  //      const targetRow = matchRows.find((row:any) => row.categoryId === item.initialcategoryId);
//
  //      matchRows.find((row:any) => console.log(row.categoryId));
//
  //      console.log('matchRows');
  //      console.log(matchRows);
//
  //      console.log('targetRow');
  //      console.log(targetRow);
//
  //      if(categoryChangeFlag){
  //        if(matchRows){
  //          if (item.status?.includes("new")) {
  //            console.log('新規追加');
  //            state.category_id = item.categoryId;
  //            state.category_name = item.name;
  //            categoryCombSaveFlag = (await categorySave("item/category_store", "store")).success;
  //            if (!categoryCombSaveFlag) return false;
  //          }else if (item.status === 'del'){
  //            console.log('削除');
  //            categoryCombSaveFlag = await destroy(`/api/item/category_delete/${item.combId}`);
  //            if (!categoryCombSaveFlag) return false;
  //          }else{
  //            console.log('バリエーションが追加された時');
  //            // バリエーションが追加された時
  //            //categoryCombSaveFlag = true;
  //            state.category_id = item.categoryId;
  //            state.category_name = item.name;
  //            categoryCombSaveFlag = (await categorySave("item/category_store", "store")).success;
  //          }
  //        }else{
  //          if (item.status === 'update') {
  //            console.log('編集');
  //            setState(prev => ({
  //              ...prev,
  //              combination_id: targetRow.combId,
  //              item_id: state.item_id,
  //              category_id: item.categoryId,
  //              category_name: item.name,
  //            }));
  //            state.combination_id = targetRow.combId;
  //            state.category_id = item.categoryId;
  //            state.category_name = item.name;
  //            categoryCombSaveFlag = await edit(`item/category_edit/${targetRow.combId}`);
  //            if (!categoryCombSaveFlag) return false;
  //          } else if (item.status === 'del') {
  //            console.log('削除');
  //            categoryCombSaveFlag = await destroy(`/api/item/category_delete/${item.combId}`);
  //            if (!categoryCombSaveFlag) return false;
  //          } else if (item.status === 'del') {
  //            return true;
  //          }
  //        }
  //      }else{
  //        categoryCombSaveFlag = true;
  //      }
  //    }
  //  }
//
  //  console.log('itemSaveFlag');
  //  console.log(itemSaveFlag);
  //  console.log('imgSaveFlag');
  //  console.log(imgSaveFlag);
  //  console.log('specialSaleSaveFlag');
  //  console.log(specialSaleSaveFlag);
  //  console.log('documentSaveFlag');
  //  console.log(documentSaveFlag);
  //  console.log('categoryCombSaveFlag');
  //  console.log(categoryCombSaveFlag);
//
  //  return reFlag && categoryCombSaveFlag;
  //}

  //const delFanc: () => Promise<boolean> = async () => {
  //  let delFlag = false;
  //  if (Array.isArray(variDelItem) && variDelItem.length > 0) {
  //    state.is_sell = false;
  //    for (let i = variDelItem.length - 1; i >= 0; i--) {
  //      const id = Number(variDelItem[i][0]);
  //      delFlag = await destroy(`/api/item/delete/${id}`);
  //      variDelItem.splice(i, 1); // 戻り値に関係なく削除
  //    }
  //  } else {
  //    delFlag = true;
  //  }
  //  return delFlag;
  //}

  /**
   * 商品マスタへの新規登録処理を行う。
   * 
   * @param state - 商品情報を保持するオブジェクト (Item型)
   * @returns boolean - true：登録成功、false：登録失敗
   */
  const storeItem = async (payload: ItemPayload): Promise<boolean> => {
    try {
      dispatch(AppActions.request());

      const res = await axios.post('/api/item/store_transaction', payload);

      if (res.status === 200) {
        dispatch(AppActions.success());
        if (res.data.success) {
          return true;
        } else {
          setErrors(res.data.errors);
          return false;
        }
      } else {
        dispatch(AppActions.failed('データの保存に失敗しました。'));
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
        dispatch(AppActions.failed('データの保存に失敗しました。'));
        return false;
      }
    } catch (error) {
      dispatch(AppActions.failed('通信エラーが発生しました。'));
      return false;
    }
  };

  /**
   * バリエーションの配列を整形するユーティリティ関数。
   * 
   * @param variChangeItem 
   * @returns 
   */
  const buildVariations = (variChangeItem: string[][]) => {
    return variChangeItem.map(value => ({
      id: value[0] ? Number(value[0]) : null,
      variations1: value[1],
      variations2: value[2],
      variations3: value[3],
      variations4: value[4],
      item_number: value[5],
      sales_price: Number(value[6]),
    }));
  };

  /**
   * 複数ファイルを一括送信して画像アップロード
   * 
   * @param files 
   * @returns 
   */
const uploadImages = async (imageList: any[][] | null): Promise<string[]> => {
  // null や undefined の場合は即座に空配列を返す
  if (!imageList || imageList.length === 0) {
    return [];
  }

  const formData = new FormData();
  let hasImage = false;

  imageList.forEach((variation) => {
    // variation が null/undefined の可能性を考慮
    if (!variation) return;

    variation.slice(2).forEach((image) => {
      if (image instanceof File) {
        formData.append("images[]", image);
        hasImage = true;
      }
    });
  });

  // 画像が一つもなければ空配列を返す
  if (!hasImage) {
    return [];
  }

  try {
    const res = await axios.post("/api/item/store_image_transaction", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.paths;
  } catch (error: any) {
    throw new Error("画像アップロードに失敗");
  }
};

  /**
   * 商品マスタ関連の新規登録をリクエストする。
   */
  const handleNewItem = async () => {
    const variations = buildVariations(variChangeItem);
    const payload: ItemPayload = { ...state, variations };
    const success = await storeItem(payload);

    if (success) {
      // 画像アップロード
      //await uploadImages(imageItems);
      await uploadImages(state.imageList);

      await appAlert('新規保存しました。');
      backPage();
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
  };

  /**
   * 商品マスタ関連の編集登録をリクエストする。
   */
  const handleEditItem = async () => {
    const variations = buildVariations(variChangeItem);
    const payload: ItemPayload = { ...state, variations };
    const success = await updateItem(payload);

    if (success) {
      // 画像アップロード
      //await uploadImages(imageItems);
      await uploadImages(state.imageList);

      await appAlert('編集保存しました。');
      backPage();
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
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
    console.log(validationErrors);
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
      return;

      //let updateSaveFlag = false;
      //let storeSaveFlag = false;
      //// カテゴリーと仕入先に変更がない場合
      //if (((categoryChangeFlag === false) && (supplierChangeFlag === false))) {
      //  console.log('1962行目');
      //  // バリデーションの変更が複数ある場合
      //  if (variChangeItem.length > 0) {
      //    console.log('1965行目');
      //    for (const value of variChangeItem) {
      //      // すでに登録されているかの確認
      //      if (state.codeList.find(e => e.id == value[0])) {
      //        state.item_id = Number(value[0]);
      //        state.id = Number(value[0]);
      //        state.variations1 = value[1];
      //        state.variations2 = value[2];
      //        state.variations3 = value[3];
      //        state.variations4 = value[4];
      //        state.item_number = value[5];
      //        state.sales_price = Number(value[6]);
//
      //        //if(variChangeItem.length === 1)
      //        storeSaveFlag = true;
      //        updateSaveFlag = await upDateSaveItem(Number(value[0]), '2');
      //        if (!updateSaveFlag) {
      //          break;
      //        }
      //        // バリデーションの新規登録
      //      } else {
      //        state.id = undefined;
      //        state.variations1 = value[1];
      //        state.variations2 = value[2];
      //        state.variations3 = value[3];
      //        state.variations4 = value[4];
      //        state.item_number = value[5];
      //        state.sales_price = Number(value[6]);
      //        updateSaveFlag = true;
      //        storeSaveFlag = await storeSavaItem(value[0], 'store');
      //        if (!storeSaveFlag) {
      //          break;
      //        }
      //      }
      //    }
      //    if (updateSaveFlag && storeSaveFlag) {
      //      console.log('2001行目');
      //      console.log(updateSaveFlag);
      //      console.log(storeSaveFlag);
      //      if (await delFanc()) {
      //        await appAlert('編集保存しました。');
      //        backPage();
      //      }
      //    } else {
      //      dispatch(AppActions.failed('5データの保存に失敗しました。'));
      //    }
      //    // バリデーションに変更がない場合
      //  } else {
      //    if (state.variItems.length === 1) {
      //      let flag = false;
      //      for (const value of state.variItems) {
      //        // すでに登録されているかの確認
      //        if (state.codeList.find(e => e.id === value[0])) {
      //          const matchedRow = state.codeList.find(item => item.id === value[0]);
      //          state.id = Number(value[0]);
      //          state.item_id = Number(value[0]);
//
      //          state.variations1 = matchedRow.variations1;
      //          state.variations2 = matchedRow.variations2;
      //          state.variations3 = matchedRow.variations3;
      //          state.variations4 = matchedRow.variations4;
      //          state.item_number = matchedRow.item_number;
      //          //state.sales_price = matchedRow.sales_price;
      //          //state.special_sale_id = matchedRow.special_sale_id;
      //        }
      //        flag = await upDateSaveItem(Number(state.id), '3')
      //      }
//
      //      if (flag) {
      //        if (await delFanc()) {
      //          await appAlert('編集保存しました。');
      //          backPage();
      //        }
      //      } else {
      //        dispatch(AppActions.failed('6データの保存に失敗しました。'));
      //      }
      //    } else if (state.variItems.length > 0) {
      //      let flag = false;
      //      for (const value of state.variItems) {
      //        // すでに登録されているかの確認
      //        if (state.codeList.find(e => e.id === value[0])) {
      //          const matchedRow = state.codeList.find(item => item.id === value[0]);
      //          //const combId = Array.isArray(state.combIdList)
      //          //  ? state.combIdList.find(item => item?.item_id === value[0])
      //          //  : undefined;
      //          //if (combId !== undefined) {
      //          //  state.combination_id = combId.id;
      //          //} else {
      //          //  state.combination_id = undefined;
      //          //}
//
      //          state.id = Number(value[0]);
      //          state.item_id = Number(value[0]);
//
      //          state.variations1 = matchedRow.variations1;
      //          state.variations2 = matchedRow.variations2;
      //          state.variations3 = matchedRow.variations3;
      //          state.variations4 = matchedRow.variations4;
      //          state.item_number = matchedRow.item_number;
      //          state.sales_price = matchedRow.sales_price;
      //          state.special_sale_id = matchedRow.special_sale_id;
      //        }
      //        flag = await upDateSaveItem(Number(value[0]), '3')
      //      }
//
      //      if (flag) {
      //        if (await delFanc()) {
      //          await appAlert('編集保存しました。');
      //          backPage();
      //        }
      //      } else {
      //        dispatch(AppActions.failed('7データの保存に失敗しました。'));
      //      }
      //    } else {
      //      if (await upDateSaveItem(Number(state.id), '3')) {
      //        if (await delFanc()) {
      //          await appAlert('編集保存しました。');
      //          backPage();
      //        }
      //      } else {
      //        dispatch(AppActions.failed('8データの保存に失敗しました。'));
      //      }
      //    }
      //  }
      //  // カテゴリーか仕入先に変更があった場合
      //} else {
      //  console.log('2098行目');
      //  // バリエーションが複数変更されている場合
      //  if (variChangeItem.length > 0) {
      //    // 現在編集中の商品ID
      //    const editId = state.id;
      //    //const category_id = state.category_id;
      //    if (state.codeList.find(e => e.id === state.id)) {
      //      const changeItem = variChangeItem.find(item => Number(item[0]) === state.id);
      //      if (changeItem) {
      //        state.id = Number(changeItem[0]);
      //        state.item_id = Number(changeItem[0]);
      //        //state.category_id = category_id;
//
      //        state.variations1 = changeItem[1];
      //        state.variations2 = changeItem[2];
      //        state.variations3 = changeItem[3];
      //        state.variations4 = changeItem[4];
      //        state.item_number = changeItem[5];
      //        state.sales_price = Number(changeItem[6]);
      //      }
      //      updateSaveFlag = await upDateSaveItem(Number(state.item_id), '4');
      //    } else {
      //      // 処理なし
      //    }
//
      //    const processedItemNumbers = new Set<string | number>();
//
      //    for (const value of state.variItems) {
      //      if (state.codeList.find(e => e.id === value[0])) {
      //        if (editId !== Number(value[0])) {
      //          const changeItem = variChangeItem.find(item => item[0] === value[0]);
      //          const matchedRow = state.codeList.find(item => item.id === value[0]);
      //        
      //          // item_number を決定
      //          const itemNumber = changeItem ? changeItem[5] : matchedRow.item_number;
      //        
      //          // ★ すでに処理済みならスキップ
      //          if (processedItemNumbers.has(itemNumber)) {
      //            console.log("重複 item_number をスキップ:", itemNumber);
      //            continue;
      //          }
      //          processedItemNumbers.add(itemNumber);
      //        
      //          if (changeItem) {
      //            state.id = Number(changeItem[0]);
      //            state.item_id = Number(changeItem[0]);
      //          
      //            state.variations1 = changeItem[1];
      //            state.variations2 = changeItem[2];
      //            state.variations3 = changeItem[3];
      //            state.variations4 = changeItem[4];
      //            state.item_number = changeItem[5];
      //            state.sales_price = Number(changeItem[6]);
      //          } else {
      //            state.variations1 = matchedRow.variations1;
      //            state.variations2 = matchedRow.variations2;
      //            state.variations3 = matchedRow.variations3;
      //            state.variations4 = matchedRow.variations4;
      //            state.item_number = matchedRow.item_number;
      //            state.sales_price = matchedRow.sales_price;
      //          }
      //        
      //          if (supplierChangeFlag === false) state.supplier_id = matchedRow.supplier_id;
      //          updateSaveFlag = await upDateSaveItem(Number(value[0]), "4");
      //        }
      //      } else {
      //        const changeItem = variChangeItem.find(item => item[0] === value[0]);
      //      
      //        if (changeItem) {
      //          const itemNumber = changeItem[5];
      //        
      //          // ★ すでに処理済みならスキップ
      //          if (processedItemNumbers.has(itemNumber)) {
      //            console.log("重複 item_number をスキップ:", itemNumber);
      //            continue;
      //          }
      //          processedItemNumbers.add(itemNumber);
      //        
      //          state.id = undefined;
      //          state.variations1 = changeItem[1];
      //          state.variations2 = changeItem[2];
      //          state.variations3 = changeItem[3];
      //          state.variations4 = changeItem[4];
      //          state.item_number = changeItem[5];
      //          state.sales_price = Number(changeItem[6]);
      //        
      //          storeSaveFlag = await storeSavaItem(value[0], "store");
      //        }
      //      }
      //    }
//
      //    // 既に処理した item_number を記録するセット
      //    const proItemNumbers = new Set<string | number>();
      //            
      //    for (const value of state.variItems) {
      //      if (state.codeList.find(e => e.id === value[0])) {
      //        if (editId !== Number(value[0])) {
      //          const changeItem = variChangeItem.find(item => item[0] === value[0]);
      //          const matchedRow = state.codeList.find(item => item.id === value[0]);
      //        
      //          // item_number を決定
      //          const itemNumber = changeItem ? changeItem[5] : matchedRow.item_number;
      //        
      //          // ★ すでに処理済みならスキップ
      //          if (proItemNumbers.has(itemNumber)) {
      //            console.log("重複 item_number をスキップ:", itemNumber);
      //            continue;
      //          }
      //          proItemNumbers.add(itemNumber);
      //        
      //          if (changeItem) {
      //            state.id = Number(changeItem[0]);
      //            state.item_id = Number(changeItem[0]);
      //          
      //            state.variations1 = changeItem[1];
      //            state.variations2 = changeItem[2];
      //            state.variations3 = changeItem[3];
      //            state.variations4 = changeItem[4];
      //            state.item_number = changeItem[5];
      //            state.sales_price = Number(changeItem[6]);
      //          } else {
      //            state.variations1 = matchedRow.variations1;
      //            state.variations2 = matchedRow.variations2;
      //            state.variations3 = matchedRow.variations3;
      //            state.variations4 = matchedRow.variations4;
      //            state.item_number = matchedRow.item_number;
      //            state.sales_price = matchedRow.sales_price;
      //          }
      //        
      //          if (supplierChangeFlag === false) state.supplier_id = matchedRow.supplier_id;
      //          updateSaveFlag = await upDateSaveItem(Number(value[0]), "4");
      //        }
      //      } else {
      //        const changeItem = variChangeItem.find(item => item[0] === value[0]);
      //      
      //        if (changeItem) {
      //          const itemNumber = changeItem[5];
      //        
      //          // ★ すでに処理済みならスキップ
      //          if (proItemNumbers.has(itemNumber)) {
      //            console.log("重複 item_number をスキップ:", itemNumber);
      //            continue;
      //          }
      //          proItemNumbers.add(itemNumber);
      //        
      //          state.id = undefined;
      //          state.variations1 = changeItem[1];
      //          state.variations2 = changeItem[2];
      //          state.variations3 = changeItem[3];
      //          state.variations4 = changeItem[4];
      //          state.item_number = changeItem[5];
      //          state.sales_price = Number(changeItem[6]);
      //        
      //          storeSaveFlag = await storeSavaItem(value[0], "store");
      //        }
      //      }
      //    }
//
      //    console.log();
      //    if (updateSaveFlag && storeSaveFlag) {
      //      if (await delFanc()) {
      //        await appAlert('編集保存しました。');
      //        backPage();
      //      }
      //    } else {
      //      dispatch(AppActions.failed('9データの保存に失敗しました。'));
      //    }
      //    // バリデーションに変更がない場合(バリエーションが複数の場合、カテゴリーと仕入先は共通の為、一括変更)
      //  } else {
      //    if (state.variItems.length > 0) {
      //      for (const value of state.variItems) {
      //        // すでに登録されているかの確認
      //        if (state.codeList.find(e => e.id === value[0])) {
      //          const matchedRow = state.codeList.find(item => item.id === value[0]);
//
      //          state.id = Number(value[0]);
      //          state.item_id = Number(value[0]);
      //          state.variations1 = matchedRow.variations1;
      //          state.variations2 = matchedRow.variations2;
      //          state.variations3 = matchedRow.variations3;
      //          state.variations4 = matchedRow.variations4;
      //          state.item_number = matchedRow.item_number;
      //          state.sales_price = matchedRow.sales_price;
//
      //          if (supplierChangeFlag === false) state.supplier_id = matchedRow.supplier_id;
      //          updateSaveFlag = await upDateSaveItem(Number(value[0]), '5');
      //        }
      //      }
//
      //      if (updateSaveFlag) {
      //        if (await delFanc()) {
      //          await appAlert('編集保存しました。');
      //          backPage();
      //        } else {
      //          // 処理なし
      //        }
      //      } else {
      //        dispatch(AppActions.failed('10データの保存に失敗しました。'));
      //      }
      //    } else {
      //      // 処理なし
      //    }
      //  }
      //}
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
                .filter(item => item.status !== "del")
                .map((item, index) => {
                  // 条件付きでボーダーカラーを決定
                  const borderColor =
                    changeCategoryFlag && index === changeCategoryIndex
                      ? "red"   // 重複している行は赤枠
                      : "#BCC7D4"; // 通常はグレー枠
                  return (
                    <div key={index}>
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
                          style={{ marginTop: "5px" }}
                          onClick={() => onChangeCategory(item.combId, item.status)}
                        >
                          ...
                        </button>
                        {index >= 1 && (
                          <button
                            className="btn-delete"
                            style={{ marginTop: "5px", marginLeft: "5px" }}
                            onClick={() => categoryDelButton(item.combId, item.status)}
                          >
                            削除
                          </button>
                        )}
                      </div>

                      {/* 重複チェック */}
                      {changeCategoryFlag && index === changeCategoryIndex && (
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
          <div>
            <div style={{ marginTop: '5px' }}>
              <label>バリエーション追加</label>
              <label className="label-optional">任意</label>
              <input style={{ marginTop: '5px' }} type="checkbox" onChange={handleCheck} />
            </div>
            
            <div style={{ marginLeft: "10px" }}>
              <div style={{ marginLeft: '10px' }}>
                <label style={{ marginLeft: "145px" }}>バリエーション1</label>
                <label style={{ marginLeft: "56px" }}>バリエーション2</label>
                <label style={{ marginLeft: "65px" }}>バリエーション3</label>
                <label style={{ marginLeft: "65px" }}>バリエーション4</label>
                <label style={{ marginLeft: "60px" }}>品番</label>
                <label style={{ marginLeft: "100px" }}>販売価格（税込）</label>
              </div>
              
              <div style={{ display: 'flex', marginLeft: "150px" }}>
                <div>{state.variItems.map((item, itemIndex) => {
                  return (
                    <div key={itemIndex} style={{ display: 'flex' }}>{
                      item.map((value, index) =>
                        index > 0 ? (
                          <div key={index} style={{ display: 'flex', marginBottom: '5px', visibility: value == null ? 'hidden' : 'visible' }}>
                            <input className="vari-row-input" /*type={value == null ? 'hidden' : 'text'}*/
                              style={{ borderRight: '1px solid #a0aec0', backgroundColor: checkBock.color }}
                              disabled={!checkBock.flag} value={item[index]} onChange={(event) => onChangeValue(event, itemIndex, index)}
                              onFocus={() => handleFocus(item)}
                              onBlur={() => outForcus(item)} />
                            {index < 5 &&
                              <button disabled={!checkBock.flag} style={{ backgroundColor: checkBock.color }}
                                className="plus-button" onClick={() => addNewVari(itemIndex, index)}>＋</button>
                            }
                          </div>
                        ) : null
                      )
                    }
                      <button className="btn-delete" style={{ marginLeft: '1px', height: '26px', paddingTop: '0px', paddingBottom: '0px' }}
                        onClick={() => delButton(itemIndex)} disabled={isDisabled}>
                        削除
                      </button>
                    </div>
                  )
                })}</div>
              </div>
              {errors?.variation && (
                <div style={{ color: 'red', marginTop: '5px' }}>
                  {errors.variation}
                </div>
              )}
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
            <div className="price-erea" style={{ marginLeft: '1px', marginTop: '10px' }}>
              <label style={{ marginTop: '5px', marginLeft: '11px', display: "block", textAlign: "right" }}>販売価格（税込）</label>
              <label style={{ marginTop: '5px' }} className="label-required">必須</label>
              <input className="input-text"
                value={state.sales_price}
                disabled={checkBock.flag} style={{ backgroundColor: backColor }}
                onChange={(event) => salesPriceChange(event.target.value)} />
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
            <div className="payment-how" style={{ marginLeft: '23px' }}>
              <div>
                <label>支払い方法適用</label>
                <label className="label-required">必須</label>
              </div>
              <div className="payment-kind" style={{ display: 'flex' }}>
                <Forms.FormInputCheck
                  id="is_payment_id1"
                  name="is_payment_id1"
                  checked={state.is_payment_id1}
                  onChange={onChange}
                />
                <label style={{ marginLeft: '-16px', paddingTop: '7px' }}>現金</label>
              </div>
              <div className="payment-kind" style={{ display: 'flex' }}>
                <Forms.FormInputCheck
                  id="is_payment_id2"
                  name="is_payment_id2"
                  checked={state.is_payment_id2}
                  onChange={onChange}
                />
                <label style={{ marginLeft: '-16px', paddingTop: '7px' }}>掛売</label>
              </div>
              <div className="payment-kind" style={{ display: 'flex' }}>
                <Forms.FormInputCheck
                  id="is_payment_id3"
                  name="is_payment_id3"
                  checked={state.is_payment_id3}
                  onChange={onChange}
                />
                <label style={{ marginLeft: '-16px', paddingTop: '7px' }}>宅配代引</label>
              </div>
              <div className="payment-kind" style={{ display: 'flex' }}>
                <Forms.FormInputCheck
                  id="is_payment_id4"
                  name="is_payment_id4"
                  checked={state.is_payment_id4}
                  onChange={onChange}
                />
                <label style={{ marginLeft: '-16px', paddingTop: '7px' }}>クレジットカード</label>
              </div>
              <div className="payment-kind" style={{ display: 'flex' }}>
                <Forms.FormInputCheck
                  id="is_payment_id5"
                  name="is_payment_id5"
                  checked={state.is_payment_id5}
                  onChange={onChange}
                />
                <label style={{ marginLeft: '-16px', paddingTop: '7px' }}>銀行振込</label>
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
