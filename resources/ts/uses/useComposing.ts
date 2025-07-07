import { useState } from 'react';

export const useComposing = () => {
  const [composing, setComposing] = useState(false);

  const onCompositionStart: () => void = () => {
    setComposing(true);
  };

  const onCompositionEnd: () => void = () => {
    setComposing(false);
  };

  return { composing, onCompositionStart, onCompositionEnd };
};
