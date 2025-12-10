// resources/ts/app/Supplier/pages/SupplierDetailPage.tsx
import React, { useMemo } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Supplier } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useCurrencies } from '@/app/App/uses/useApp';
import { useZipcodeAddress } from '@/app/App/uses/useZipcodeAddress';

export type SupplierDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 仕入先マスタ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const SupplierDetailPage: React.VFC<SupplierDetailPageProps> = () => {
  const title = '仕入先マスタ';
  const slug = 'supplier';
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<Supplier>(slug, {
    id: undefined,
    name: '',
    zip_code: '',
    address1: '',
    address2: '',
    tel: '',
    fax: '',
    email: '',
    foreign_currency_type: '',
    personnel_id: undefined,
    fraction: 3,
    output_no: '',
    remarks: '',
  });

  const configCurrencies = useCurrencies() ?? [];

  // 外貨種類
  const currencies = useMemo(() => {
    return [
      {
        name: '',
        value: 0,
      },
      ...configCurrencies.map(x => {
        return {
          name: x.name,
          value: x.id,
        };
      }),
    ];
  }, [configCurrencies]);

  // 郵便番号 → 住所検索用フック
  const { searchAddressByZip, loading: isSearchingZip } = useZipcodeAddress();

  /**
   * 任意の項目に値をセットするヘルパー
   * useCommonDetailPage の onChange(name, value) をそのままラップする。
   */
  const setFieldValue = (name: string, value: any) => {
    onChange(name, value);
  };

  /**
   * 郵便番号から住所１を検索してセット
   */
  const handleSearchAddressByZip = async () => {
    const address = await searchAddressByZip(state.zip_code);
    if (address) {
      setFieldValue('address1', address);
    }
  };

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <Forms.FormGroupInputText
          labelText="仕入先名"
          name="name"
          value={state.name}
          error={errors?.name}
          onChange={onChange}
          groupClassName="mt-0"
          className="max-w-lg"
          required
          autoFocus
          maxLength={30}
        />

        {/* 郵便番号 + 住所検索ボタン */}
        <div className="flex items-end max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputZipCode
              labelText="郵便番号"
              name="zip_code"
              value={state.zip_code}
              error={errors?.zip_code}
              onChange={onChange}
              required
            />
          </div>

          {/* ボタンを微調整：ほんの少しだけ上に移動（1px） */}
          <div className="ml-2" style={{ position: 'relative', top: '1px' }}>
            <button
              type="button"
              className="btn"
              onClick={handleSearchAddressByZip}
              disabled={isDisabled || isSearchingZip}
            >
              {isSearchingZip ? '検索中...' : '住所検索'}
            </button>
          </div>
        </div>

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
          value={state.address2 ?? ''}
          error={errors?.address2}
          onChange={onChange}
          className="max-w-lg"
          maxLength={30}
        />
        <div className="flex max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputTel
              labelText="TEL"
              name="tel"
              value={state.tel}
              error={errors?.tel}
              onChange={onChange}
              required
            />
          </div>
          <div className="w-2/5">
            <Forms.FormGroupInputTel
              labelText="FAX"
              name="fax"
              value={state.fax ?? ''}
              error={errors?.fax}
              onChange={onChange}
            />
          </div>
        </div>
        <Forms.FormGroupInputText
          labelText="MAIL"
          name="email"
          value={state.email ?? ''}
          error={errors?.email}
          onChange={onChange}
          className="max-w-lg"
          maxLength={128}
        />
        <Forms.FormGroupSelect
          labelText="外貨種類"
          name="foreign_currency_type"
          options={currencies}
          value={state.foreign_currency_type}
          error={errors?.foreign_currency_type}
          onChange={onChange}
          required
        />
        <Forms.FormFraction
          fraction={state.fraction}
          error={errors?.fraction}
          required
          onChange={onChange}
        />
        <Forms.FormGroupInputText
          labelText="CSV出力番号"
          name="output_no"
          value={state.output_no ?? ''}
          error={errors?.output_no}
          onChange={onChange}
          className="max-w-xs"
          maxLength={10}
          required
        />
        <Forms.FormGroupTextarea
          labelText="備考"
          name="remarks"
          value={state.remarks ?? ''}
          error={errors?.remarks}
          onChange={onChange}
          className="max-w-lg"
          maxLength={200}
        />
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          className="btn"
          onClick={onClickSave}
          disabled={isDisabled}
        >
          保存
        </button>
        {id && (
          <button
            type="button"
            className="btn-delete"
            onClick={onClickDelete}
            disabled={isDisabled}
          >
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
