import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.scss';
import classnames from 'classnames';

const Layout = () => {
    return (
        <div className={styles.layout}>
            <nav className={styles.sidebar}>
                <div style={{ marginBottom: '32px', paddingLeft: '16px', fontWeight: 'bold', fontSize: '1.2em' }}>
                    Plaid Quickstart
                </div>
                <NavLink
                    to="/"
                    className={({ isActive }) => classnames(styles.navItem, { [styles.active]: isActive })}
                    end
                >
                    Home
                </NavLink>
                <NavLink
                    to="/accounts"
                    className={({ isActive }) => classnames(styles.navItem, { [styles.active]: isActive })}
                >
                    Accounts
                </NavLink>
            </nav>
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
