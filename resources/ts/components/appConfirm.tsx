import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import ReactModal from 'react-modal';
import classnames from 'classnames';
import { nl2br } from '@/utils/nl2br';

export const appConfirm: (
  text: string | React.ReactNode,
  className?: string
) => Promise<boolean> = (text, className) => {
  const wrapper = document.body.appendChild(document.createElement('div'));

  const cleanup: () => void = () => {
    if (wrapper) {
      unmountComponentAtNode(wrapper);
      wrapper.parentNode?.removeChild(wrapper);
    }
  };

  const _text = typeof text === 'string' ? nl2br(text) : text;

  const promise = new Promise<boolean>((resolve, reject) => {
    try {
      render(
        <ConfirmModal resolve={resolve} cleanup={cleanup} children={_text} className={className} />,
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

type ConfirmModalProps = {
  className?: string;
  children?: React.ReactNode;
  resolve: (value: boolean) => void;
  cleanup: () => void;
};

export const ConfirmModal: React.VFC<ConfirmModalProps> = ({
  className,
  children,
  resolve,
  cleanup,
}) => {
  const onClick = () => {
    resolve(true);
    cleanup();
  };

  const onCancel = () => {
    resolve(false);
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
                <img src="/assets/img/help_red.svg" alt="" width={24} height={24} className="w-8" />
                <div className="ml-2">{children}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onClick} className={classnames('alert-btn', className)}>
                OK
              </button>
              <button
                onClick={onCancel}
                className={classnames('alert-btn ml-4', className)}
                autoFocus
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </ReactModal>
  );
};
