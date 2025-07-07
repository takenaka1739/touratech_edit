import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @param breadcrumb - パンくず
 * @param breadcrumb.name - 表示名
 * @param breadcrumb.url - url
 */
type BreadcrumbProps = {
  breadcrumb?: {
    name: string;
    url?: string;
  }[];
};

/**
 * パンくず Component
 *
 * @param props パンくず情報
 */
export const Breadcrumb: React.VFC<BreadcrumbProps> = React.memo(
  ({ breadcrumb }) => {
    return (
      <div className="bc">
        <ol className="flex">
          <li className="bc__li">
            <Link to={'/'} className="underline">
              TOP
            </Link>
          </li>
          {!(breadcrumb == null) &&
            breadcrumb.map((x, i) => {
              return x.url == null ? (
                <li key={i} className="bc__li">
                  <span>{x.name}</span>
                </li>
              ) : (
                <li key={i} className="bc__li">
                  <Link to={x.url} className="underline">
                    {x.name}
                  </Link>
                </li>
              );
            })}
        </ol>
      </div>
    );
  },
  () => true
);
