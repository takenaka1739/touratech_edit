import React, { useState } from 'react';

/**
 * アラート用 hooks
 *
 * @param onClick OKボタンクリック時の処理
 */
export const useAlert = (onClick: () => void) => {
  const [isShown, setShown] = useState(false);
  const [children, setChildren] = useState<React.ReactNode>('');

  const setAlert: (node: React.ReactNode) => void = children => {
    setChildren(children);
    setShown(true);
  };

  return {
    setAlert,
    alertProps: {
      isShown,
      children,
      onClick,
    },
  };
};
