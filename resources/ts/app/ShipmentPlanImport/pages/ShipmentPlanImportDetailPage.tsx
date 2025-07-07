import React from 'react';
import { PageWrapper, Forms } from '@/components';
import { useShipmentPlanImportDetailPage } from '../uses/useShipmentPlanImportDetailPage';

/**
 * 発送予定取込画面 Component
 */
export const ShipmentPlanImportDetailPage: React.VFC = () => {
  const title = '発送予定取込';
  const slug = 'shipment_plan_import';
  const {
    state,
    errors,
    isDisabled,
    acceptedFiles,
    getRootProps,
    getInputProps,
    open,
    onChange,
    onClicUpload,
  } = useShipmentPlanImportDetailPage(slug);

  const files = acceptedFiles.map((file, i) => <li key={i}>{file.name}</li>);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]}>
      <div className="form-group-wrapper box-conditions">
        <Forms.FormGroup labelText="取込ファイル" groupClassName="mt-0" required>
          <div className="flex form-group max-w-2xl">
            <div className="flex-grow">
              <div className=" bg-gray-200 border border-gray-500 rounded-sm py-1 px-2 text-sm">
                <div {...getRootProps({ className: 'dropzone' })}>
                  <input {...getInputProps()} />
                  {files.length != 0 ? (
                    <ul>{files}</ul>
                  ) : (
                    <p className="text-gray-500">ファイルを選択してください</p>
                  )}
                </div>
              </div>
            </div>
            <button type="button" className="btn ml-2 text-sm" onClick={open}>
              ファイルを選択
            </button>
          </div>
          {errors?.file && <div className="form-error">{errors?.file}</div>}
        </Forms.FormGroup>
        <div className="mt-2">
          <Forms.FormGroupInputDate
            labelText="到着予定日"
            name="c_arrival_date"
            value={state.c_arrival_date}
            error={errors?.c_arrival_date}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <button className="btn" onClick={onClicUpload} disabled={files.length === 0 || isDisabled}>
          取込
        </button>
      </div>
    </PageWrapper>
  );
};
