import React, { useState } from "react";
import Button from "plaid-threads/Button";
import { Products } from "plaid";

import styles from "./index.module.scss";

interface Props {
  onSelect: (products: string[]) => void;
  onCancel: () => void;
}

const AVAILABLE_PRODUCTS = [
  { value: Products.Transactions, label: "Transactions" },
  { value: Products.Investments, label: "Investments" },
  { value: Products.Auth, label: "Auth" },
  { value: Products.Identity, label: "Identity" },
  { value: Products.Assets, label: "Assets" },
  { value: Products.Liabilities, label: "Liabilities" },
  { value: Products.Statements, label: "Statements" },
];

const ProductSelector = ({ onSelect, onCancel }: Props) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    Products.Transactions,
  ]);

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const handleContinue = () => {
    if (selectedProducts.length > 0) {
      onSelect(selectedProducts);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Select Products</h3>
        <p className={styles.description}>
          Choose which Plaid products you want to enable for this account.
        </p>
        <div className={styles.productsList}>
          {AVAILABLE_PRODUCTS.map((product) => (
            <label key={product.value} className={styles.productItem}>
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.value)}
                onChange={() => toggleProduct(product.value)}
              />
              <span>{product.label}</span>
            </label>
          ))}
        </div>
        <div className={styles.actions}>
          <Button onClick={onCancel} small secondary>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            small
            disabled={selectedProducts.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

ProductSelector.displayName = "ProductSelector";

export default ProductSelector;

