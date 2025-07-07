export const toHalfNumber: (str: string) => string = str => {
  return str.replace(/[０-９]/g, s => {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
};
