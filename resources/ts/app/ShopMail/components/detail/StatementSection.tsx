import React from 'react';
import { Forms } from '@/components';

type Props = {
  state: any;
  errors: any;
  onChange: (name: string, value: any) => void;
  saveClick: (value: any) => void;
};

export const StatementSection: React.VFC<Props> = ({
  state,
  errors,
  onChange,
}) => {
  return (
    <>
    { /* ご注文番号 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="ご注文番号"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="ご注文番号"
          id="1"
          checked={true}
        />
      </div>
      { /* 発注日 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="発注日"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="発注日1"
          id="2"
          checked={true}
          />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="非表示"
          name="発注日2"
          id="2"
          checked={true}
          />
      </div>
      { /* 商品コード */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="商品コード"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="商品コード1"
          id="2"
          checked={true}
          />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="非表示"
          name="商品コード2"
          id="2"
          checked={true}
          />
      </div>
      { /* 商品名 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="商品名"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="商品名1"
          id="2"
          checked={true}
          />
      </div>
      { /* 型番 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="型番"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="型番"
          id="2"
          checked={true}
        />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="型番"
          id="2"
          checked={true}
        />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="非表示"
          name="型番"
          id="2"
          checked={true}
        />
      </div>
      { /* バリエーション */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="バリエーション"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="バリエーション1"
          id="2"
          checked={true}
        />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="バリエーション2"
          id="2"
          checked={true}
        />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="非表示"
          name="バリエーション3"
          id="2"
          checked={true}
        />
      </div>
      { /* 税込単価 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="税込単価"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="税込単価1"
          id="2"
          checked={true}
        />
      </div>
      { /* 注文数 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="注文数"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="注文数1"
          id="2"
          checked={true}
        />
      </div>
      { /* 小計 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="小計"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="小計1"
          id="2"
          checked={true}
        />
      </div>
      { /* お買い上げ金額(税込) */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="お買い上げ金額(税込)"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="お買い上げ金額1"
          id="2"
          checked={true}
        />
      </div>
      { /* 送料(税込) */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="送料(税込)"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="送料1"
          id="2"
          checked={true}
        />
      </div>
      { /* 別途追加送料(税込) */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="別途追加送料(税込)"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="別途追加送料1"
          id="2"
          checked={true}
        />
      </div>
      { /* 利用ポイント数 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="利用ポイント数"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="利用ポイント数1"
          id="2"
          checked={true}
        />
      </div>
      { /* 獲得予定ポイント数 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="獲得予定ポイント数"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="獲得予定ポイント数1"
          id="2"
          checked={true}
        />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="非表示"
          name="獲得予定ポイント数2"
          id="2"
          checked={true}
        />
      </div>
      { /* 合計 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="合計"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="合計1"
          id="2"
          checked={true}
        />
      </div>
      { /* 代引き手数料(税込) */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="代引き手数料(税込)"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="代引き手数料1"
          id="2"
          checked={true}
        />
      </div>
      { /* コンビニ決済手数料(税込) */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="コンビニ決済手数料(税込)"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="コンビニ決済手数料1"
          id="2"
          checked={true}
        />
      </div>
      { /* お支払方法 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="お支払方法"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="表示"
          name="お支払方法1"
          id="2"
          checked={true}
        />
      </div>
      { /* 配送希望日 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="配送希望日"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="配送希望日1"
          id="2"
          checked={true}
        />
      </div>
      { /* 配送希望時間帯 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="配送希望時間帯"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="配送希望時間帯1"
          id="2"
          checked={true}
        />
      </div>
      { /* ラッピング */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="ラッピングする"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="ラッピング1"
          id="2"
          checked={true}
        />
      </div>
      { /* 代金振込口座 */}
      <div style={{display: 'flex', marginTop: '5px'}}>
        <div style={{width: '674px'}}>
          <Forms.FormGroupInputText
            labelText="代金振込口座"
            name="item_number"
            value={state.item_number}
            error={errors?.item_number}
            onChange={onChange}
            groupClassName="mt-0"
            className="max-w-lg"
            required
            autoFocus
          />
        </div>
        <Forms.FormInputRadio
          className='ml-2'
          labelText="自動的に表示"
          name="代金振込口座1"
          id="2"
          checked={true}
        />
        <Forms.FormInputRadio
          className='ml-2'
          labelText="非表示"
          name="代金振込口座2"
          id="2"
          checked={true}
        />
      </div>
    </>
  );
};