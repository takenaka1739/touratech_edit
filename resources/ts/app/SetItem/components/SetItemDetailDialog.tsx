import React, { useEffect } from 'react';
import { Item, SetItemDetail } from '@/types';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { DialogWrapper, Forms } from '@/components';
import { useSetItemDetailDialog } from '../uses/useSetItemDetailDialog';
import { ItemSearchDialog } from '@/app/Item/components/ItemSearchDialog';

export type SetItemDetailDialogProps = {
  isShown: boolean;
  state: SetItemDetail;
  updateState: <K extends keyof SetItemDetail>(props: { [key in K]?: SetItemDetail[K] }) => void;
  selectedFuncBefore?: (props: Item) => Promise<boolean>;
  onSelected: (detail: SetItemDetail) => void;
  onDeleted: (id: number) => void;
  onCancel: () => void;
};

/**
 * セット品マスタ（明細）画面 Component
 *
 * @param props
 */
export const SetItemDetailDialog: React.VFC<SetItemDetailDialogProps> = ({
  isShown,
  state,
  selectedFuncBefore,
  updateState,
  onSelected,
  onDeleted,
  onCancel,
}) => {
  const { errors, setErrors, save } = useSetItemDetailDialog();
  const {
    open: openItemDialog,
    searchDialogProps: itemSearchDialogProps,
  } = useCommonSearchDialogProps<Item>(
    'item',
    async props => {
      const { id, item_number, name, name_jp, sales_unit_price } = props;
      updateState({
        item_id: id,
        item_number: item_number,
        item_name: name,
        item_name_jp: name_jp,
        sales_unit_price,
      });
      setErrors({ ...errors, item_id: '' });
      return true;
    },
    selectedFuncBefore
  );

  useEffect(() => {
    if (isShown) {
      setErrors(undefined);
    }
  }, [isShown]);

  const onChange: (name: string, value: string | number | boolean | undefined) => void = (
    name,
    value
  ) => {
    updateState({ [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const onClickSave: () => void = () => {
    save(state).then(ret => {
      if (ret) {
        onSelected(state);
      }
    });
  };

  const onClickDelete: () => void = () => {
    if (state.id) {
      onDeleted(state.id);
    }
  };

  return (
    <DialogWrapper title="セット品マスタ明細" isShown={isShown} onClickCancel={onCancel}>
      <div className="form-group-wrapper">
        <div>
          <Forms.FormGroup labelText="品番" required error={errors?.item_id} groupClassName="mt-0">
            <div className="flex">
              <Forms.FormInputText
                name="item_number"
                value={state.item_number}
                error={errors?.item_id}
                className="max-w-lg"
                readOnly
              />
              <input type="hidden" name="item_id" value={state.item_id ?? ''} />
              <button className="btn ml-2 py-0 px-2" onClick={openItemDialog}>
                ...
              </button>
            </div>
          </Forms.FormGroup>
          <ItemSearchDialog {...itemSearchDialogProps} isSetItem={false} />
        </div>
        <Forms.FormGroupInputText
          labelText="商品名"
          name="item_name"
          value={state.item_name ?? ''}
          className="max-w-lg"
          readOnly
          removeOptionalLabel
        />
        <Forms.FormGroupInputText
          labelText="商品名（納品書）"
          name="item_name_jp"
          value={state.item_name_jp}
          className="max-w-lg"
          readOnly
          removeOptionalLabel
        />
        <div className="w-1/2">
          <Forms.FormGroupInputNumber
            labelText="数量"
            name="quantity"
            value={state.quantity}
            error={errors?.quantity}
            onChange={onChange}
            precision={0}
            className="max-w-8"
            required
            min={0}
            max={999}
          />
        </div>
        <div className="flex flex-wrap max-w-2xl">
          <div className="w-1/2">
            <Forms.FormGroupInputNumber
              labelText="売上単価<br>（セット時）"
              name="set_price"
              value={state.set_price}
              error={errors?.set_price}
              onChange={onChange}
              precision={2}
              className="max-w-8"
              required
              min={0}
            />
          </div>
          <div className="w-1/2">
            <Forms.FormGroupInputText
              labelText="売上単価"
              name="sales_unit_price"
              value={state.sales_unit_price ?? ''}
              className="max-w-8 text-right"
              readOnly
              removeOptionalLabel
            />
          </div>
        </div>
      </div>

      <div className="mt-4 form-group flex justify-between">
        <button className="btn" onClick={onClickSave}>
          保存
        </button>
        {state?.id != undefined && (
          <button className="btn-delete" onClick={onClickDelete}>
            削除
          </button>
        )}
      </div>
    </DialogWrapper>
  );
};
