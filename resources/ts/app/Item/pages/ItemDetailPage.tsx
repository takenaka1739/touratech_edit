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
import { createUrl } from '@/app/Item/utils/createUrl';
import { TEMPLATE_ITEM_URLS } from '@/constants/TEMPLATE_ITEM_URLS';
import { AppActions } from '@/app/App/modules/appModule';

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
  } = useCommonDetailPage<
    Item & {
      selected: number[] | undefined;
    }
  >(slug, {
    id: undefined,
    item_number: '',
    name: '',
    name_jp: '',
    name_label: '',
    item_classification_id: undefined,
    item_classification_name: '',
    sales_unit_price: undefined,
    purchase_unit_price: undefined,
    sample_price: undefined,
    supplier_id: undefined,
    supplier_name: '',
    is_discontinued: false,
    discontinued_date: undefined,
    is_display: true,
    is_set_item: false,
    domestic_stock: undefined,
    overseas_stock: undefined,
    stock_display: 1,
    remarks: '',
    selected: undefined,
  });
  const {
    open: openItemClassDialog,
    searchDialogProps: itemClassSearchDialogProps,
  } = useCommonSearchDialogProps<ItemClassification>('item_classification', async props => {
    const { id, name } = props;
    updateState({
      item_classification_id: id,
      item_classification_name: name,
    });
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
    return true;
  });
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

  const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.item_number);
  const overseas_url = createUrl(TEMPLATE_ITEM_URLS.template_overseas_url, state.item_number);

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
          maxLength={400}
        />
        <Forms.FormGroupInputText
          labelText="商品名（納品書）"
          name="name_jp"
          value={state.name_jp ?? ''}
          error={errors?.name_jp}
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
          <Forms.FormGroup labelText="商品分類" error={errors?.item_classification_id}>
            <div className="flex">
              <Forms.FormInputText
                name="item_classification_name"
                value={state.item_classification_name ?? ''}
                error={errors?.item_classification_id}
                className="max-w-lg"
                readOnly
              />
              <input
                type="hidden"
                name="item_classification_id"
                value={state.item_classification_id ?? ''}
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
              value={state.discontinued_date}
              error={errors?.discontinued_date}
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
          value={state.stock_display}
          error={errors?.stock_display}
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
          <button className="btn" onClick={onClickSave} disabled={isDisabled}>
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
