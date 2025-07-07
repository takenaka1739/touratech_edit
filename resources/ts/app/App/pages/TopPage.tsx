import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/PageWrapper';
import { useTopPage } from '../uses/useTopPage';
import { useIsAdmin } from '../uses/useApp';
import { APP_MENU } from '@/constants/APP_MENU';
import { useComposing } from '@/uses';

/**
 * TOPページ Component
 */
export const TopPage: React.VFC = () => {
  const { state, errors, isFetching, onChange, onClick } = useTopPage();
  const { composing, onCompositionStart, onCompositionEnd } = useComposing();
  const isAdmin = useIsAdmin();
  const title = `メニュー（${isAdmin ? `管理者` : `一般`}）`;

  const _slip = useMemo(() => {
    return (
      <div className="top-page__menu">
        <h3 className="top-page__h3">伝票</h3>
        <div className="top-page__menu-box">
          <ul>
            {APP_MENU.slip.map((x, i) => (
              <li key={i}>
                <Link to={x.url}>{x.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, []);

  const _capture = useMemo(() => {
    return (
      <div className="top-page__menu">
        <h3 className="top-page__h3">取込</h3>
        <div className="top-page__menu-box">
          <ul>
            {APP_MENU.capture.map((x, i) => (
              <li key={i}>
                <Link to={x.url}>{x.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, []);

  const _monthClosing = useMemo(() => {
    return (
      <div className="top-page__menu">
        <h3 className="top-page__h3">月締</h3>
        <div className="top-page__menu-box">
          <ul>
            {APP_MENU.monthClosing.map((x, i) => (
              <li key={i}>
                <Link to={x.url}>{x.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, []);

  const _inventory = useMemo(() => {
    return (
      <div className="top-page__menu">
        <h3 className="top-page__h3">棚卸</h3>
        <div className="top-page__menu-box">
          <ul>
            {APP_MENU.inventory.map((x, i) => (
              <li key={i}>
                <Link to={x.url}>{x.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, []);

  const _master = useMemo(() => {
    return (
      <div className="top-page__menu">
        <h3 className="top-page__h3">マスタ</h3>
        <div className="top-page__menu-box">
          <ul>
            {APP_MENU.master.map((x, i) => (
              <li key={i} className={x.className}>
                <Link to={x.url}>{x.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }, []);

  return (
    <PageWrapper prefix="top" title={title}>
      <div className="top-page__row">
        <div className="top-page__col">
          {_slip}
          {_capture}
          {_monthClosing}
          {_inventory}
        </div>
        {isAdmin && (
          <div className="top-page__col flex flex-col">
            {_master}
            <div className="top-page__menu">
              <h3 className="top-page__h3">商品呼出</h3>
              <div className="top-page__menu-box">
                <div className="flex items-center form-group py-2">
                  <label className="label mr-2">品番</label>
                  <div className="flex-grow">
                    <input
                      type="text"
                      name="c_item_number"
                      className="input w-full"
                      value={state.c_item_number ?? ''}
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
              </div>
            </div>
            <div className="top-page__menu flex items-end flex-grow">
              <div className="border border-gray-600 py-4 px-6">
                R1　もの補助　機ー（1）
                <br />
                ※ものづくり補助事業以外での使用禁止
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
