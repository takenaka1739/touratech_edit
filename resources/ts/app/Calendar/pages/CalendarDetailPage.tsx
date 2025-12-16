import React from 'react';
//import { PageWrapper, Forms } from '@/components';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { Calendar } from '@/types';
import { useState, useEffect } from 'react';
//import { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
//import { COMPANY_LEVEL } from '@/constants';
//import { numberFormat } from '@/utils';

export type CalendarDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 環境設定画面 Component
 */
export const CalendarDetailPage: React.VFC<CalendarDetailPageProps> = () => {
  const title = 'カレンダーマスタ';
  const slug = 'calendar';
  const {
    //isLoading,
    //id,
    state,
    errors,
    //isDisabled,
    setState,
    //updateState,
    //updateErrors,
    onChange,
    //setErrors,
    //onChangeItem,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<Calendar>(slug, {
    id: undefined,
    name: '',
    start_at: '',
    end_at: '',
    is_monday: false,
    is_tuesday: false,
    is_wednesday: false,
    is_thursday: false,
    is_friday: false,
    is_saturday: false,
    is_sunday: false,
    font_color: '',
    back_color: '',
    trans_flag: false
  });

  const [backColorFlag, setBackColorFlag] = useState(false);
  const [backColorHold, setBackColorHold] = useState<string | undefined>();

  useEffect(() => {
    if(state.back_color === '#EDF2F7'){
      setState(prev => ({
        ...prev,
        trans_flag: true
        })
      )
      setBackColorFlag(true);
    }else{
      setState(prev => ({
        ...prev,
        trans_flag: false
        })
      )
      setBackColorFlag(false);
    }
  }, [state.back_color, state.trans_flag]);

  const CheckBackColorFlag = () => {
    setBackColorFlag(!backColorFlag);
    checktransFlag();
  }

  const checktransFlag = () => {
    if(!backColorFlag){
      setBackColorHold(state.back_color);
      setState(prev => ({
        ...prev,
        back_color: '#EDF2F7',
        trans_flag: true
        })
      )
    }else{
      setState(prev => ({
        ...prev,
        back_color: backColorHold,
        trans_flag: false
        })
      )
    }
  }

  const changeColor = (state: number, event: any) => {
    if(state === 1){
      setState(prev => ({
        ...prev,
        font_color: event
        })
      )
    }else{
      setState(prev => ({
        ...prev,
        back_color: event
        })
      )
    }
  }

  console.log('state');
  console.log(state);

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: 'カレンダーマスタ', url: `/${slug}` }, { name: `${title}詳細` }]}
    >
      <div className="form-group-wrapper">
        <Forms.FormGroupInputText
          labelText="イベント名"
          name="name"
          value={state.name}
          error={errors?.name}
          onChange={onChange}
          className="max-w-lg"
          required
          maxLength={400}
        />
        <div style={{ display: 'flex', marginLeft: '21px', marginTop: '15px'}}>
          <p style={{ fontSize: '13px', color: '#4a5568', marginTop: '3px'}}>開始日 / 終了日</p>
          <span style={{alignSelf: 'flex-start', backgroundColor: '#c53030', marginTop: '3px', border: '1px solid #c53030', color: '#fff', 
                        marginLeft: '0.5rem', fontSize: '0.75rem', borderRadius: '0.125rem', paddingLeft: '0.25rem', paddingRight: '0.25rem'}}>
            必須
          </span>
          <div style={{ display: 'flex', marginLeft: '10px'}}>
            <Forms.FormInputDate
              name="start_at"
              value={state.start_at ? new Date(state.start_at) : null}
              error={errors?.start_at}
              onChange={onChange}
            />
            <p style={{marginLeft: '10px', marginRight: '10px'}}>～</p>
            <Forms.FormInputDate
              name="end_at"
              value={state.end_at ? new Date(state.end_at) : null}
              error={errors?.end_at}
              onChange={onChange}
            />
          </div>
        </div>

        <div style={{ display: 'flex', marginLeft: '58px', marginTop: '15px'}}>
          <p style={{ fontSize: '13px', color: '#4a5568'}}>定期曜日</p>
          <span style={{alignSelf: 'flex-start', marginLeft: '0.5rem', backgroundColor: '#a0aec0', border: '1px solid #a0aec0', color: '#fff', fontSize: '0.75rem',
                     borderRadius: '0.125rem', paddingLeft: '0.25rem', paddingRight: '0.25rem'}}>
            任意
          </span>
          <div style={{ display: 'flex', marginLeft: '10px'}}>
            <Forms.FormInputCheck
              id="is_monday"
              name="is_monday"
              labelText="月"
              checked={state.is_monday}
              onChange={onChange}
            />
            <Forms.FormInputCheck
              id="is_tuesday"
              name="is_tuesday"
              labelText="火"
              checked={state.is_tuesday}
              onChange={onChange}
            />
            <Forms.FormInputCheck
              id="is_wednesday"
              name="is_wednesday"
              labelText="水"
              checked={state.is_wednesday}
              onChange={onChange}
            />
            <Forms.FormInputCheck
              id="is_thursday"
              name="is_thursday"
              labelText="木"
              checked={state.is_thursday}
              onChange={onChange}
            />
            <Forms.FormInputCheck
              id="is_friday"
              name="is_friday"
              labelText="金"
              checked={state.is_friday}
              onChange={onChange}
            />
            <Forms.FormInputCheck
              id="is_saturday"
              name="is_saturday"
              labelText="土"
              checked={state.is_saturday}
              onChange={onChange}
            />
            <Forms.FormInputCheck
              id="is_sunday"
              name="is_sunday"
              labelText="日"
              checked={state.is_sunday}
              onChange={onChange}
            />
          </div>
        </div>
        <div style={{ display: 'flex', marginLeft: '45px', marginTop: '15px' }}>
          <p style={{ fontSize: '13px', color: '#4a5568'}}>文字色を選択</p>
          <span style={{alignSelf: 'flex-start', backgroundColor: '#c53030', marginTop: '3px', border: '1px solid #c53030', color: '#fff', 
                        marginLeft: '0.5rem', fontSize: '0.75rem', borderRadius: '0.125rem', paddingLeft: '0.25rem', paddingRight: '0.25rem'}}>
            必須
          </span>
          <input
            type="color"
            value={state.font_color == '' ? state.font_color = '#000000' : state.font_color}
            onChange={(e) => changeColor(1, e.target.value)}
            style={{ marginLeft: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', marginLeft: '45px', marginTop: '15px' }}>
          <p style={{ fontSize: '13px', color: '#4a5568'}}>背景色を選択</p>
          <span style={{alignSelf: 'flex-start', backgroundColor: '#c53030', marginTop: '3px', border: '1px solid #c53030', color: '#fff', 
                        marginLeft: '0.5rem', fontSize: '0.75rem', borderRadius: '0.125rem', paddingLeft: '0.25rem', paddingRight: '0.25rem'}}>
            必須
          </span>
          <input
            type="color"
            value={state.back_color == '' ? state.back_color = '#FFFFFF' : state.back_color}
            onChange={(e) => changeColor(2, e.target.value)}
            style={{ marginLeft: '10px', marginRight: '10px'}}
            disabled={backColorFlag === true}
          />
          <Forms.FormInputCheck
            id="back_color"
            name="back_color"
            labelText="なし"
            checked={state.trans_flag}
            onChange={() => CheckBackColorFlag()}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        {/*<button className="btn" onClick={onClickSave} disabled={isDisabled}>*/}
        <button className="btn" onClick={onClickSave}>
          保存
        </button>
        <button className="btn" onClick={onClickDelete}>
          削除
        </button>
      </div>
    </PageWrapper>
  );
};
