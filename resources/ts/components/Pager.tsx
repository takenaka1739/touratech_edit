import React from 'react';

/**
 * @param currentPage - 現在のページ番号
 * @param lastPage - 最後のページ番号
 * @param handleChangePage - ページが変わったときの処理
 */
type PagerProps = {
  currentPage: number;
  lastPage: number;
  handleChangePage: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

/**
 * ページング Component
 */
export const Pager: React.VFC<PagerProps> = ({ currentPage, lastPage, handleChangePage }) => {
  let pager: React.ReactNode[] = [];
  if (currentPage > 1) {
    pager.push(
      <li key="prev" className="mr-2">
        <span data-page={1} onClick={handleChangePage}>
          &laquo;
        </span>
      </li>
    );
    pager.push(
      <li key="prev2" className="mr-2">
        <span data-page={currentPage - 1} onClick={handleChangePage}>
          &lt;
        </span>
      </li>
    );
  }
  for (let i = 1; i <= lastPage; i++) {
    if (i <= 2 || (i >= currentPage - 1 && i <= currentPage + 1) || i >= lastPage - 1) {
      pager.push(
        <li key={i} className="mr-2">
          <span
            data-page={i}
            onClick={handleChangePage}
            className={currentPage === i ? 'current' : ''}
          >
            {i}
          </span>
        </li>
      );
    } else {
      if ((i == 3 && currentPage < lastPage) || (currentPage > 1 && i == lastPage - 2)) {
        pager.push(
          <li key={i} className="mr-2">
            ...
          </li>
        );
      }
    }
  }
  if (currentPage < lastPage) {
    pager.push(
      <li key="next2" className="mr-2">
        <span data-page={currentPage + 1} onClick={handleChangePage}>
          &gt;
        </span>
      </li>
    );
    pager.push(
      <li key="next" className="mr-2">
        <span data-page={lastPage} onClick={handleChangePage}>
          &raquo;
        </span>
      </li>
    );
  }

  return <ul className="flex">{pager}</ul>;
};
