// resources/ts/components/forms/FormImage.tsx
import React from 'react';

export type FormImageProps = {
  imageSrc: string;
  // 互換用（呼び出し元で渡していても無視する）
  name?: string;
  value?: string;
  onChange?: (name: string, value: string | number | boolean | undefined) => void;
};

export const FormImage: React.VFC<FormImageProps> = ({ imageSrc }) => {
  return (
    <img
      src={imageSrc}
      alt=""
      style={{ border: '0.5px solid #BCC6D3', width: '275px', height: '275px', marginTop: '10px' }}
    />
  );
};
