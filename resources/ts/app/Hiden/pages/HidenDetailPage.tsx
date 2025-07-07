import React from 'react';
import { PageWrapper, Forms } from '@/components';
import { useHidenDetailPage } from '../uses/useHidenDetailPage';

/**
 * 売上出力画面 Component
 */
export const HidenDetailPage: React.VFC = () => {
  const title = '売上出力';
  const slug = 'hiden';
  const { state, errors, isDisabled, onChange, onClickOutputB2, onClickOutputHiden } = useHidenDetailPage(slug);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <div className="form-group-wrapper box-conditions">
        <Forms.FormGroup
          labelText="売上日"
          error={[errors?.c_sales_date_from ?? '', errors?.c_sales_date_to ?? '']}
          groupClassName="mt-0"
          required
        >
          <div className="flex">
            <Forms.FormInputDate
              name="c_sales_date_from"
              value={state.c_sales_date_from}
              error={errors?.c_sales_date_from}
              onChange={onChange}
            />
            <span className="mx-2">～</span>
            <Forms.FormInputDate
              name="c_sales_date_to"
              value={state.c_sales_date_to}
              error={errors?.c_sales_date_to}
              onChange={onChange}
            />
          </div>
        </Forms.FormGroup>
      </div>

      <div className="mt-2">
        <button className="btn" onClick={onClickOutputB2} disabled={isDisabled}>
          B2出力
        </button>
        <button className="btn ml-6" onClick={onClickOutputHiden} disabled={isDisabled}>
          飛伝出力
        </button>
      </div>
    </PageWrapper>
  );
};
