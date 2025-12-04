import React from "react";
import Button from "plaid-threads/Button";
import Callout from "plaid-threads/Callout";

import styles from "./index.module.scss";

interface Props {
  itemId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteItemModal = ({ itemId, onConfirm, onCancel }: Props) => {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Delete Linked Account</h3>
        <Callout warning>
          <div>
            Are you sure you want to delete this linked account? This action
            will:
          </div>
          <ul className={styles.warningList}>
            <li>Remove the item from Plaid</li>
            <li>Delete all stored data for this item</li>
            <li>Permanently revoke access to this account</li>
          </ul>
          <div>
            <strong>This action cannot be undone.</strong>
          </div>
        </Callout>
        <div className={styles.itemId}>
          <strong>Item ID:</strong> {itemId}
        </div>
        <div className={styles.actions}>
          <Button onClick={onCancel} small secondary>
            Cancel
          </Button>
          <Button onClick={onConfirm} small className={styles.deleteButton}>
            Delete Item
          </Button>
        </div>
      </div>
    </div>
  );
};

DeleteItemModal.displayName = "DeleteItemModal";

export default DeleteItemModal;

