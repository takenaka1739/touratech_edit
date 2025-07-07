/**
 * 郵便番号にハイフンを付与する
 *
 * @param zipCode 郵便番号
 * @returns ハイフン付郵便番号
 */
export const addHyphenZipCode: (zipCode: string) => string = zipCode => {
  if (zipCode.length >= 4 && zipCode.substr(3, 1) !== '-') {
    return zipCode.slice(0, 3) + '-' + zipCode.slice(3);
  }
  return zipCode;
};
