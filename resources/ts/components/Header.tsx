import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { Nav } from '@/components';
import { useUserName, useIsOther } from '@/app/App/uses/useApp';

/**
 * ヘッダー Component
 */
export const Header: React.VFC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const userName = useUserName();
  const isOther = useIsOther();

  const onClick: () => void = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <header className="header">
        <div className="header__container">
          <div className="header__left">
            <Link to={'/'} className="mr-4">
              <img
                src="/assets/img/logo-txt.svg"
                alt="ツアラテックジャパン"
                width={150}
                height={25}
              />
            </Link>
            <Link to={'/'}>{process.env.MIX_APP_NAME}</Link>
          </div>
          <div className="header__right">
            {!isOther && (
              <div
                className={classnames(['header__btn-nav', isOpen && 'is-open'])}
                onClick={onClick}
              >
                <span />
              </div>
            )}
            <div className="text-sm">担当者名：{userName}</div>
            <a href="/logout" className="header__btn-logout">
              ログアウト
            </a>
          </div>
        </div>
      </header>
      <Nav isOpen={isOpen} onClick={onClick} />
    </div>
  );
};
