// resources/ts/components/forms/FormImage.tsx
import React from 'react';

type FormImageProps = {
  imageSrc: string;
  /** 呼び出し側互換のため任意にしておく */
  name?: string;
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
