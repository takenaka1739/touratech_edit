export type FormProps = {
  name: string;
  error?: string | string[] | undefined;
  onChange?: (name: string, value: string | number | boolean | undefined) => void;
};
