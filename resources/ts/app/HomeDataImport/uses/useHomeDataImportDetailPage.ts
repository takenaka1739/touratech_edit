import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PageErrors } from '@/types';
import axios from 'axios';
import { appAlert, appConfirm } from '@/components';
import { AppActions } from '@/app/App/modules/appModule';
import { useDropzone } from 'react-dropzone';

/**
 * 本国商品データ取込画面用 hooks
 */
export const useHomeDataImportDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const { acceptedFiles, getRootProps, getInputProps, open } = useDropzone({
    accept: '.xls',
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  const upload: (file: File) => Promise<boolean> = async file => {
    dispatch(AppActions.request());

    let formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(`/api/${slug}/upload`, formData);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);

        const { file_id, file_name } = res.data.data;
        const link = document.createElement('a');
        link.href = `/web/${slug}/output/${file_id}`;
        link.download = file_name;
        link.click();

        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('取込に失敗しました。'));
    }
    return false;
  };

  const onClickSave: () => void = async () => {
    if (acceptedFiles.length === 0) {
      return;
    }

    if (await appConfirm('取り込みを開始します。よろしいですか？')) {
      if (await upload(acceptedFiles[0])) {
        await appAlert('完了しました。');
      } else {
        window.scrollTo(0, 0);
      }
    }
  };

  return {
    errors,
    acceptedFiles,
    getRootProps,
    getInputProps,
    open,
    onClickSave,
  };
};
