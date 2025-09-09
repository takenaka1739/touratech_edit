import React, { useState, useEffect } from 'react';
//import React from 'react';
//import React, { useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ItemClassification, Image } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';
import { useCommonSearchDialogProps } from '@/app/App/uses/useCommonSearchDialogProps';
import { ItemClassificationSearchDialog } from '@/app/ItemClassification/components/ItemClassificationSearchDialog';
import { useDispatch } from 'react-redux';
import { AppActions } from '@/app/App/modules/appModule';
import axios from 'axios';
import { appAlert } from '@/components';

export type ItemClassificationDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 商品分類マスタ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const ItemClassificationDetailPage: React.VFC<ItemClassificationDetailPageProps> = () => {
  const title = '商品分類マスタ';
  //const slug = 'item_classification';
  const slug = 'item_classification';
  //const [ImageFileName, setImageFileName] = useState('');

  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    updateState,
    onChange,
    //onClickSave,
    onClickDelete,
  } = useCommonDetailPage<ItemClassification>(slug, {
    id: undefined,
    is_display: false,
    code: '',
    parent_code: undefined,
    parent_name: undefined,
    name: '',
    remarks: undefined,
    image: '',
    image_id: undefined
  });

  const {
    open: openItemClassDialog,
    searchDialogProps: itemClassSearchDialogProps,
  } = useCommonSearchDialogProps<ItemClassification>(slug, async props => {
    const { id, code, name } = props;
    updateState({
      id: id,
      //item_classification_name: name,
      name: name,
      parent_code: code,
      parent_name: name,
    });
    return true;
  });

  const [profileImage, setProfileImage] = useState('');
  const [imageName, changeImage] = useState('');
  const [imageChangeFlag, setImageChangeFlag] = useState(false);

  console.log(`profileImage：${profileImage}`);
  const onClickImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`e.target.files：${e.target.files}`);
    if (!e.target.files) return;

    // React.ChangeEvent<HTMLInputElement>よりファイルを取得
    const fileName = e.target.files[0];
    console.log(`typeof：${typeof(e.target.files)}`);
    //const fileName = e.target.files[0].name;
    //setImageFileName(fileName.name);
    // オブジェクトURLを生成し、useState()を更新
    console.log(`fileName：${fileName.name}`);
    setProfileImage(window.URL.createObjectURL(fileName));
    changeImage(fileName.name);
    setImageChangeFlag(true);

    //state['image'] = fileName.name;
  };

  //const changeImage = (fileName:File) => {
  //  state.image = fileName.name;
  //}

  useEffect(() => {
    setProfileImage('/images/' + state.image);
  }, [state.image]);

  //const handleValueChange = (newValue: string) => {
  //  //setValue(newValue);
  //};

  const dispatch = useDispatch();

  const store: () => Promise<boolean> = async () => {
    if((imageName != '') && (imageName != null)){
      dispatch(AppActions.request());
      const classState:ItemClassification = {
        id: undefined,
        is_display: state.is_display,
        code: ((state.code != null) && (state.code != '')) ? state.code : state.parent_code,
        name: ((state.name != null) && (state.name != '')) ? state.name : state.parent_name,
        parent_code: ((state.code === null) && (state.code === '')) ? '' : state.parent_code,
        parent_name: state.parent_name,
        image: '',
        image_id: undefined,
        remarks: state.remarks
      }    
      const res = await axios.post(`/api/item_classification/store`, classState);
      if (res.status === 200) {
        dispatch(AppActions.success());
        if (res.data.success) {
          return true;
        }else{
          dispatch(AppActions.failed('データの保存に失敗しました。'));
          return false;
        }
      } else {
        dispatch(AppActions.failed('データの保存に失敗しました。'));
        return false;
      }
    }else{
      dispatch(AppActions.failed('画像を設定して下さい。'));
      return false;
    }
  };

  const edit: (id: number) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const classState:ItemClassification = {
      id: state.id,
      is_display: state.is_display,
      code: state.code,
      name: state.name,
      parent_code: state.parent_code,
      parent_name: state.parent_name,
      image: state.image,
      image_id: state.image_id,
      remarks: state.remarks
    }

    const res = await axios.put(`/api/${slug}/edit/${id}`, classState);
    console.log(`edit.res：${res.status}`);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        if(!imageChangeFlag) appAlert('保存しました。');
        return true;
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const imageStore: () => Promise<boolean> = async () => {
    dispatch(AppActions.request());
    const imageState:Image = {
      id: state.image_id,
      category_id: undefined,
      item_id: undefined,
      name: imageName,
      order_by: undefined
    }
    const res = await axios.post(`/api/item_classification/image_store`, imageState);
    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        appAlert('保存しました。');
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const imageEdit: (id: number|undefined) => Promise<boolean> = async id => {
    dispatch(AppActions.request());
    const imageState:Image = {
      id: state.image_id,
      category_id: state.id,
      item_id: undefined,
      name: imageName,
      order_by: undefined
    }
    const res = await axios.put(`/api/${slug}/image_edit/${id}`, imageState);

    if (res.status === 200) {
      dispatch(AppActions.success());
      if (res.data.success) {
        appAlert('保存しました。');
        return true;
      }
    } else {
      dispatch(AppActions.failed('データの保存に失敗しました。'));
    }
    return false;
  };

  const click: () => void = async () => {
    state.image = imageName;
    //onClickSave();
    console.log(`state.id：${state.id}`);
    console.log(`state.image_id：${state.image_id}`);
    if(state.id === undefined){
      if(await store()) await imageStore();
    }else{
      if(await edit(state.id)) imageEdit(state.image_id);
    }
  }

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <div>
          <Forms.FormGroup
            labelText="ショップへの公開"
            error={errors?.is_display}
            groupClassName="items-center mt-4"
          >
            <Forms.FormInputCheck
              id="is_display"
              name="is_display"
              checked={state.is_display}
              onChange={onChange}
            />
          </Forms.FormGroup>
        </div>
        <div style={{display: 'flex'}}>
          <div className="py-2 px-4" style={{width: '60%'}}>
            <Forms.FormGroup labelText="商品分類名（親）" error={errors?.id}>
              <div className="flex">
                <Forms.FormInputText
                  name="parent_name"
                  //value={state.item_classification_name ?? ''}
                  value={state.parent_name}
                  error={errors?.parent_name}
                  className="max-w-lg"
                  onChange={onChange}
                />
                <input
                  type="hidden"
                  name="category_id"
                  value={state.id ?? ''}
                />
                <button className="btn ml-2 py-0 px-2" onClick={openItemClassDialog}>
                  ...
                </button>
              </div>
            </Forms.FormGroup>
            <Forms.FormGroupInputText
              labelText="商品分類コード（親）"
              name="parent_code"
              //value={((state.parent_code != null) && (state.parent_code != '')) ? state.parent_code : state.code}
              value={state.parent_code}
              error={errors?.code}
              onChange={onChange}
              groupClassName="mt-0"
              className=" max-w-lg my-2"
              required
              autoFocus
              maxLength={30}
            />
            <ItemClassificationSearchDialog {...itemClassSearchDialogProps} />
            <Forms.FormGroupInputText
              labelText="商品分類名"
              name="name"
              //value={((state.parent_code != null) && (state.parent_code != '')) ? state.name : ''}
              value={state.name}
              error={errors?.name}
              onChange={onChange}
              groupClassName="mt-0"
              className=" max-w-lg"
              required
              autoFocus
              maxLength={30}
            />
            <Forms.FormGroupInputText
              labelText="商品分類コード"
              name="code"
              //value={((state.parent_code != null) && (state.parent_code != '')) ? state.code : ''}
              value={ state.code}
              error={errors?.code}
              onChange={onChange}
              groupClassName="mt-0"
              className=" max-w-lg mt-2"
              required
              autoFocus
              maxLength={30}
            />
            <Forms.FormGroupTextarea
              labelText="備考"
              name="remarks"
              value={state.remarks}
              error={errors?.remarks}
              onChange={onChange}
              className=" max-w-lg"
              maxLength={200}
            />
          </div>
          <div className="mt-5">
            <div>
              <label className='btn py-7'>
                ...
                <input className='w-1' type="file"
                       onChange={(event) => onClickImageSelect(event)} style={{visibility: 'hidden'}}/>
              </label>
              <p/>
            </div>
            <Forms.FormImage
              name={state.image}
              imageSrc={profileImage}
              value={state.image}
              onChange={onChange}
            />
            {console.log(`state.image：${state.image}`)}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <button className="btn" onClick={() => click()} disabled={isDisabled}>
          保存
        </button>
        {id && (
          <button className="btn-delete" onClick={onClickDelete} disabled={isDisabled}>
            削除
          </button>
        )}
      </div>
    </PageWrapper>
  );
};
