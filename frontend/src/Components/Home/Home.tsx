import React from 'react';
import styles from './Home.module.scss';

const Home = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Welcome back!</h1>
            <p className={styles.message}>
                Manage your linked accounts and view your financial data from the sidebar.
            </p>
        </div>
    );
};

export default Home;
