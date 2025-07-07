import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { InventoryImport, PageErrors } from '@/types';
import { DialogWrapper, Forms } from '@/components';
import { numberFormat } from '@/utils';
import { AppActions } from '@/app/App/modules/appModule';
import toNumber from 'lodash/toNumber';

type InventoryImportDetailDialogProps = {
  title: string;
  slug: string;
  isShown: boolean;
  state: InventoryImport;
  updateState: (props: { [key: string]: string | number | undefined }) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const InventoryImportDetailDialog: React.VFC<InventoryImportDetailDialogProps> = ({
  title,
  isShown,
  state,
  updateState,
  onSave,
  onCancel,
}) => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<PageErrors>(undefined);

  useEffect(() => {
    if (isShown) {
      setErrors(undefined);
    }
  }, [isShown]);

  const save: (state: InventoryImport) => Promise<boolean> = async state => {
    dispatch(AppActions.request());
    const res = await axios.post(`/api/inventory_import/detail`, state);

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

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    if (name === 'quantity') {
      const val = toNumber(value);
      updateState({ [name]: val, unmatch: val === state.stocks ? 0 : 1 });
    }
  };

  const onClickSave = () => {
    save(state).then(ret => {
      if (ret) {
        onSave();
      }
    });
  };

  return (
    <DialogWrapper title={`${title}明細`} isShown={isShown} onClickCancel={onCancel}>
      <div className="form-group-wrapper">
        <Forms.FormGroupInputText
          labelText="品番"
          name="item_number"
          value={state.item_number}
          className="max-w-lg"
          readOnly
          removeOptionalLabel
        />
        <Forms.FormGroupInputText
          labelText="商品名"
          name="item_name"
          value={state.item_name}
          className="max-w-lg"
          readOnly
          removeOptionalLabel
        />
        <Forms.FormGroupInputNumber
          labelText="取込数"
          name="quantity"
          value={state.quantity}
          error={errors?.quantity}
          onChange={onChange}
          precision={0}
          required
          min={0}
          max={9999}
        />
        <Forms.FormGroupInputText
          labelText="在庫数"
          name="sotcks"
          value={numberFormat(state.stocks, 0)}
          className="max-w-8 text-right"
          readOnly
          removeOptionalLabel
        />
      </div>

      <div className="mt-4 form-group">
        <button className="btn" onClick={onClickSave}>
          保存
        </button>
      </div>
    </DialogWrapper>
  );
};
