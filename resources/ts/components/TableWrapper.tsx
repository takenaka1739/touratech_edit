import React, { useCallback } from 'react';
import { Pager as PagerType } from '@/types';
import { Pager } from '@/components';

/**
 * @param pager - ページ情報
 * @param isLoading - ローディング中はtrue
 * @param onChangePage - ページが変わったときの処理
 */
type TableWrapperProps = {
  pager: PagerType | undefined;
  isLoading?: boolean;
  children?: React.ReactNode;
  onChangePage: (page: number) => void;
};

/**
 * 一覧表示のラッパー Component
 */
export const TableWrapper: React.VFC<TableWrapperProps> = ({
  pager,
  isLoading,
  children,
  onChangePage,
}) => {
  const handleChangePage = useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      const page = parseInt(e.currentTarget.getAttribute('data-page') ?? '');

      if (page != null) {
        onChangePage(page);
      }
    },
    [onChangePage]
  );

  return (
    <>
      {!isLoading && (
        <div className="table">
          <div className="table-row">
            <div className="box-pager">
              <Pager
                currentPage={pager?.currentPage ?? 1}
                lastPage={pager?.lastPage ?? 1}
                handleChangePage={handleChangePage}
              />
            </div>
            <div className="box-counter">
              {pager && pager.total > 0 && pager.lastPage > 0 && (
                <span>{`${pager.from} - ${pager.to} / ${pager.total}`}</span>
              )}
            </div>
          </div>
          <div className="mt-2">{children}</div>
          {pager && pager.total === 0 && <div className="my-2 text-sm">データは0件です</div>}
        </div>
      )}
    </>
  );
};
