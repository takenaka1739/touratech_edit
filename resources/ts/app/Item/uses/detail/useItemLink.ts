import { useState, useEffect } from 'react';

type UseItemLinkArgs = {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
};

/**
 * 商品マスタの「国外リンク」用フックス。
 * 
 * - 題目名
 */
export const useItemLink = ({ state, setState }: UseItemLinkArgs) => {
  const [linkName, setLinkName] = useState('');
  const [linkNameBackColor, setTypeNameBackColor] = useState('#EDF2F7');

  // ==============================================================
  // 国外リンク入力変更
  // ==============================================================
  const onChangeLinkName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLinkName(event.target.value);
  };

  // ==============================================================
  // type_status_link に応じた題目名設定
  // ==============================================================
  useEffect(() => {
    let name: string | undefined = '';

    if (state.type_status_link === 0) {
      name = 'なし';
    } else if (state.type_status_link === 1) {
      name = '取扱説明書';
    } else if (state.type_status_link === 2) {
      name = 'サイズ表';
    } else {
      // type_status_link === 3 → 自由入力
      setTypeNameBackColor('#FFFFFF');
      setState((prev: any) => ({
        ...prev,
        type_name_link: linkName,
      }));
    }

    if (state.type_status_link !== 3) {
      setLinkName('');
      setTypeNameBackColor('#EDF2F7');
      setState((prev: any) => ({
        ...prev,
        type_name_link: name,
      }));
    }
  }, [state.type_status_link, linkName, setState]);

  // ==============================================================
  // state.type_name_link の復元
  // ==============================================================
  useEffect(() => {
    if (state.type_status_link === 3) {
      if (state.type_name_link) setLinkName(state.type_name_link ?? '');
    }
  }, [state.type_name_link, state.type_status_link]);

  return {
    linkName,
    linkNameBackColor,
    onChangeLinkName,
    setLinkName,
  };
};
