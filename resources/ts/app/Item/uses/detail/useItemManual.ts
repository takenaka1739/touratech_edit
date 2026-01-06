import { useState, useEffect, useRef } from 'react';

type UseItemManualArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * 商品マスタの「取扱説明書設定」用フックス。
 * 
 * - 題目名
 * - ファイルアップロード
 * - 取扱説明書（PDF）
 */
export const useItemManual = ({ state, setState }: UseItemManualArgs) => {
  const [typeName, setTypeName] = useState('');
  const [typeNameBackColor, setTypeNameBackColor] = useState('#EDF2F7');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // ==============================================================
  // 題目名入力変更
  // ==============================================================
  const onChangeTypeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTypeName(event.target.value);
  };

  // ==============================================================
  // type_status に応じた題目名設定
  // ==============================================================
  useEffect(() => {
    let name: string | undefined = '';

    if (state.type_status === 0) {
      name = 'なし';
    } else if (state.type_status === 1) {
      name = '取扱説明書';
    } else if (state.type_status === 2) {
      name = 'サイズ表';
    } else {
      // type_status === 3 → 自由入力
      setTypeNameBackColor('#FFFFFF');
      setState((prev: any) => ({
        ...prev,
        type_name: typeName,
      }));
    }

    if (state.type_status !== 3) {
      setTypeName('');
      setTypeNameBackColor('#EDF2F7');
      setState((prev: any) => ({
        ...prev,
        type_name: name,
      }));
    }
  }, [state.type_status, typeName, setState]);

  // ==============================================================
  // state.type_name の復元
  // ==============================================================
  useEffect(() => {
    if (state.type_status === 3) {
      if (state.type_name) setTypeName(state.type_name ?? '');
    }
  }, [state.type_name, state.type_status]);

  // ==============================================================
  // ファイルアップロード
  // ==============================================================
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);

      setState((prev: any) => ({
        ...prev,
        file_name: file.name,
        document_url: url,
        pdf: file,
      }));
    }
  };

  // ==============================================================
  // ファイル選択ダイアログを開く
  // ==============================================================
  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return {
    typeName,
    typeNameBackColor,
    inputRef,
    onChangeTypeName,
    handleFileChange,
    handleClick,
    setTypeName,
  };
};
