import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import ReactModal from 'react-modal';
import classnames from 'classnames';

export const appAlert: (text: string | React.ReactNode, className?: string) => Promise<boolean> = (
  text,
  className
) => {
  const wrapper = document.body.appendChild(document.createElement('div'));

  const cleanup: () => void = () => {
    if (wrapper) {
      unmountComponentAtNode(wrapper);
      wrapper.parentNode?.removeChild(wrapper);
    }
  };

  const promise = new Promise<boolean>((resolve, reject) => {
    try {
      render(
        <AlertModal resolve={resolve} cleanup={cleanup} children={text} className={className} />,
        wrapper
      );
    } catch (e) {
      cleanup();
      reject(e);
      throw e;
    }
  });
  return promise;
};

type AlertModalProps = {
  className?: string;
  children?: React.ReactNode;
  resolve: (value: boolean) => void;
  cleanup: () => void;
};

const AlertModal: React.VFC<AlertModalProps> = ({ className, children, resolve, cleanup }) => {
  const onClick = () => {
    resolve(true);
    cleanup();
  };

  return (
    <ReactModal isOpen className="react-modal" overlayClassName="react-modal-overlay">
      <div className="alert">
        <div className="alert-bg" />
        <div className="alert-body">
          <div className="alert-body__inner">
            <div className="alert-content">
              <div className="flex items-center">
                <span className="icon-info" />
                <img
                  src="/assets/img/info_black.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="w-8"
                />
                <div className="ml-2">{children}</div>
              </div>
            </div>
            <button onClick={onClick} className={classnames('alert-btn', className)}>
              OK
            </button>
          </div>
        </div>
      </div>
    </ReactModal>
  );
};
