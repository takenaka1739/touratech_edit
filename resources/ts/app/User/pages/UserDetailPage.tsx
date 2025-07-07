import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { User } from '@/types';
import { PageWrapper, Forms } from '@/components';
import { useCommonDetailPage } from '@/app/App/uses/useCommonDetailPage';

export type UserDetailPageProps = {} & RouteComponentProps<{ id: string }>;

/**
 * 担当者マスタ（詳細）画面 Component
 *
 * @param props
 * @param props.match.params.id - IDが設定されている場合は更新
 */
export const UserDetailPage: React.VFC<UserDetailPageProps> = () => {
  const title = '担当者マスタ';
  const slug = 'user';
  const {
    isLoading,
    id,
    state,
    errors,
    isDisabled,
    updateState,
    onChange,
    onClickSave,
    onClickDelete,
  } = useCommonDetailPage<
    {
      is_update_password: boolean;
    } & User
  >(slug, {
    id: undefined,
    name: '',
    login_id: '',
    password: undefined,
    role: 0,
    is_update_password: false,
  });

  // パスワード変更フラグが変更された場合
  const onChangeEditable: (isEditable: boolean) => void = isEditable => {
    if (!isEditable) {
      updateState({ password: undefined, is_update_password: false });
    } else {
      updateState({ is_update_password: true });
    }
  };

  return (
    <PageWrapper
      prefix={`${slug}-detail`}
      title={title}
      breadcrumb={[{ name: title, url: `/${slug}` }, { name: `${title}詳細` }]}
      isLoading={isLoading}
    >
      <div className="form-group-wrapper">
        <Forms.FormGroupInputText
          labelText="担当者名"
          name="name"
          value={state.name}
          error={errors?.name}
          onChange={onChange}
          groupClassName="mt-0"
          className="max-w-lg"
          required
          autoFocus
          maxLength={30}
        />
        <Forms.FormGroupInputText
          labelText="ID"
          name="login_id"
          value={state.login_id}
          error={errors?.login_id}
          onChange={onChange}
          className="max-w-10"
          required
          maxLength={10}
        />
        <Forms.FormGroupPassword
          labelText="パスワード"
          name="password"
          value={state.password ?? ''}
          error={errors?.password}
          onChange={onChange}
          className="max-w-10"
          required
          isUpdate={id ? true : false}
          onChangeEditable={onChangeEditable}
          maxLength={20}
        />
        <Forms.FormGroupInputRadio
          labelText="権限"
          name="role"
          value={state.role}
          error={errors?.role}
          onChange={onChange}
          items={[
            {
              labelText: '一般',
              id: 'role_0',
              value: 0,
            },
            {
              labelText: '管理者',
              id: 'role_1',
              value: 1,
            },
            {
              labelText: '外部',
              id: 'role_2',
              value: 2,
            },
          ]}
          required={true}
        />
      </div>
      <div className="flex justify-between">
        <button className="btn" onClick={onClickSave} disabled={isDisabled}>
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
