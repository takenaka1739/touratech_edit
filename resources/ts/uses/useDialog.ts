import { useState } from 'react';

/**
 * ダイアログ用 hooks
 *
 * @param initialValue
 */
export const useDialog: (
  initialValue: boolean
) => [boolean, () => void, () => void] = initialValue => {
  const [isShown, setIsShown] = useState(initialValue);
  const open = () => setIsShown(true);
  const close = () => setIsShown(false);
  return [isShown, open, close];
};
