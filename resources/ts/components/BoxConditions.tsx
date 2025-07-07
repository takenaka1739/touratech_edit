import React from 'react';
import classnames from 'classnames';

type Props = {
  bodyClassName?: string;
  onClickSearchButton: () => void;
  onClickClearButton: () => void;
};

/**
 * 検索条件のボックス Component
 *
 * @param props
 */
export const BoxConditions: React.FC<Props> = ({
  children,
  bodyClassName,
  onClickSearchButton,
  onClickClearButton,
}) => (
  <fieldset className="box-conditions">
    <legend className="box-conditions-title">検索条件</legend>
    <div className={classnames('box-conditions-body', bodyClassName)}>{children}</div>
    <div className="box-conditions-bottom">
      <button className="btn" onClick={onClickSearchButton}>
        検索
      </button>
      <button className="btn-outline" onClick={onClickClearButton}>
        クリア
      </button>
    </div>
  </fieldset>
);
