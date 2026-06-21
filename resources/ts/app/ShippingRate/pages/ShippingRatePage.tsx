import React from 'react';
import { PageWrapper, Forms } from '@/components';
import { useShippingRatePage } from '../uses/useShippingRatePage';
import { RemoteIslandShippingRate } from '../types';

const chunk = <T extends unknown>(rows: T[], size: number): T[][] => {
  const ret: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    ret.push(rows.slice(i, i + size));
  }
  return ret;
};

const getRowSpan = (
  rows: RemoteIslandShippingRate[],
  index: number,
  key: 'prefecture' | 'municipality'
): number => {
  const value = rows[index][key] ?? '';
  if (index > 0 && (rows[index - 1][key] ?? '') === value) {
    return 0;
  }

  let count = 1;
  for (let i = index + 1; i < rows.length; i++) {
    if ((rows[i][key] ?? '') !== value) {
      break;
    }
    count++;
  }
  return count;
};

export const ShippingRatePage: React.VFC = () => {
  const title = '送料マスタ';
  const slug = 'shipping_rate';
  const [activeTab, setActiveTab] = React.useState<'threshold' | 'prefecture' | 'remoteIsland'>(
    'threshold'
  );
  const {
    state,
    errors,
    isLoading,
    isSaving,
    onChangeFreeShippingThreshold,
    onChangePrefectureAmount,
    onChangeRemoteIslandAmount,
    onClickSave,
  } = useShippingRatePage();

  const prefectureColumns = chunk(state.prefecture_rates, 16);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[{ name: title }]} isLoading={isLoading}>
      <div className="shipping-rate-tabs">
        <button
          className={`shipping-rate-tabs__button ${
            activeTab === 'threshold' ? 'shipping-rate-tabs__button--active' : ''
          }`}
          onClick={() => setActiveTab('threshold')}
        >
          送料無料判定金額
        </button>
        <button
          className={`shipping-rate-tabs__button ${
            activeTab === 'prefecture' ? 'shipping-rate-tabs__button--active' : ''
          }`}
          onClick={() => setActiveTab('prefecture')}
        >
          都道府県別送料
        </button>
        <button
          className={`shipping-rate-tabs__button ${
            activeTab === 'remoteIsland' ? 'shipping-rate-tabs__button--active' : ''
          }`}
          onClick={() => setActiveTab('remoteIsland')}
        >
          離島追加送料
        </button>
      </div>

      {activeTab === 'threshold' && (
        <div className="form-group-wrapper shipping-rate-threshold">
          <h2 className="text-lg font-bold">送料無料判定金額</h2>
          <p className="shipping-rate-threshold__description">
            見積・受注・売上で、商品合計がこの金額以上の場合は通常送料を無料として判定します。
          </p>

          <div className="shipping-rate-threshold__fields">
            <Forms.FormGroupInputNumber
              labelText="送料無料判定金額（一般向け）"
              name="send_personal"
              value={state.free_shipping_thresholds.send_personal}
              error={errors?.['free_shipping_thresholds.send_personal']}
              onChange={(_, value) => onChangeFreeShippingThreshold('send_personal', value)}
              precision={0}
              className="max-w-8"
              labelUnitText="円以上で送料無料"
              min={0}
            />
            <Forms.FormGroupInputNumber
              labelText="送料無料判定金額（業者向け）"
              name="send_trader"
              value={state.free_shipping_thresholds.send_trader}
              error={errors?.['free_shipping_thresholds.send_trader']}
              onChange={(_, value) => onChangeFreeShippingThreshold('send_trader', value)}
              precision={0}
              className="max-w-8"
              labelUnitText="円以上で送料無料"
              min={0}
            />
          </div>
        </div>
      )}

      {activeTab === 'prefecture' && (
        <div className="form-group-wrapper">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">都道府県別送料</h2>
          </div>

          <div className="mt-4 flex flex-wrap">
            {prefectureColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="w-full md:w-1/3 pr-6">
                <table className="table">
                  <thead>
                    <tr>
                      <th>都道府県</th>
                      <th>送料（税込）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {column.map((row, index) => {
                      const realIndex = columnIndex * 16 + index;
                      const error = errors ? errors[`prefecture_rates.${realIndex}.amount`] : undefined;
                      return (
                        <tr key={row.prefecture}>
                          <td>{row.prefecture}</td>
                          <td>
                            <div className="flex items-center justify-center">
                              <Forms.FormInputNumber
                                name={`prefecture_rates.${realIndex}.amount`}
                                value={row.amount}
                                precision={0}
                                min={0}
                                className="max-w-8"
                                error={error}
                                onChange={(_, value) => onChangePrefectureAmount(realIndex, value)}
                              />
                              <span className="ml-2 text-xs">円</span>
                            </div>
                            {error && <div className="mt-1 text-xs text-red-700">{error}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'remoteIsland' && (
        <div className="form-group-wrapper">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">離島追加送料</h2>
          </div>

          <table className="table mt-4 shipping-rate-remote-table">
            <thead>
              <tr>
                <th className="w-24">都道府県</th>
                <th className="w-40">市区郡</th>
                <th>住所</th>
                <th className="shipping-rate-remote-table__group">離島グループ</th>
                <th className="w-40">料金</th>
              </tr>
            </thead>
            <tbody>
              {state.remote_island_rates.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">
                    離島追加送料は未登録です。
                  </td>
                </tr>
              )}
              {state.remote_island_rates.map((row, index) => {
                const prefix = `remote_island_rates.${index}`;
                const prefectureRowSpan = getRowSpan(state.remote_island_rates, index, 'prefecture');
                const municipalityRowSpan = getRowSpan(state.remote_island_rates, index, 'municipality');
                return (
                  <tr key={row.id ?? index}>
                    {prefectureRowSpan > 0 && <td rowSpan={prefectureRowSpan}>{row.prefecture ?? ''}</td>}
                    {municipalityRowSpan > 0 && <td rowSpan={municipalityRowSpan}>{row.municipality ?? ''}</td>}
                    <td>{row.area_names ?? ''}</td>
                    <td className="shipping-rate-remote-table__group">グループ{row.sort_order ?? index + 1}</td>
                    <td>
                      <div className="flex items-center justify-center">
                        <Forms.FormInputNumber
                          name={`${prefix}.amount`}
                          value={row.amount}
                          precision={0}
                          min={0}
                          className="max-w-8"
                          error={errors ? errors[`${prefix}.amount`] : undefined}
                          onChange={(_, value) => onChangeRemoteIslandAmount(index, value)}
                        />
                        <span className="ml-2 text-xs">円</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button className="btn" onClick={onClickSave} disabled={isSaving}>
          保存
        </button>
      </div>
    </PageWrapper>
  );
};
