import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { itemInitialState } from '@/app/Item/modules/itemInitialState';
import { Item } from '@/types';
import { createUrl } from '@/app/Item/utils/createUrl';
import { TEMPLATE_ITEM_URLS } from '@/constants/TEMPLATE_ITEM_URLS';

// 分割した use 群
import { useItemCategory } from './useItemCategory';          // 商品分類
import { useItemVariation } from './useItemVariation';        // バリエーション
import { useItemManual } from './useItemManual';              // 取扱説明書
import { useItemPrint } from './useItemPrint';                // 印刷・ラベル選択
import { useItemSave } from './useItemSave';                  // 保存
import { useItemNavigation } from './useItemNavigation';      // ページ遷移・location.state の復元
import { useItemSupplier } from './useItemSupplier';          // 仕入先
import { useItemRefSearch } from './useItemRefSearch';        // 他商品情報参照
import { useItemSpecialSales } from './useItemSpecialSales';  // 特売設定
import { useItemSalesPrice } from './useItemSalesPrice';      // 販売価格（税込）

export const useItemDetailPage = () => {
  const title = '商品マスタ';
  const slug = 'item';

  // ==============================================================
  // 共通の詳細ページ管理（state / errors / onChange など）
  // ==============================================================
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    setState,
    updateState,
    onChange,
    setErrors,
    onClickDelete,
  } = useCommonDetailPage<Item & { selected: number[] | undefined }>(
    slug,
    itemInitialState
  );

  const dispatch = useDispatch();

  // ==============================================================
  // UI 状態：販売価格背景色
  // ==============================================================
  const [backColor, setBackColor] = useState<string>('#ffffff');

  // ==============================================================
  // 各 use の呼び出し（ロジックはすべて分割済み）
  // ==============================================================

  // カテゴリ
  const {
    changeCategoryIndex,
    categoryChangeFlag,
    setCategoryChangeFlag,
    addNewCategory,
    onChangeCategory,
    onDeleteCategory,
    itemClassSearchDialogProps,
  } = useItemCategory({
    state,
    setState,
    setErrors,
  });

  // 仕入先
  const {
    supplierChangeFlag,
    setSupplierChangeFlag,
    openSupplierDialog,
    supplierSearchDialogProps,
  } = useItemSupplier({
    state,
    setState,
    setErrors,
  });

  // 他商品情報参照
  const {
    openItemRefDialog,
    itemRefSearchDialogProps,
    onChangeRefState,
  } = useItemRefSearch({
    setState,
  });

  // 特売設定
  const {
    isShown: isSpecialSalesShown,
    openSpecialSalesDialog,
    closeSpecialSalesDialog,
    onValueChange: onSpecialSalesValueChange,
  } = useItemSpecialSales({
    setState,
  });

  // バリエーション
  const {
    variItems,
    variDelItem,
    variChangeItem,
    setVariChangeItem,
    variClickFlag,
    setvariClickFlag,
    onFocusItem,
    addNewVari,
    delButton,
    onChangeValue,
    handleFocus,
    outForcus,
    isVariationEditable,
  } = useItemVariation({
    state,
    setState,
    onClickDelete,
  });

  // isVariationEditable を受け取った後に useEffect（TS2448/2454 対策）
  useEffect(() => {
    if (isVariationEditable === false) {
      setBackColor('#ffffff'); // 編集可能
    } else {
      setBackColor('#f0f0f0'); // 編集不可
    }
  }, [isVariationEditable]);

  // 取扱説明書
  const {
    typeName,
    typeNameBackColor,
    inputRef,
    onChangeTypeName,
    handleFileChange,
    handleClick,
    setTypeName,
  } = useItemManual({
    state,
    setState,
  });

  // 印刷
  const {
    onSelected,
    onClickPrint,
    onClickPrintNoPrice,
  } = useItemPrint({
    state,
    slug,
    dispatch,
    updateState,
  });

  // 販売価格（税込）
  const {
    salesPriceChange,
  } = useItemSalesPrice({
    setState,
    setErrors,
  });

  // 保存処理
  const {
    saveClick,
  } = useItemSave({
    state,
    dispatch,
    slug,
    backPage: () => backPage(),
    setErrors,
  });

  // ページ遷移
  const {
    useMovePage,
    backPage,
  } = useItemNavigation({
    state,
    setState,
    updateState,
    variItems,
    variChangeItem,
    setVariChangeItem,
    categoryChangeFlag,
    supplierChangeFlag,
    setCategoryChangeFlag,
    setSupplierChangeFlag,
    setvariClickFlag,
    setTypeName,
  });

  // ==============================================================
  // URL（国内・海外）
  // ==============================================================
  const overseas_url = createUrl(
    TEMPLATE_ITEM_URLS.template_overseas_url,
    state.item_number
  );

  const domestic_url = state.categoryList?.[0]?.name
    ? `https://touratech.matrix.jp/ec/category-products/カテゴリーの一覧/${state.categoryList[0].name}/${state.id}`
    : '';

  // ==============================================================
  // UI に渡す値をまとめて返す（最終形）
  // ==============================================================
  return {
    title,
    slug,

    // 共通
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    onChange,
    setState,

    // カテゴリ
    changeCategoryIndex,
    addNewCategory,
    onChangeCategory,
    onDeleteCategory,
    itemClassSearchDialogProps,

    // 仕入先
    openSupplierDialog,
    supplierSearchDialogProps,

    // 他商品情報参照
    openItemRefDialog,
    itemRefSearchDialogProps,
    onChangeRefState,

    // 特売設定
    isSpecialSalesShown,
    openSpecialSalesDialog,
    closeSpecialSalesDialog,
    onSpecialSalesValueChange,

    // バリエーション
    variItems,
    variDelItem,
    variChangeItem,
    variClickFlag,
    onFocusItem,
    addNewVari,
    delButton,
    onChangeValue,
    handleFocus,
    outForcus,
    isVariationEditable,

    // 取扱説明書
    typeName,
    typeNameBackColor,
    inputRef,
    onChangeTypeName,
    handleFileChange,
    handleClick,

    // 印刷
    onSelected,
    onClickPrint,
    onClickPrintNoPrice,

    // 販売価格（税込）
    salesPriceChange,
    
    // 保存
    saveClick,

    // ページ遷移
    useMovePage,
    backPage,

    // URL
    domestic_url,
    overseas_url,

    // 販売価格背景色
    backColor,
  };
};
