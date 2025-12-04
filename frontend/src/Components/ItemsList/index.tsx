import React, { useState, useEffect } from "react";
import Button from "plaid-threads/Button";
import Callout from "plaid-threads/Callout";

import styles from "./index.module.scss";
import ItemDetails from "../ItemDetails";
import DeleteItemModal from "../DeleteItemModal";

interface Props {
  onBack?: () => void;
  refreshTrigger?: number;
}

interface Item {
  id: number;
  item_id: string;
  institution_name: string | null;
  institution_id: string | null;
  products: string[];
  country_codes: string[];
  created_at: string;
  updated_at: string;
  last_successful_update: string | null;
  error_code: string | null;
  error_message: string | null;
}

const ItemsList = ({ onBack, refreshTrigger }: Props) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/items?user_id=default_user");
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      const data = await response.json();
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchItems();
    }
  }, [refreshTrigger]);

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      // Refresh the list
      await fetchItems();
      setItemToDelete(null);
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Linked Accounts</h3>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Linked Accounts</h3>
        <Callout warning>{error}</Callout>
      </div>
    );
  }

  if (selectedItemId) {
    return (
      <ItemDetails
        itemId={selectedItemId}
        onBack={() => {
          setSelectedItemId(null);
          // Refresh the list when going back
          fetchItems();
        }}
        onDelete={(itemId) => setItemToDelete(itemId)}
      />
    );
  }

  return (
    <div className={styles.container}>
      {onBack && (
        <div className={styles.backButtonContainer}>
          <Button onClick={onBack} small secondary>
            ← Back to Main
          </Button>
        </div>
      )}
      <div className={styles.header}>
        <h3 className={styles.title}>Linked Accounts</h3>
        <Button onClick={fetchItems} small>
          Refresh →
        </Button>
      </div>

      {items.length === 0 ? (
        <Callout>
          No linked accounts found. Link an account to get started.
        </Callout>
      ) : (
        <div className={styles.itemsGrid}>
          {items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <h4 className={styles.institutionName}>
                  {item.institution_name || "Unknown Institution"}
                </h4>
                {item.error_code && (
                  <span className={styles.errorBadge}>Error</span>
                )}
              </div>

              <div className={styles.itemDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Products:</span>
                  <span className={styles.value}>
                    {item.products.join(", ") || "N/A"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Linked:</span>
                  <span className={styles.value}>
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Last Update:</span>
                  <span className={styles.value}>
                    {item.last_successful_update 
                      ? formatDate(item.last_successful_update)
                      : "-"}
                  </span>
                </div>
                {item.error_code && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Error:</span>
                    <span className={styles.errorValue}>
                      {item.error_code}
                      {item.error_message && ` - ${item.error_message}`}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.itemActions}>
                <Button
                  onClick={() => setSelectedItemId(item.item_id)}
                  small
                  secondary
                >
                  View Details
                </Button>
                <Button
                  onClick={() => setItemToDelete(item.item_id)}
                  small
                  className={styles.deleteButton}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {itemToDelete && (
        <DeleteItemModal
          itemId={itemToDelete}
          onConfirm={() => handleDelete(itemToDelete)}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
};

ItemsList.displayName = "ItemsList";

export default ItemsList;

