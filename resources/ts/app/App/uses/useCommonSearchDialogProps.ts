import { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { AppActions } from '@/app/App/modules/appModule';

interface SearchDialog {
  id: number | undefined;
}

/**
 * 検索ダイアログ表示共通 hooks
 *
 * @param string slug
 * @param selectedFunc
 */
export const useCommonSearchDialogProps = <T extends SearchDialog>(
  slug: string,
  selectedFunc: (props: T) => Promise<boolean>,
  selectedFuncBefore?: (props: T) => Promise<boolean>,
  selectedFuncName?: string
) => {
  const dispatch = useDispatch();
  const [isShown, setIsShown] = useState(false);

  const onSelected: (props: T) => Promise<boolean> = async props => {
    if (props.id) {
      if (selectedFuncBefore && !(await selectedFuncBefore(props))) {
        setIsShown(false);
        return false;
      }

      dispatch(AppActions.request());
      const res = await axios.get(`/api/${slug}/${selectedFuncName ?? 'selected'}/${props.id}`);

      if (res.status === 200) {
        dispatch(AppActions.success());
        if (!(await selectedFunc(res.data.data))) {
          setIsShown(false);
          return false;
        }
      } else {
        dispatch(AppActions.failed('一覧の取得に失敗しました。'));
      }
    } else {
      dispatch(AppActions.failed('一覧の取得に失敗しました。'));
    }
    setIsShown(false);
    return true;
  };

  return {
    open: () => setIsShown(true),
    searchDialogProps: {
      isShown,
      onSelected,
      onCancel: () => setIsShown(false),
    },
  };
};
