import React from 'react';
import { PageWrapper } from '@/components';
import { ItemRefSearchDialog } from '@/app/Item/components/ItemRefSearchDialog';
import { SpecialSalesDialog } from '@/app/Item/components/SpecialSalesDialog';
import { useItemDetailPage } from '@/app/Item/uses/detail/useItemDetailPage';
import {
  ItemBasicInfoSection,
  ItemCategorySection,
  ItemPriceSection,
  ItemSupplierSection,
  ItemStatusSection,
  ItemRemarksSection,
  ItemManualSection,
  ItemPublishSection,
  ItemCodeSection,
  ItemVariationSection,
  ItemDescriptionSection,
  ItemSalesOptionSection,
  ItemLinksSection,
  ItemLabelSection
} from '@/app/Item/components/detail';

export const ItemDetailPage: React.FC = () => {
  const {
    title,
    slug,

    // 共通
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    onChange,

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

    // 保存
    saveClick,

    // ページ遷移
    useMovePage,

    // URL
    domestic_url,
    overseas_url,

    // 販売オプション
    backColor,
  } = useItemDetailPage();

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">

        {/* 品番・商品名 */}
        <ItemBasicInfoSection
          state={state}
          errors={errors}
          onChange={onChange}
        />

        {/* 商品分類 */}
        <ItemCategorySection
          state={state}
          changeCategoryIndex={changeCategoryIndex}
          onChangeCategory={onChangeCategory}
          onDeleteCategory={onDeleteCategory}
          addNewCategory={addNewCategory}
          itemClassSearchDialogProps={itemClassSearchDialogProps}
        />

        <ItemPriceSection state={state} errors={errors} onChange={onChange} />

        <ItemSupplierSection
          state={state}
          errors={errors}
          onChange={onChange}
          openSupplierDialog={openSupplierDialog}
          supplierSearchDialogProps={supplierSearchDialogProps}
        />

        <ItemStatusSection state={state} errors={errors} onChange={onChange} />

        <ItemRemarksSection state={state} errors={errors} onChange={onChange} />

        <ItemManualSection
          state={state}
          errors={errors}
          onChange={onChange}
          typeName={typeName}
          onChangeTypeName={onChangeTypeName}
          typeNameBackColor={typeNameBackColor}
          fileInputRef={inputRef}
          handleClick={handleClick}
          handleFileChange={handleFileChange}
        />

        <div>
          <hr className="border-dashed border-gray-400 mt-4 mb-4" />

          <div className="button-erea" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={useMovePage} className="btn ml-5">ショップイメージ</button>

            <button className="btn ml-5" onClick={openItemRefDialog}>
              他商品情報参照
            </button>

            <ItemRefSearchDialog
              selectId={state.id}
              onChangeState={onChangeRefState}
              {...itemRefSearchDialogProps}
            />

            <button className="btn ml-5" onClick={openSpecialSalesDialog}>
              特売設定
            </button>

            <SpecialSalesDialog
              state={state}
              isShown={isSpecialSalesShown}
              isLoading={false}
              onValueChange={onSpecialSalesValueChange}
              onClickCancel={closeSpecialSalesDialog}
            />
          </div>

          <ItemPublishSection state={state} errors={errors} onChange={onChange} />

          <ItemCodeSection state={state} errors={errors} onChange={onChange} />

          <ItemVariationSection
            state={state}
            errors={errors}
            isVariationEditable={isVariationEditable}
            isDisabled={isDisabled}
            handleCheck={() => {}}
            onChangeValue={onChangeValue}
            addNewVari={addNewVari}
            delButton={delButton}
            handleFocus={handleFocus}
            outForcus={outForcus}
          />

          <ItemDescriptionSection state={state} errors={errors} onChange={onChange} />

          <ItemSalesOptionSection
            state={state}
            errors={errors}
            onChange={onChange}
            salesPriceChange={() => {}}
            backColor={backColor}
          />
        </div>

        {id && (
          <>
            <ItemLinksSection id={id} domesticUrl={domestic_url} overseasUrl={overseas_url} />

            <ItemLabelSection
              selected={state.selected}
              onSelected={onSelected}
              onClickPrint={onClickPrint}
              onClickPrintNoPrice={onClickPrintNoPrice}
              error={errors?.selected}
            />
          </>
        )}
      </div>

      <div className="flex justify-between">
        <div>
          <button className="btn" onClick={saveClick} disabled={isDisabled}>保存</button>
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
