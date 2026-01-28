import React from 'react';
import ReactModal from 'react-modal';
import { CSSTransition } from 'react-transition-group';

type DialogWrapperProps = {
  isShown: boolean;
  title: string;
  isLoading?: boolean;
  children?: React.ReactNode;
  width?: string;
  onClickCancel?: () => void;
};

export const ShopImageDialogWrapper: React.VFC<DialogWrapperProps> = ({
  isShown,
  title,
  isLoading,
  children,
  width,
  onClickCancel,
}) => {
  return (
    <ReactModal
      isOpen={true}
      className="react-modal"
      overlayClassName="react-modal-overlay fade"
    >
      <CSSTransition
        in={isShown}
        timeout={0}
        classNames="fade"
        unmountOnExit={false}
      >
        <div className="dialog-body">
          <div
            className="dialog-body__inner"
            style={width ? { width, maxWidth: width } : undefined}
          >
            <div className="dialog-title">
              <div>{title}</div>
              <button className="dialog-btn-cancel" onClick={onClickCancel}>
                <img src="/assets/img/close_black.svg" alt="close" width={24} height={24} />
              </button>
            </div>

            {!isLoading && <div className="py-2 px-4">{children}</div>}
          </div>
        </div>
      </CSSTransition>
    </ReactModal>
  );
};
