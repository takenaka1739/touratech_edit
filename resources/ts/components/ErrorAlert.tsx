import React, { useEffect } from 'react';
import { appAlert } from '@/components';
import { useApp, useError } from '@/app/App/uses/useApp';

/**
 * エラーアラート Component
 */
export const ErrorAlert: React.VFC = () => {
  const { clearError } = useApp();
  const error = useError();

  useEffect(() => {
    const alert = async () => {
      if (error) {
        await appAlert(error, 'error');
        clearError();
      }
    };
    alert();
  }, [error]);

  return <></>;
};
