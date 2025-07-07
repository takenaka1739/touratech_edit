import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useIsAdmin } from '@/app/App/uses/useApp';

/**
 * 管理者権限用の Route Component
 *
 * 権限がない場合はTOPへリダイレクトする
 *
 * @param props
 */
export const AdminRoute: React.VFC<RouteProps> = props => {
  const isAdmin = useIsAdmin();

  if (isAdmin) {
    return <Route {...props} />;
  }

  return <Redirect to="/" />;
};
