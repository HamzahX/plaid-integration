import React, { useState, useEffect } from "react";
import Button from "plaid-threads/Button";
import Callout from "plaid-threads/Callout";

import styles from "./index.module.scss";
import DeleteItemModal from "../DeleteItemModal";

interface Account {
  account_id: string;
  name: string;
  type: string;
  subtype: string | null;
}

interface ItemDetailsData {
  id: number;
  item_id: string;
  access_token?: string;
  institution_name: string | null;
  institution_id: string | null;
  products: string[];
  country_codes: string[];
  created_at: string;
  updated_at: string;
  last_successful_update: string | null;
  error_code: string | null;
  error_message: string | null;
  accounts?: Account[];
  item?: any;
  institution?: any;
}

interface Props {
  itemId: string;
  onBack: () => void;
  onDelete: (itemId: string) => void;
}

const ItemDetails = ({ itemId, onBack, onDelete }: Props) => {
  const [item, setItem] = useState<ItemDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/items/${itemId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch item details");
        }
        const data = await response.json();
        setItem(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
        console.error("Error fetching item details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [itemId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Button onClick={onBack} small secondary>
          ← Back to List
        </Button>
        <p>Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={styles.container}>
        <Button onClick={onBack} small secondary>
          ← Back to List
        </Button>
        <Callout warning>{error || "Item not found"}</Callout>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button onClick={onBack} small secondary>
          ← Back to List
        </Button>
        <Button 
          onClick={() => setShowDeleteModal(true)} 
          small
          className={styles.deleteButton}
        >
          Delete Item
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Institution Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Institution:</span>
              <span className={styles.value}>
                {item.institution_name || "Unknown"}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Item ID:</span>
              <div className={styles.valueContainer}>
                <span className={styles.value}>{item.item_id}</span>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(item.item_id, 'item_id')}
                  aria-label="Copy item ID"
                  title="Copy to clipboard"
                >
                  {copiedField === 'item_id' ? '✓' : '📋'}
                </button>
              </div>
            </div>
            {item.access_token && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Access Token:</span>
                <div className={styles.tokenContainer}>
                  <span className={styles.value}>
                    {showAccessToken ? item.access_token : "•".repeat(20)}
                  </span>
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    aria-label={showAccessToken ? "Hide token" : "Show token"}
                  >
                    {showAccessToken ? "👁️" : "👁️‍🗨️"}
                  </button>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(item.access_token!, 'access_token')}
                    aria-label="Copy access token"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'access_token' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.label}>Products:</span>
              <span className={styles.value}>{item.products.join(", ")}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Country Codes:</span>
              <span className={styles.value}>
                {item.country_codes.join(", ")}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Created:</span>
              <span className={styles.value}>{formatDate(item.created_at)}</span>
            </div>
            {item.last_successful_update && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Last Update:</span>
                <span className={styles.value}>
                  {formatDate(item.last_successful_update)}
                </span>
              </div>
            )}
          </div>
        </div>

        {item.error_code && (
          <div className={styles.section}>
            <Callout warning>
              <div>
                <strong>Error Code:</strong> {item.error_code}
              </div>
              {item.error_message && (
                <div>
                  <strong>Error Message:</strong> {item.error_message}
                </div>
              )}
            </Callout>
          </div>
        )}

        {item.accounts && item.accounts.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Accounts</h3>
            <div className={styles.accountsList}>
              {item.accounts.map((account) => (
                <div key={account.account_id} className={styles.accountCard}>
                  <div className={styles.accountHeader}>
                    <h4 className={styles.accountName}>{account.name}</h4>
                    <span className={styles.accountType}>
                      {account.type}
                      {account.subtype && ` - ${account.subtype}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && item && (
        <DeleteItemModal
          itemId={item.item_id}
          onConfirm={async () => {
            try {
              const response = await fetch(`/api/items/${item.item_id}`, {
                method: "DELETE",
              });
              if (!response.ok) {
                throw new Error("Failed to delete item");
              }
              setShowDeleteModal(false);
              // Navigate back to list (parent will refresh when it re-renders)
              onBack();
            } catch (err) {
              console.error("Error deleting item:", err);
              alert("Failed to delete item. Please try again.");
              setShowDeleteModal(false);
            }
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

ItemDetails.displayName = "ItemDetails";

export default ItemDetails;

