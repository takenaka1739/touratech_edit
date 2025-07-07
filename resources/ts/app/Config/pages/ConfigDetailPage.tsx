import React from 'react';
import { PageWrapper, Forms } from '@/components';
import { useConfigDetailPage } from '../uses/useConfigDetailPage';
import { COMPANY_LEVEL } from '@/constants';
import { numberFormat } from '@/utils';

/**
 * 環境設定画面 Component
 */
export const ConfigDetailPage: React.VFC = () => {
  const title = '環境設定';
  const slug = 'config';
  const {
    isLoading,
    state,
    errors,
    isDisabled,
    onChange,
    onChangeRate,
    onChangeCodAmount,
    onClickSave,
  } = useConfigDetailPage();

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]} isLoading={isLoading}>
      <div className="form-group-wrapper">
        <Forms.FormGroupInputText
          labelText="自社名"
          name="company_name"
          value={state.company_name}
          error={errors?.company_name}
          onChange={onChange}
          groupClassName="mt-0"
          className="max-w-lg"
          required
          autoFocus
          maxLength={30}
        />
        <Forms.FormGroupInputZipCode
          labelText="郵便番号"
          name="zip_code"
          value={state.zip_code}
          error={errors?.zip_code}
          onChange={onChange}
          required
        />
        <Forms.FormGroupInputText
          labelText="住所1"
          name="address1"
          value={state.address1}
          error={errors?.address1}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={30}
        />
        <Forms.FormGroupInputText
          labelText="住所2"
          name="address2"
          value={state.address2}
          error={errors?.address2}
          onChange={onChange}
          className="max-w-lg"
          maxLength={30}
        />
        <div className="flex max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputTel
              labelText="TEL"
              name="tel"
              value={state.tel}
              error={errors?.tel}
              onChange={onChange}
              required
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputTel
              labelText="FAX"
              name="fax"
              value={state.fax}
              error={errors?.fax}
              onChange={onChange}
              required
            />
          </div>
        </div>
        <Forms.FormGroupInputText
          labelText="MAIL"
          name="email"
          value={state.email}
          error={errors?.email}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={128}
        />
        <hr className="border-dashed border-gray-400 mt-6" />
        <Forms.FormGroupInputText
          labelText="口座名①"
          name="account_name1"
          value={state.account_name1}
          error={errors?.account_name1}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={30}
        />
        <div className="flex max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="銀行名①"
              name="bank_name1"
              value={state.bank_name1}
              error={errors?.bank_name1}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={30}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="支店名①"
              name="branch_name1"
              value={state.branch_name1}
              error={errors?.branch_name1}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={30}
            />
          </div>
        </div>
        <div className="flex max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="口座種別①"
              name="account_type1"
              value={state.account_type1}
              error={errors?.account_type1}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={30}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="口座番号①"
              name="account_number1"
              value={state.account_number1}
              error={errors?.account_number1}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={7}
            />
          </div>
        </div>
        <hr className="border-dashed border-gray-400 mt-6" />
        <Forms.FormGroupInputText
          labelText="口座名②"
          name="account_name2"
          value={state.account_name2}
          error={errors?.account_name2}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={30}
        />
        <div className="flex max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="銀行名②"
              name="bank_name2"
              value={state.bank_name2}
              error={errors?.bank_name2}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={30}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="支店名②"
              name="branch_name2"
              value={state.branch_name2}
              error={errors?.branch_name2}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={30}
            />
          </div>
        </div>
        <div className="flex max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="口座種別②"
              name="account_type2"
              value={state.account_type2}
              error={errors?.account_type2}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={30}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="口座番号②"
              name="account_number2"
              value={state.account_number2}
              error={errors?.account_number2}
              onChange={onChange}
              className="max-w-10"
              required
              maxLength={7}
            />
          </div>
        </div>
        <hr className="border-dashed border-gray-400 mt-6" />
        <Forms.FormGroupSelect
          labelText="会社レベル"
          name="company_level"
          options={COMPANY_LEVEL}
          value={state.company_level}
          error={errors?.company_level}
          onChange={onChange}
          required
        />
        <div className="flex max-w-xl">
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="消費税率"
              name="sales_tax_rate"
              value={state.sales_tax_rate}
              error={errors?.sales_tax_rate}
              onChange={onChange}
              precision={0}
              className="max-w-5"
              labelUnitText="%"
              required
              min={1}
              max={100}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="変更前税率"
              name="pre_tax_rate"
              value={state.pre_tax_rate}
              error={errors?.pre_tax_rate}
              onChange={onChange}
              precision={0}
              className="max-w-5"
              labelUnitText="%"
              required
              min={1}
              max={100}
            />
          </div>
        </div>
        <Forms.FormGroupInputDate
          labelText="税率変更日"
          name="tax_rate_change_date"
          value={state.tax_rate_change_date}
          error={errors?.tax_rate_change_date}
          onChange={onChange}
          required
        />
        <hr className="border-dashed border-gray-400 mt-6" />
        <div className="p-6">
          <p className="flex items-center text-sm">
            通貨換算
            <span className="bg-red-700 border border-red-700 ml-2 px-1 text-white text-xs whitespace-no-wrap self-start rounded-sm">
              必須
            </span>
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>&nbsp;</th>
                <th>通貨</th>
                <th>掛率</th>
              </tr>
            </thead>
            <tbody>
              {state.currencies.map((x, i) => {
                const error = errors ? errors[`currencies.${i}.rate`] : undefined;
                return (
                  <tr key={x.id}>
                    <td>{x.id}</td>
                    <td>{x.name}</td>
                    <td>
                      <div className="form-group">
                        <Forms.FormInputNumber
                          name={`currencies.${i}.rate`}
                          value={x.rate}
                          className="max-w-8"
                          onChange={onChangeRate}
                          precision={3}
                          error={error}
                          min={0}
                        />
                        <input type="hidden" name={`currencies.${i}.id`} value={x.id} />
                      </div>
                      {error && <div className="mt-1 text-xs text-red-700">{error}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-6">
          <p className="flex items-center text-sm">
            代引設定
            <span className="bg-red-700 border border-red-700 ml-2 px-1 text-white text-xs whitespace-no-wrap self-start rounded-sm">
              必須
            </span>
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>&nbsp;</th>
                <th>以下</th>
                <th>代引金額</th>
              </tr>
            </thead>
            <tbody>
              {state.cods.map((x, i) => {
                const error = errors ? errors[`cods.${i}.amount`] : undefined;
                return (
                  <tr key={x.id}>
                    <td>{x.id}</td>
                    <td>{numberFormat(x.border, 2)}</td>
                    <td>
                      <div className="form-group">
                        <Forms.FormInputNumber
                          name={`cods.${i}.amount`}
                          value={x.amount}
                          className="max-w-8"
                          onChange={onChangeCodAmount}
                          precision={2}
                          error={error}
                          min={0}
                        />
                        <input type="hidden" name={`cods.${i}.id`} value={x.id} />
                      </div>
                      {error && <div className="mt-1 text-xs text-red-700">{error}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <button className="btn" onClick={onClickSave} disabled={isDisabled}>
          保存
        </button>
      </div>
    </PageWrapper>
  );
};
