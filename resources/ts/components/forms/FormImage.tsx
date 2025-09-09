//import React, { ChangeEvent } from 'react';
import { FormProps } from './FormProps';

type FormImagePops = {
  imageSrc: any;
  value: string;
}

export const FormImage: React.VFC<FormProps & FormImagePops> = ({
  imageSrc,
  value,
  //name,
  //onChange,
}) => {

  //const onChangeRaw: (e: ChangeEvent<HTMLInputElement>) => void = (e) => {
  //  if (typeof onChange === 'function') {
  //    if (onChange.length === 2 && name !== undefined) {
  //      // 旧形式: onChange(name, value)
  //      onChange(name, e.currentTarget.value);
  //    } else {
  //      // 新形式: onChange(value)
  //      (onChange as unknown as (value: string) => void)(e.currentTarget.value);
  //    }
  //  }
  //};

const a = () => {
  
}

  console.log(`value：${value}`);

  return (
    <img
           src={imageSrc}
           onChange={a}
           //name={value}
           //onChange={onChangeRaw}
           style={{border: '0.5px solid #BCC6D3', width: '275px', height: '275px', marginTop: '10px'}}/>
    //<img src={imageSc} onChange={onChangeRaw} style={{border: '0.5px solid #BCC6D3', width: '275px', height: '275px', marginTop: '10px'}}/>
  );
  //console.log(`imageSrc：${imageSrc}`);
}