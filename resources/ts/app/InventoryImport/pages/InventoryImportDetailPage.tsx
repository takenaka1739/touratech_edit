import React, { useMemo } from 'react';
import { PageWrapper, Forms, TableWrapper } from '@/components';
import { InventoryImportDetailDialog } from '../components/InventoryImportDetailDialog';
import { useInventoryImportDetailPage } from '../uses/useInventoryImportDetailPage';
import { numberFormat } from '@/utils';

/**
 * 棚卸処理画面 Component
 */
export const InventoryImportDetailPage: React.VFC = () => {
  const title = '棚卸処理';
  const slug = 'inventory_import';
  const {
    conditions,
    state,
    errors,
    isDisabled,
    curFile,
    detailDialogProps,
    getRootProps,
    getInputProps,
    open,
    onChangeDate,
    onChange,
    onClickLoad,
    onClicUpload,
    onClickEditDetail,
    onChangePage,
    onClickOutput,
    onClickConfirm,
  } = useInventoryImportDetailPage(slug);

  const tables = useMemo(() => {
    const tbody = state.rows.map(r => (
      <tr key={r.no}>
        <td>{r.item_number}</td>
        <td>{r.item_name}</td>
        <td className="text-right">{numberFormat(r.quantity, 0)}</td>
        <td className="text-right">{numberFormat(r.stocks, 0)}</td>
        <td className="text-center">{r.unmatch ? '〇' : ''}</td>
        <td className="col-btn">
          {!state.hasInventory && (
            <span onClick={onClickEditDetail} data-no={r.no}>
              編集
            </span>
          )}
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th className=" w-32">品番</th>
            <th>商品名</th>
            <th className="w-20">取込数</th>
            <th className="w-20">在庫数</th>
            <th className="w-16">不一致</th>
            <th className="col-btn">編集</th>
          </tr>
        </thead>
        <tbody>{tbody}</tbody>
      </table>
    );
  }, [state.rows, state.hasInventory, onClickEditDetail]);

  return (
    <PageWrapper prefix="shipment-schedule-import" title={title} breadcrumb={[{ name: title }]}>
      <div className="box-conditions">
        <div className="flex items-center">
          <div>
            <Forms.FormGroupInputMonth
              labelText="棚卸年月"
              name="c_inventory_month"
              value={conditions.c_inventory_month}
              error={errors?.c_inventory_month}
              onChange={onChangeDate}
              required
              groupClassName="mt-0"
              readOnly={state.isLoaded}
            />
            {errors?.has_inventory && (
              <div className="bg-red-200 py-2 px-4 text-sm mt-4">{errors.has_inventory}</div>
            )}
          </div>
          <div className="pl-6">
            <button
              className="btn"
              onClick={onClickLoad}
              disabled={state.isLoaded || !state.hasMonth}
            >
              読込
            </button>
          </div>
          <div className="pl-6 justify-self-end">
            {state.hasInventory && (
              <div className=" bg-red-100 border border-red-500 text-red-500 px-2 text-center">
                確定済
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="form-group-wrapper box-conditions"
        aria-disabled={!state.isLoaded || state.hasInventoryImport || state.hasInventory}
      >
        <div className="flex items-center">
          <div className="w-full max-w-2xl">
            <Forms.FormGroup labelText="取込ファイル" groupClassName="mt-0" required>
              <div className="flex form-group max-w-2xl">
                <div className="flex-grow">
                  <div className="bg-gray-200 border border-gray-500 rounded-sm py-1 px-2 text-sm">
                    <div {...getRootProps({ className: 'dropzone' })}>
                      <input {...getInputProps()} />
                      {curFile !== undefined ? (
                        <p>{curFile.name}</p>
                      ) : (
                        <p className="text-gray-500">ファイルを選択してください</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn ml-2 text-sm"
                  onClick={open}
                  disabled={!state.isLoaded || state.hasInventoryImport || state.hasInventory}
                >
                  ファイルを選択
                </button>
              </div>
              {errors?.file && <div className="form-error">{errors?.file}</div>}
            </Forms.FormGroup>
          </div>
          <div className="pl-6">
            <button
              className="btn"
              onClick={onClicUpload}
              disabled={curFile === undefined || isDisabled}
            >
              取込
            </button>
          </div>
        </div>
      </div>
      <div aria-disabled={!state.isLoaded || !state.hasInventoryImport}>
        <div className="box-conditions">
          <div className="mt-2">
            <Forms.FormGroupInputRadio
              labelText="出力対象"
              name="c_unmatch"
              value={conditions.c_unmatch}
              error={errors?.c_unmatch}
              onChange={onChange}
              items={[
                {
                  labelText: '不一致のみ',
                  id: 'c_unmatch_1',
                  value: 1,
                },
                {
                  labelText: 'すべて',
                  id: 'c_unmatch_0',
                  value: 0,
                },
              ]}
              disabled={!state.hasInventoryImport}
            />
          </div>
          <TableWrapper pager={state.pager} onChangePage={onChangePage} isLoading={false}>
            {tables}
          </TableWrapper>

          <InventoryImportDetailDialog title={title} slug={slug} {...detailDialogProps} />

          <div className="mt-2">
            <button className="btn" onClick={onClickOutput} disabled={!state.hasInventoryImport}>
              一覧出力
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <div>
            <button
              className="btn"
              onClick={onClickConfirm}
              disabled={
                isDisabled || !state.isLoaded || !state.hasInventoryImport || state.hasInventory
              }
            >
              在庫確定
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
