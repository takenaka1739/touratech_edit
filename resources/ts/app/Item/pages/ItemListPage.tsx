import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper, BoxConditions, TableWrapper, Forms } from '@/components';
import { SupplierSearchDialog } from '@/app/Supplier/components/SupplierSearchDialog';
import { useItemListPage } from '../uses/useItemListPage';
import { numberFormat } from '@/utils/numberFormat';
import { useComposing } from '@/uses';

/**
 * 商品マスタ（一覧）画面 Component
 */
export const ItemListPage: React.VFC = () => {
  const title = '商品マスタ';
  const slug = 'item';
  const {
    isLoading,
    state,
    conditions,
    openSupplierDialog,
    supplierSearchDialogProps,
    onChange,
    onClickSearchButton,
    onClickClearButton,
    onChangePage,
    addDetail,
    onClickOutput,
    changeStockDisplay,
    isDisabled,
  } = useItemListPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.id}>
        <td>
          <div className="text-xs">{r.item_number}</div>
          <div>{r.name}</div>
          <div>{r.name_jp}</div>
        </td>
        <td className="text-right">{numberFormat(r.sales_unit_price)}</td>
        <td className="text-right">{numberFormat(r.purchase_unit_price)}</td>
        <td className="text-right">{numberFormat(r.domestic_stock ?? 0, 0)}</td>
        <td className="text-right">{numberFormat(r.overseas_stock ?? 0, 0)}</td>
        <td className="col-btn">
          <Link to={`/${slug}/detail/${r.id}`}>編集</Link>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th>品番・商品名</th>
            <th className="col-amount">売上単価</th>
            <th className="col-amount">仕入単価</th>
            <th className="w-24">国内</th>
            <th className="w-24">国外</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows]);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <BoxConditions
        bodyClassName="mt-0"
        onClickSearchButton={onClickSearchButton}
        onClickClearButton={onClickClearButton}
      >
        <div className="flex">
          <Forms.FormGroupInputText
            labelText="文字列"
            name="c_keyword"
            value={conditions.c_keyword}
            onChange={onChange}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={e => {
              if (e.key === 'Enter' && !composing) {
                onClickSearchButton();
              }
            }}
            maxLength={30}
            groupClassName="max-w-sm mr-4"
            removeOptionalLabel
          />
          <Forms.FormGroupInputRadio
            labelText="廃盤："
            name="c_is_display"
            value={conditions.c_is_display}
            onChange={onChange}
            items={[
              {
                labelText: '指定なし',
                id: 'c_is_display_none',
                value: 'none',
              },
              {
                labelText: '非廃盤のみ',
                id: 'c_is_display_1',
                value: '1',
              },
              {
                labelText: '廃盤のみ',
                id: 'c_is_display_2',
                value: '2',
              },
            ]}
            groupClassName="max-w-sm"
            removeOptionalLabel
          />
        </div>
        <div className="w-40 mt-2">
          <div className="form-group">
            <Forms.FormInputCheck
              id="is_discontinued"
              name="c_has_discontinued"
              labelText="確認データを含む"
              checked={conditions.c_has_discontinued}
              onChange={onChange}
            />
          </div>
        </div>
        <div className="flex mt-2">
          <div className="w-1/2 mr-4">
            <Forms.FormGroup labelText="仕入先" removeOptionalLabel>
              <div className="flex">
                <Forms.FormInputText
                  name="supplier_name"
                  value={conditions.c_supplier_name}
                  readOnly
                />
                <input type="hidden" name="supplier_id" value={conditions.c_supplier_id ?? ''} />
                <button className="btn ml-2 py-0 px-2" onClick={openSupplierDialog}>
                  ...
                </button>
              </div>
            </Forms.FormGroup>
            <SupplierSearchDialog {...supplierSearchDialogProps} />
          </div>
          <div className="w-1/2">
            <div className="form-group">
              <Forms.FormInputCheck
                id="c_un_supplier"
                name="c_un_supplier"
                labelText="仕入先未指定のみ"
                checked={conditions.c_un_supplier}
                onChange={onChange}
              />
            </div>
          </div>
        </div>
      </BoxConditions>

      <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={isLoading}>
        {tables}
      </TableWrapper>
      <div className="mt-2">
        <button className="btn" onClick={addDetail} disabled={isDisabled}>
          新規追加
        </button>
        <button className="btn ml-6" onClick={onClickOutput} disabled={isDisabled}>
          エクセル出力
        </button>
        <button className="btn ml-6" onClick={changeStockDisplay} disabled={isDisabled}>
          在庫表示一括切替
        </button>
      </div>
    </PageWrapper>
  );
};
