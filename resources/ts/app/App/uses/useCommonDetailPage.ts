import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { PageErrors } from '@/types';
import { appAlert, appConfirm } from '@/components';
import { AppActions } from '@/app/App/modules/appModule';
import { useIdFromParams } from '@/uses';

/**
 * 詳細画面共通 hooks
 */
export const useCommonDetailPage = <T>(slug: string, initialState: T) => {
  const id = useIdFromParams();
  const dispatch = useDispatch();
  const [state, setState] = useState<T>(initialState);
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isDisabled, setDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  const backPage = () => history.push(`/${slug}`);

  const updateState: <K extends keyof T>(
    props: {
      [key in K]?: T[K];
    }
  ) => void = props => {
    setState({ ...state, ...props });
  };

  const updateErrors = <K extends keyof T>(props: { [key in K]: string }) => {
    setErrors({ ...errors, ...props });
  };

  useEffect(() => {
    if (id) {
      get(id).then(ret => {
        if (ret) {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const get: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.get(`/api/${slug}/edit/${id}`);

    if (res.status === 200) {
      setState(res.data.data);

      dispatch(AppActions.success());
      return true;
    } else {
      // dispatch(AppActions.failed('データの取得に失敗しました。'));
      dispatch(AppActions.success());
      history.push('/404');
    }
    return false;
  };

  const store: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/store`, state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const edit: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.put(`/api/${slug}/edit/${id}`, state);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const destroy: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const res = await axios.delete(`/api/${slug}/delete/${id}`);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        return true;
      } else {
        if (res.data.errMsg) {
          await appAlert(res.data.errMsg, 'error');
        }
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('データの削除に失敗しました。'));
    }
    return false;
  };

  const output: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, state);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.target = '_blank';
        link.click();

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('出力に失敗しました。'));
    }
    return false;
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    setState({ ...state, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onClickSave: () => void = async () => {
    setDisabled(true);
    if (id) {
      if (await edit(id)) {
        await appAlert('保存しました。');
        backPage();
        return;
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      if (await store()) {
        await appAlert('保存しました。');
        backPage();
        return;
      } else {
        window.scrollTo(0, 0);
      }
    }
    setDisabled(false);
  };

  const onClickDelete: () => void = async () => {
    setDisabled(true);
    if (id) {
      if (await appConfirm('削除します。よろしいですか？')) {
        if (await destroy(id)) {
          await appAlert('削除しました。');
          backPage();
          return;
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
    setDisabled(false);
  };

  const onClickOutput: () => void = async () => {
    setDisabled(true);
    await output();
    setDisabled(false);
  };

  return {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    history,
    updateState,
    updateErrors,
    onChange,
    onClickSave,
    onClickDelete,
    onClickOutput,
  };
};
