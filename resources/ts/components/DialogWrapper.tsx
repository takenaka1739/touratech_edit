import React from 'react';
import ReactModal from 'react-modal';
import { CSSTransition } from 'react-transition-group';

/**
 * @param isShown - 表示する場合はtrue
 * @param title - ダイアログのタイトル
 * @param isLoading - ローディング中はtrue
 * @param onClickCancel - キャンセル時の処理
 */
type DialogWrapperProps = {
  isShown: boolean;
  title: string;
  isLoading?: boolean;
  children?: React.ReactNode;
  onClickCancel?: () => void;
};

/**
 * ダイアログラッパー Component
 *
 * @param props
 */
export const DialogWrapper: React.VFC<DialogWrapperProps> = ({
  isShown,
  title,
  isLoading,
  children,
  onClickCancel,
}) => {
  return (
    <CSSTransition in={isShown} classNames="fade" timeout={400}>
      <ReactModal isOpen={isShown} className="react-modal" overlayClassName="react-modal-overlay">
        <div className="dialog-body">
          <div className="dialog-body__inner">
            <div className="dialog-title">
              <div>{title}</div>
              <button className="dialog-btn-cancel" onClick={onClickCancel}>
                <img src="/assets/img/close_black.svg" alt="close" width={24} height={24} />
              </button>
            </div>
            {!isLoading && <div className="py-2 px-4">{children}</div>}
          </div>
        </div>
      </ReactModal>
    </CSSTransition>
  );
};
