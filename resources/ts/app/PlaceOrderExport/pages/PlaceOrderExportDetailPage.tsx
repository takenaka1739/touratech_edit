import React from 'react';
import { PageWrapper, Forms } from '@/components';
import { usePlaceOrderExportDetailPage } from '../uses/usePlaceOrderExportDetailPage';

/**
 * 発注CSV出力画面 Component
 */
export const PlaceOrderExportDetailPage: React.VFC = () => {
  const title = '発注CSV出力';
  const slug = 'place_order_export';
  const { state, errors, isDisabled, onChange, onClickOutput } = usePlaceOrderExportDetailPage(
    slug
  );

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <div className="form-group-wrapper box-conditions">
        <Forms.FormGroup
          labelText="発注日"
          error={[errors?.c_place_order_date_from ?? '', errors?.c_place_order_date_to ?? '']}
          groupClassName="mt-0"
          required
        >
          <div className="flex">
            <div className="flex">
              <Forms.FormInputDate
                name="c_place_order_date_from"
                value={state.c_place_order_date_from}
                error={errors?.c_place_order_date_from}
                onChange={onChange}
              />
              <span className="mx-2">～</span>
              <Forms.FormInputDate
                name="c_place_order_date_to"
                value={state.c_place_order_date_to}
                error={errors?.c_place_order_date_to}
                onChange={onChange}
              />
            </div>
            <div className="ml-4">
              <Forms.FormInputCheck
                labelText="出力済みも含む"
                id="c_is_output"
                name="c_is_output"
                checked={state.c_is_output}
                onChange={onChange}
              />
            </div>
          </div>
        </Forms.FormGroup>
      </div>

      <div className="mt-4 flex justify-between">
        <button className="btn" onClick={onClickOutput} disabled={isDisabled}>
          出力
        </button>
      </div>
    </PageWrapper>
  );
};
