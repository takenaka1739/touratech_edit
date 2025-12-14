
import { SpecialSale } from '@/types';
import { DialogWrapper } from '@/components';
import { Forms } from '@/components';
import { useEffect } from 'react';
import { useState } from 'react';
import { PageErrors } from '@/types';
import { useDispatch } from 'react-redux';
import { AppActions } from '@/app/App/modules/appModule';

/**
 * 特売設定画面 Component
 *
 * @param props
 */

type SpecialSalesProps = {
  state: any;
  isShown: boolean;
  isLoading: boolean;
  isSetItem?: boolean | undefined;

  onValueChange: (value: SpecialSale) => void;
  onClickCancel: () => void;
}

export const SpecialSalesDialog: React.VFC<SpecialSalesProps> = ({
  isShown,
  onClickCancel,
  onValueChange,
  state,
}) => {

  const dispatch = useDispatch();
  const [initialState, setState] = useState(state);
  const [errors, setErrors] = useState<PageErrors>(undefined);

  useEffect(() => {setState(state)}, [state]);

  const onChange = (name: string, value: string | number | boolean | undefined) => {
    setState((prev: any) => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const onSettClick = () => {
    if(initialState.start_at == null || initialState.end_at == null){
      dispatch(AppActions.failed('必須項目を入力してください'));
    }else{
      onValueChange(initialState);
      onClickCancel();
    }
  };

  const clickCancel = () => {
    initialState.specialSalesDelFlag = false;
    onChange('is_sales_members_only', state.is_sales_members_only);
    onChange('start_at', state.start_at);
    onChange('end_at', state.end_at);
    onChange('special_sale_price', state.special_sale_price);
    onChange('refund_rate', state.refund_rate);
    onClickCancel();
  } 

  const onDeleteClick = () => {
    initialState.specialSalesDelFlag = true;
    //onChange('is_sales_members_only', false);
    //onChange('start_at', undefined);
    //onChange('end_at', undefined);
    //onChange('special_sale_price', 0);
    //onChange('refund_rate', 0);

    initialState.is_sales_members_only = false;
    initialState.start_at = undefined;
    initialState.end_at = undefined;
    initialState.special_sale_price = undefined;
    initialState.refund_rate = undefined;

    onClickCancel();
  }

  return (
    <DialogWrapper title="特売設定"
    isShown={isShown}
    onClickCancel={() => clickCancel()}
    >
      <div className="w-40">
        <div className="form-group">
          <Forms.FormGroup
            labelText="会員専用販売"
            error={errors?.is_sales_members_only}
            groupClassName="items-center mt-4"
          >
            <Forms.FormInputCheck
              id="is_sales_members_only"
              name="is_sales_members_only"
              checked={initialState.is_sales_members_only}
              onChange={onChange}
            />
          </Forms.FormGroup>
        </div>
      </div>
      <Forms.FormGroupInputDate
        labelText="開始日"
        name="start_at"
        value={initialState.start_at ? new Date(initialState.start_at) : null}
        onChange={onChange}
        required
      />
      <Forms.FormGroupInputDate
        labelText="終了日"
        name="end_at"
        value={initialState.end_at ? new Date(initialState.end_at) : null}
        onChange={onChange}
        required
      />
      <Forms.FormGroupInputNumber
        labelText="特売価格"
        name="special_sale_price"
        value={initialState.special_sale_price}
        error={errors?.special_sale_price}
        onChange={onChange}
        precision={2}
        className="max-w-8"
        min={0}
      />
      <div style={{ display: 'flex', width: '375px'}}>
        <Forms.FormGroupInputNumber
          labelText="ポイント還元の設定"
          name="refund_rate"
          value={initialState.refund_rate}
          error={errors?.refund_rate}
          onChange={onChange}
          precision={2}
          className="max-w-8"
          min={0}
        />
        <span
          style={{
            marginTop: '20px',
            width: '100px',
            fontSize: '12px',
            padding: '0px',
            lineHeight: '1',
            display: 'inline-block',
            verticalAlign: 'bottom',
            color: '#465165'
          }}
        >
          ポイント
        </span>
      </div>
      <div className="flex justify-between" style={{marginTop: '50px'}}>
        <div>
          <button className="btn" onClick={() => onSettClick()}> {/*disabled={isDisabled}>*/}
            設定
          </button>
        </div>
        {/*{id &&*/} { (
          <button className="btn-delete" onClick={() => onDeleteClick()}> {/*disabled={isDisabled}>*/}
            削除
          </button>
        )}
      </div>
    </DialogWrapper>
  )
};

