import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PageErrors } from '@/types';
import axios from 'axios';
import { appAlert, appConfirm } from '@/components';
import { AppActions } from '@/app/App/modules/appModule';
import { useDropzone } from 'react-dropzone';

/**
 * 発送予定取込画面用 hooks
 */
export const useShipmentPlanImportDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const [state, setState] = useState<{
    c_arrival_date: string;
  }>({
    c_arrival_date: '',
  });
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isDisabled, setDisabled] = useState(false);
  const { acceptedFiles, getRootProps, getInputProps, open } = useDropzone({
    accept: '.dbf',
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  const validate: (file: File) => Promise<boolean> = async file => {
    dispatch(AppActions.request());

    let formData = new FormData();
    formData.append('file', file);
    formData.append('c_arrival_date', state.c_arrival_date);

    const res = await axios.post(`/api/${slug}/validation`, formData);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('取込に失敗しました。'));
    }
    return false;
  };

  const upload: (file: File) => Promise<boolean> = async file => {
    dispatch(AppActions.request());

    let formData = new FormData();
    formData.append('file', file);
    formData.append('c_arrival_date', state.c_arrival_date);

    const res = await axios.post(`/api/${slug}/upload`, formData);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('取込に失敗しました。'));
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

  const onClicUpload: () => void = async () => {
    if (acceptedFiles.length === 0) {
      return;
    }

    setDisabled(true);
    if (await validate(acceptedFiles[0])) {
      if (await appConfirm('取り込みを開始します。よろしいですか？')) {
        if (await upload(acceptedFiles[0])) {
          await appAlert('正常に取込されました。');
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
    setDisabled(false);
  };

  return {
    state,
    errors,
    isDisabled,
    acceptedFiles,
    getRootProps,
    getInputProps,
    open,
    onChange,
    onClicUpload,
  };
};
