// resources/ts/app/App/uses/useZipcodeAddress.ts
import { useState } from 'react';

type ZipcloudResult = {
  address1: string; // 都道府県
  address2: string; // 市区町村
  address3: string; // 町域
};

/**
 * 郵便番号から住所文字列（住所1用）を取得する共通フック
 *
 * 使い方イメージ：
 *
 * const { searchAddressByZip, loading } = useZipcodeAddress();
 *
 * const handleClick = async () => {
 *   const address = await searchAddressByZip(state.zip_code);
 *   if (address) {
 *     setFieldValue('address1', address);
 *   }
 * };
 */
export const useZipcodeAddress = () => {
  const [loading, setLoading] = useState(false);

  /**
   * 郵便番号から住所を検索
   * @param rawZip ユーザー入力の郵便番号（ハイフン付きでもOK）
   * @returns 見つかった住所（都道府県＋市区町村＋町域） or null
   */
  const searchAddressByZip = async (rawZip: string | null | undefined): Promise<string | null> => {
    const zipcode = (rawZip ?? '').replace(/[^0-9]/g, '');

    if (zipcode.length !== 7) {
      alert('郵便番号はハイフンなしの7桁で入力してください。');
      return null;
    }

    setLoading(true);

    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
      const data = await res.json();

      // zipcloud のレスポンス仕様に合わせた判定
      if (data.status !== 200 || !data.results || data.results.length === 0) {
        alert('該当する住所が見つかりませんでした。');
        return null;
      }

      const result = data.results[0] as ZipcloudResult;
      const address = `${result.address1}${result.address2}${result.address3}`;
      return address;
    } catch (e) {
      console.error(e);
      alert('住所検索に失敗しました。ネットワーク環境などを確認してください。');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    searchAddressByZip,
    loading,
  };
};
