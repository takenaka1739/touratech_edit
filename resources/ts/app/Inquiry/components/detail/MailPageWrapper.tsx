import React, { ComponentProps } from 'react';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import classNames from 'classnames';

/**
 * @param prefix - ページプレフィックス
 * @param title - ページのタイトル
 * @param isLoading - ローディング中はtrue
 * @param className - ページ固有のクラス名（任意）
 */
type PageWrapperProps = {
  prefix: string;
  title: string;
  isLoading?: boolean;
  backUrl?: string;
  className?: string;
} & ComponentProps<typeof Breadcrumb>;

/**
 * ページ表示のラッパー Component
 */
export const MailPageWrapper: React.FC<PageWrapperProps> = ({
  prefix,
  title,
  isLoading,
  breadcrumb,
  className,
  children,
}) => {
  return (
    <div className='mail-wrapper-page'>
      {console.log('classNames(`${prefix}-page`, className)')}
      {console.log(classNames(`${prefix}-page`, className))}
      <Helmet titleTemplate={`${title} | ${process.env.MIX_APP_NAME}`}>
        <title>{title}</title>
      </Helmet>

      <Breadcrumb breadcrumb={breadcrumb} />

      <div className="page-container-re">
        <h2 className="page-title">{title}</h2>

        <div className={classNames('page-body', isLoading ? 'page-loading' : '')}>
          {children}
        </div>
      </div>
    </div>
  );
};
