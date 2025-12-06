import React, { useState, useEffect, useContext } from 'react';
import Button from 'plaid-threads/Button';
import Context from '../../Context';
import ItemsList from '../ItemsList';
import styles from './Accounts.module.scss'; // Reuse styles

const AccountsIndex = () => {
    const { linkSuccess } = useContext(Context);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (linkSuccess) {
            setRefreshTrigger(prev => prev + 1);
        }
    }, [linkSuccess]);

    return (
        <ItemsList
            refreshTrigger={refreshTrigger}
        />
    );
};

export default AccountsIndex;
