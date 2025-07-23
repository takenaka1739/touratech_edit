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
//import { Link } from 'react-router-dom';
import { useState, useCallback } from 'react';

export type ItemDetailPageProps = {} & RouteComponentProps<{ id: string }>;

type Form = {
  id: number;
  title: string;
  name: string;
};

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
    category_id: undefined,
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
      category_id: id,
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

  const [forms, setForms] = useState<Form[]>([]);
  const [idCounter, setIdCounter] = useState<number>(1);
  const addForm = () => {
    const formBody: Form = {
      id: idCounter,
      title: "",
      name: "",
    };
    setIdCounter(prevId => prevId + 1);
    setForms(prevForms => [...prevForms, formBody]);
  };

    const deleteForm = (id: number) => {
    setForms(prevForms => prevForms.filter(form => form.id !== id));
  };

  const handleInputChange = useCallback(
    (id: number, key: keyof Form) => 
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === id ? {...form, [key]: e.target.value} : form
          )
        );
    },
    []  // 依存配列は空です
  );

  let variKind:{[key: string] : string[]} = 
  {"1":["1", "1"],
   "2":["2", "2"],
   "3":["3", "3"],
   "4":["4", "4"]};

     const [variKindItem, setVariKind] = useState(variKind);

  const addNewVari = (name:string) => {
    let variKind:{[key: string] : string[]} = {};

    // 連想配列の要素取り出し
    for (let key in variKindItem) {
      let arr:string[] = [];
      let strKey: string = `${key}`;
      // 連想配列内の配列要素の取り出し
      for (let i = 0; i < variKindItem[key].length; i++) {
        // 新しく定義した配列に既存のデータを保存
        arr.push(variKindItem[key][i]);
      }

      if(strKey === name){
        // 押されたボタンの配列に要素を一つ追加
        arr.push("");
      }

      variKind[strKey] = arr;
    }
    setVariKind(variKind);
  }

  const deleVari = (name:string, index:number) => {
    let variKind:{[key: string] : string[]} = {};

    // 連想配列の要素取り出し
    for (let key in variKindItem) {
      let arr:string[] = [];
      let strKey: string = `${key}`;
      // 連想配列内の配列要素の取り出し
      for (let i = 0; i < variKindItem[key].length; i++) {
        if((strKey === name && i != index) || (strKey != name)){
        // 新しく定義した配列に既存のデータを保存
          arr.push(variKindItem[key][i]);
        }
      }
      variKind[strKey] = arr;
    }
    setVariKind(variKind);
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
          <Forms.FormGroup labelText="商品分類" error={errors?.category_id}>
            <div className="flex">
              <Forms.FormInputText
                name="item_classification_name"
                value={state.item_classification_name ?? ''}
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
        <div>
          <hr className="border-dashed border-gray-400 mt-4 mb-4" />
          <div className="button-erea">
            <a className="shop-image" href={"/item/shop-image"}>ショップイメージ</a>
            <a className="ref-items" href={"/item/shop-image"}>他商品情報参照</a>
          </div>
          <div className="is-public">
            <label>ショップへの公開</label>
            <label className="label-required">必須</label>
            <input type="checkbox"/>
          </div>
          <div>
            <div className="vari-code">
              <label>バリエーションコード</label>
              <label className="label-optional">任意</label>
            </div>
            <div className="vari-code-row">
              <div className="vari-row">
                <label>1</label>
                <input className="input-text"/>
              </div>
              <div className="vari-row">
                <label>2</label>
                <input className="input-text"/>
              </div>
              <div className="vari-row">
                <label>3</label>
                <input className="input-text"/>
              </div>
              <div className="vari-row">
                <label>4</label>
                <input className="input-text"/>
              </div>
            </div>
          </div>
          <div>
            <div className="vari-name">
              <label>バリエーション</label>
              <label className="label-optional">任意</label>
            </div>
            <div className="vari-name-row">
        <div id="vari-info">{ 
          Object.keys(variKindItem).map((name, index) => {
            return (
              <div className="vari-item">
                <div className="vari-name-row">
                  <label>{index + 1}</label>
                  <input className="input-text" value={name}/>
                  <button className="plus-button" onClick={() => addNewVari(name)}>＋</button>
                </div>
                <div className="vari-kind-list"> {
                  variKindItem[name].map((value, index) => {
                    return (
                      <div className="vari-kind">
                        <input className="vari-row-input"
                          type="text"
                          value={value}
                        />
                        <button className="dele-button" onClick={() => deleVari(name, index)}>✕</button>
                      </div>
                    )}
                  )}
                </div>
              </div>
            );
          })
        }</div>
                {/*<input className="vari-row-input"/>
                <button className="cross-button">✕</button>
                <input className="vari-row-input"/>
                <button>✕</button>
              </div>
              <div className="vari-row">
                <label>2</label>
                <input className="input-text"/>
                <button>＋</button>
                <input className="vari-row-input"/>
                <button className="cross-button">✕</button>
                <input className="vari-row-input"/>
                <button className="cross-button">✕</button>
              </div>
              <div className="vari-row">
                <label>3</label>
                <input className="input-text"/>
                <button>＋</button>
                <input className="vari-row-input"/>
                <button className="cross-button">✕</button>
                <input className="vari-row-input"/>
                <button className="cross-button">✕</button>
              </div>
              <div className="vari-row">
                <label>4</label>
                <input className="input-text"/>
                <button>＋</button>
                <input className="vari-row-input"/>
                <button className="cross-button">✕</button>
                <input className="vari-row-input"/>
                <button className="cross-button">✕</button>
              </div>*/}
            </div>
          </div>
          <div>
            <div className="item-explanation">
              <label>商品説明</label>
              <label className="label-optional">任意</label>
              <input className="item-detail"/>
            </div>
            <div className="item-explanation-detail">
              <label>商品説明（詳細）</label>
              <label className="label-optional">任意</label>
              <input className="item-detail"/>
            </div>
            <div className="price-erea">
              <label>標準価格</label>
              <label className="label-required">必須</label>
              <input className="input-text"/>
            </div>
            <div className="price-erea">
              <label>仕入価格</label>
              <label className="label-required">必須</label>
              <input className="input-text"/>
            </div>
            <div className="pre-order">
              <label>予約受付数</label>
              <label className="label-optional">任意</label>
              <input className="input-text"/>
            </div>
            <div className="shipping-fee">
              <label>送料適用</label>
              <label className="label-optional">任意</label>
              <input type="checkbox"/>
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
                <input type="checkbox"></input>
                <label>現金</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"></input>
                <label>掛売</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"></input>
                <label>宅配代引</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"></input>
                <label>銀行振込</label>
              </div>
              <div className="payment-kind">
                <input type="checkbox"></input>
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
