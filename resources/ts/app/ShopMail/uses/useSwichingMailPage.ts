import { useCallback } from 'react';

type UseSwichingMailPageArgs = {
  setState: React.Dispatch<React.SetStateAction<any>>;
  setErrors: React.Dispatch<React.SetStateAction<any>>;
};

export const useSwichingMailPage = ({
  setState,
  setErrors,
}: UseSwichingMailPageArgs) => {

  const onChangeMailPage = useCallback(
    (name: string, value: boolean) => {
      // state 更新
      setState((prev: any) => ({
        ...prev,
        [name]: value,
      }));

      // 何か1つでもチェックが入ったらエラー解除
      setErrors((prev: any) => ({
        ...prev,
        payErrorMessage: null,
      }));
    },
    [setState, setErrors]
  );

  return {
    onChangeMailPage,
  };
};
