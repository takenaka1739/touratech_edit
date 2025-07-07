import React from 'react';
import { PageWrapper, Forms } from '@/components';
import { useInventoryPrintingDetailPage } from '../uses/useInventoryPrintingDetailPage';

/**
 * 在庫表印刷画面 Component
 */
export const InventoryPrintingDetailPage: React.VFC = () => {
  const title = '在庫表印刷';
  const slug = 'inventory_printing';
  const {
    isLoading,
    state,
    errors,
    isDisabled,
    onChange,
    onClickPrint,
    onClickOutput,
  } = useInventoryPrintingDetailPage(slug);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]} isLoading={isLoading}>
      <div className="form-group-wrapper box-conditions">
        <Forms.FormGroupInputMonth
          labelText="対象年月"
          name="import_month"
          value={state.import_month}
          error={errors?.import_month}
          onChange={onChange}
          groupClassName="mt-0"
          required
        />
      </div>

      <div className="mt-4 flex justify-between">
        <div>
          <button className="btn mr-4" onClick={onClickPrint} disabled={isDisabled}>
            在庫表発行
          </button>
          <button className="btn" onClick={onClickOutput} disabled={isDisabled}>
            在庫表出力
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
