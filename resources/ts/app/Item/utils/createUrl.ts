export const createUrl: (template: string, item_number: string | undefined) => string = (
  template,
  item_number
) => {
  const url = item_number ? template.replace('#item_number#', item_number ?? '') : '';
  return url;
};
