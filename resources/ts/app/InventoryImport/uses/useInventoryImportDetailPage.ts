import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { PageErrors, Pager, InventoryImport } from '@/types';
import axios from 'axios';
import { appConfirm, appAlert } from '@/components';
import { AppActions } from '@/app/App/modules/appModule';
import { useDropzone, DropEvent } from 'react-dropzone';
import toNumber from 'lodash/toNumber';
import { useInventoryImportDetailDialogProps } from './useInventoryImportDetailDialogProps';

interface InventoryImportConditions {
  c_inventory_month?: string;
  c_unmatch?: number;
  page: number;
}

const initialState = {
  hasMonth: false,
  isLoaded: false,
  hasInventory: false,
  hasInventoryImport: false,
  rows: [],
  pager: undefined,
};

const initialConditions = {
  c_inventory_month: '',
  c_unmatch: 1,
  page: 1,
};

/**
 * 発送予定取込画面用 hooks
 */
export const useInventoryImportDetailPage = (slug: string) => {
  const dispatch = useDispatch();
  const [state, setState] = useState<{
    hasMonth: boolean;
    isLoaded: boolean;
    hasInventory: boolean;
    hasInventoryImport: boolean;
    rows: InventoryImport[];
    pager: Pager | undefined;
  }>(initialState);
  const [conditions, setConditions] = useState<InventoryImportConditions>(initialConditions);
  const [errors, setErrors] = useState<PageErrors>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisabled, setDisabled] = useState(false);
  const [curFile, setCurFile] = useState<File>();

  const onDropAccepted: <T extends File>(
    acceptedFiles: T[],
    event: DropEvent
  ) => void = useCallback(
    acceptedFiles => {
      setCurFile(acceptedFiles[0]);
    },
    [curFile]
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    accept: '.xlsx',
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    onDropAccepted,
  });

  const updateDetails: (details: InventoryImport[]) => void = details => {
    setState({ ...state, rows: details });
  };

  const { open: openDetailDialog, detailDialogProps } = useInventoryImportDetailDialogProps(
    state.rows,
    updateDetails
  );

  const initialize: () => void = () => {
    setState(initialState);
    setConditions(initialConditions);
    setErrors(undefined);
    setCurFile(undefined);
  };

  const setNumber = (rows: InventoryImport[]) => {
    return rows.map((x, i) => {
      return {
        ...x,
        no: i + 1,
      };
    });
  };

  const fetch: (props: InventoryImportConditions) => Promise<boolean> = async props => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/${slug}/fetch`, { ...conditions, ...props });

    if (res) {
      if (res.status === 200) {
        dispatch(AppActions.success());

        if (res.data.success) {
          setIsLoading(false);
          setConditions({ ...conditions, ...props });
          const { rows, pager, hasInventory, hasInventoryImport } = res.data.data;
          setState({
            ...state,
            rows: setNumber(rows),
            pager,
            hasInventory,
            hasInventoryImport,
            isLoaded: true,
          });
          return true;
        } else {
          setErrors(res.data.errors);
        }
      } else {
        dispatch(AppActions.failed('一覧の取得に失敗しました。'));
      }
    }
    return false;
  };

  const validateUpload: (file: File) => Promise<boolean> = async file => {
    dispatch(AppActions.request());

    let formData = new FormData();
    formData.append('file', file);
    formData.append('c_inventory_month', conditions.c_inventory_month ?? '');

    const res = await axios.post(`/api/${slug}/validate_upload`, formData);
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
    formData.append('c_inventory_month', conditions.c_inventory_month ?? '');
    formData.append('c_unmatch', String(conditions.c_unmatch));

    const res = await axios.post(`/api/${slug}/upload`, formData);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        const { rows, pager } = res.data.data;
        setState({
          ...state,
          rows: setNumber(rows),
          pager,
          hasInventoryImport: true,
          isLoaded: true,
        });
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('取込に失敗しました。'));
    }
    return false;
  };

  const output: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/output`, conditions);
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

  const confirm: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());

    const res = await axios.post(`/api/${slug}/confirm`, conditions);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        setErrors(undefined);
        return true;
      } else {
        setErrors(res.data.errors);
      }
    } else {
      dispatch(AppActions.failed('在庫確定に失敗しました。'));
    }
    return false;
  };

  const onChangeDate: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    if (conditions.c_inventory_month !== value) {
      setErrors({});
    }
    setConditions({ ...conditions, [name]: value ?? undefined });
    if ((value ?? '') === '') {
      setState({ ...state, hasMonth: false });
    } else {
      setState({ ...state, hasMonth: true });
    }
  };

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    if (name === 'c_unmatch') {
      fetch({ c_unmatch: toNumber(value), page: 1 });
    }
    setConditions({ ...conditions, [name]: value });
  };

  const onClickLoad: () => void = async () => {
    fetch({ page: 1 });
  };

  const onClicUpload: () => void = async () => {
    if (curFile === undefined) {
      return;
    }

    setDisabled(true);
    if (await validateUpload(curFile)) {
      if (await appConfirm('取り込みを開始します。よろしいですか？')) {
        if (await upload(curFile)) {
          // await appAlert('正常に取込されました。');
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
    setDisabled(false);
  };

  const onClickEditDetail: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void = e => {
    openDetailDialog(e.currentTarget.dataset.no);
  };

  const onChangePage: (page: number) => void = page => {
    if (conditions.page === page) {
      return;
    }

    fetch({ page });
  };
  const onClickOutput: () => void = async () => {
    setDisabled(true);
    await output();
    setDisabled(false);
  };

  const onClickConfirm: () => void = async () => {
    setDisabled(true);
    if (await appConfirm('在庫確定を開始します。よろしいですか？')) {
      if (await confirm()) {
        await appAlert('正常に在庫確定されました。');
        initialize();
      } else {
        window.scrollTo(0, 0);
      }
    }
    setDisabled(false);
  };

  return {
    conditions,
    state,
    errors,
    isLoading,
    isDisabled,
    curFile,
    detailDialogProps,
    openDetailDialog,
    getRootProps,
    getInputProps,
    open,
    onChangeDate,
    onChange,
    onClickLoad,
    onClicUpload,
    onClickEditDetail,
    onChangePage,
    onClickOutput,
    onClickConfirm,
  };
};
