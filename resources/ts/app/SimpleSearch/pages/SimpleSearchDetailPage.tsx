import { PageWrapper } from '@/components';
import { useSimpleSearchDetailPage } from '../uses/useSimpleSearchDetailPage';
import { createUrl } from '@/app/Item/utils/createUrl';
import { TEMPLATE_ITEM_URLS } from '@/constants/TEMPLATE_ITEM_URLS';
import { useComposing } from '@/uses';
import { numberFormat } from '@/utils';

export const SimpleSearchDetailPage: React.VFC = () => {
  const title = '簡易検索';
  const slug = 'simple_search';
  const {
    conditions,
    state,
    errors,
    isLoading,
    isFetching,
    onChange,
    onClick,
  } = useSimpleSearchDetailPage(slug);
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();
  const domestic_url = createUrl(TEMPLATE_ITEM_URLS.template_domestic_url, state.item_number);

  return (
    <PageWrapper prefix={slug} title={title} breadcrumb={[]} isLoading={isLoading}>
      <div className="form-group-wrapper">
        <div className="flex items-center form-group py-2 max-w-lg">
          <label className="label mr-2">品番</label>
          <div className="flex-grow">
            <input
              type="text"
              name="c_item_number"
              className="input w-full"
              value={conditions.c_item_number ?? ''}
              onChange={onChange}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={e => {
                if (e.key === 'Enter' && !composing) {
                  onClick();
                }
              }}
              maxLength={50}
            />
          </div>
          <button className="btn ml-2" onClick={onClick} disabled={isFetching}>
            呼出
          </button>
        </div>
        {errors?.c_item_number && <div className="form-error">{errors.c_item_number}</div>}

        <div className="mt-4 p-4">
          <table>
            <tbody>
              <tr>
                <th>商品名</th>
                <td>{state.name_jp}</td>
              </tr>
              <tr>
                <th>定価</th>
                <td>{numberFormat(state.sales_unit_price, 2)}</td>
              </tr>
              <tr>
                <th>国内製品ページ</th>
                <td>
                  <a href={domestic_url} target="blank">
                    {domestic_url}
                  </a>
                </td>
              </tr>
              <tr>
                <th>国内在庫</th>
                <td>
                  {state.domestic_stock != undefined &&
                    (state.domestic_stock > 0 ? 'あり' : 'なし')}
                </td>
              </tr>
              <tr>
                <th>メーカー本国在庫</th>
                <td>
                  {state.overseas_stock != undefined &&
                    (state.overseas_stock > 0 ? 'あり' : 'なし')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};
