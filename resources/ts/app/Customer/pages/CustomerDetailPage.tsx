// resources/ts/app/Customer/pages/CustomerDetailPage.tsx
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Customer } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useZipcodeAddress } from '@/app/App/uses/useZipcodeAddress';
import { validateItemState } from '@/app/Customer/utils/validation';
import { AppActions } from '@/app/App/modules/appModule';
import { useDispatch } from 'react-redux';

export type CustomerDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 得意先マスタ（詳細）画面 Component
 */
export const CustomerDetailPage: React.VFC<CustomerDetailPageProps> = ({}) => {
  const title = '得意先マスタ';
  const slug = 'customer';
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    setErrors,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<Customer>(slug, {
    id: undefined,
    name: '',
    kana: '',
    zip_code: '',
    address1: '',
    address2: '',
    tel: '',
    fax: '',
    email_main: '',
    email_sub: '',
    fraction: 3,
    corporate_class: 1,
    bank_class: 1,
    cutoff_date: 31,
    rate: 100,
    remarks: '',
    distinguish: 0,
  });

  const dispatch = useDispatch();

  // 郵便番号 → 住所検索用フック
  const { searchAddressByZip, loading: isSearchingZip } = useZipcodeAddress();

  /** 任意のフィールドに値をセットするヘルパー */
  const setFieldValue = (name: string, value: any) => {
    onChange(name, value);
  };

  /** 郵便番号から住所1を検索してセット */
  const handleSearchAddressByZip = async () => {
    const address = await searchAddressByZip(state.zip_code);
    if (address) {
      setFieldValue('address1', address);
    }
  };

  const saveClick = () => {
    const validationErrors = validateItemState(state);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      dispatch(AppActions.failed('必須項目を入力してください'));
      return;
    }else{
      onClickSave();
    }
  }

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <Forms.FormGroupInputRadio
          labelText="区分"
          name="distinguish"
          value={state.distinguish}
          error={errors?.distinguish}
          onChange={onChange}
          items={[
            {
              labelText: '一般',
              id: 'distinguish_0',
              value: 0,
            },
            {
              labelText: '業販',
              id: 'distinguish_1',
              value: 1,
            },
          ]}
          required
          groupClassName="mb-4"
        />

        <Forms.FormGroupInputText
          labelText="得意先名"
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
        <Forms.FormGroupInputText
          labelText="カナ"
          name="kana"
          value={state.kana}
          error={errors?.kana}
          onChange={onChange}
          className="max-w-lg"
          required
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
          {/* Supplier と同じ見た目になるように微調整 */}
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
          labelText="EMAIL(MAIN)"
          name="email_main"
          value={state.email_main}
          error={errors?.email_main}
          onChange={onChange}
          className="max-w-lg"
          maxLength={128}
          required
        />
        <Forms.FormGroupInputText
          labelText="EMAIL(SUB)"
          name="email_sub"
          value={state.email_sub}
          error={errors?.email_sub}
          onChange={onChange}
          className="max-w-lg"
          maxLength={128}
        />
        <hr className="border-dashed border-gray-400 mt-6" />
        <Forms.FormFraction
          fraction={state.fraction}
          error={errors?.fraction}
          required
          onChange={onChange}
        />
        <Forms.FormCorporateClass
          corporateClass={state.corporate_class}
          error={errors?.corporate_class}
          required
          onChange={onChange}
        />
        <Forms.FormGroupInputRadio
          labelText="口座選択"
          name="bank_class"
          value={state.bank_class}
          error={errors?.bank_class}
          onChange={onChange}
          items={[
            {
              labelText: '①',
              id: 'bank_class_1',
              value: 1,
            },
            {
              labelText: '②',
              id: 'bank_class_2',
              value: 2,
            },
          ]}
          required={true}
        />
        <div className="flex max-w-2xl">
          <div className="w-2/5">
            <Forms.FormGroupInputNumber
              labelText="締日"
              name="cutoff_date"
              value={state.cutoff_date}
              error={errors?.cutoff_date}
              onChange={onChange}
              precision={0}
              className="max-w-5"
              required
              min={1}
              max={31}
            />
          </div>
          <div className="w-2/5">
            <Forms.FormGroupInputNumber
              labelText="掛率"
              labelUnitText="%"
              name="rate"
              value={state.rate}
              error={errors?.rate}
              required
              onChange={onChange}
              precision={0}
              className="max-w-5"
              min={1}
              max={100}
            />
          </div>
        </div>
        <Forms.FormGroupTextarea
          labelText="備考"
          name="remarks"
          value={state.remarks ?? ''}
          error={errors?.remarks}
          className="max-w-lg"
          onChange={onChange}
        />
      </div>
      <div className="flex justify-between">
        {/*<button className="btn" onClick={onClickSave} disabled={isDisabled}>*/}
        <button className="btn" onClick={() => saveClick()} disabled={isDisabled}>
          保存
        </button>
        {id && (
          <button className="btn-delete" onClick={onClickDelete} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
