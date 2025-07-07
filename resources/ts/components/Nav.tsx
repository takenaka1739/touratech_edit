import React from 'react';
import { Link } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { useIsAdmin } from '@/app/App/uses/useApp';
import { APP_MENU } from '@/constants/APP_MENU';

/**
 * @param onClick - リンククリック時の処理
 */
type NavProps = {
  isOpen: boolean;
  onClick: () => void;
};

/**
 * メニュー Component
 *
 * @param props
 */
export const Nav: React.VFC<NavProps> = ({ isOpen, onClick }) => {
  const isAdmin = useIsAdmin();

  return (
    <CSSTransition in={isOpen} classNames="fade" timeout={400}>
      <nav className="nav">
        <div className="nav__container">
          <div className="nav__menu">
            <h3 className="nav__h3">伝票</h3>
            <div className="nav__menu-box">
              <ul className="mt-2">
                {APP_MENU.slip.map((x, i) => (
                  <li key={i} className="py-1">
                    <Link to={x.url} onClick={onClick}>
                      {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="nav__menu">
            <h3 className="nav__h3">取込</h3>
            <div className="nav__menu-box">
              <ul className="mt-2">
                {APP_MENU.capture.map((x, i) => (
                  <li key={i} className="py-1">
                    <Link to={x.url} onClick={onClick}>
                      {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="nav__menu">
            <h3 className="nav__h3">月締</h3>
            <div className="nav__menu-box">
              <ul className="mt-2">
                {APP_MENU.monthClosing.map((x, i) => (
                  <li key={i} className="py-1">
                    <Link to={x.url} onClick={onClick}>
                      {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="nav__menu">
            <h3 className="nav__h3">棚卸</h3>
            <div className="nav__menu-box">
              <ul className="mt-2">
                {APP_MENU.inventory.map((x, i) => (
                  <li key={i} className="py-1">
                    <Link to={x.url} onClick={onClick}>
                      {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {isAdmin && (
            <div className="nav__menu">
              <h3 className="nav__h3">マスタ</h3>
              <div className="nav__menu-box">
                <ul className="mt-2">
                  {APP_MENU.master.map((x, i) => (
                    <li key={i} className="py-1">
                      <Link to={x.url} onClick={onClick}>
                        {x.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </nav>
    </CSSTransition>
  );
};
