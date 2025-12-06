import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ItemDetails from '../ItemDetails';
import Button from 'plaid-threads/Button';
import styles from './AccountDetails.module.scss'; // We'll create a simple style for the back button container

const AccountDetails = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const navigate = useNavigate();

    if (!itemId) {
        return <div>Item ID not found</div>;
    }

    return (
        <div>
            <ItemDetails
                itemId={itemId}
                onDelete={() => navigate('/accounts')}
                onBack={() => navigate('/accounts')} // Item details might have its own back, but we override functionality via routing usually
            />
        </div>
    );
};

export default AccountDetails;
