import React, { ComponentProps } from 'react';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import classNames from 'classnames';

/**
 * @param prefix - ページプレフィックス
 * @param title - ページのタイトル
 * @param isLoading - ローディング中はtrue
 */
type PageWrapperProps = {
  prefix: string;
  title: string;
  isLoading?: boolean;
  backUrl?: string;
} & ComponentProps<typeof Breadcrumb>;

/**
 * ページ表示のラッパー Component
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({
  prefix,
  title,
  isLoading,
  breadcrumb,
  children,
}) => {
  return (
    <div className={`${prefix}-page`}>
      <Helmet titleTemplate={`${title} | ${process.env.MIX_APP_NAME}`}>
        <title>{title}</title>
      </Helmet>
      <Breadcrumb breadcrumb={breadcrumb} />
      <div className="page-container">
        <h2 className="page-title">{title}</h2>
        <div className={classNames('page-body', isLoading ? 'page-loading' : '')}>{children}</div>
      </div>
    </div>
  );
};
