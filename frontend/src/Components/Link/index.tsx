import React, { useEffect, useContext, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import Button from "plaid-threads/Button";

import Context from "../../Context";
import ProductSelector from "../ProductSelector";

const Link = () => {
  const { linkToken, isPaymentInitiation, isCraProductsExclusively, dispatch, backend } =
    useContext(Context);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[] | null>(null);
  const [pendingOpen, setPendingOpen] = useState(false);

  const onSuccess = React.useCallback(
    async (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const body = new URLSearchParams({
          public_token: public_token,
        });
        if (selectedProducts) {
          body.append('products', selectedProducts.join(','));
        }
        
        const response = await fetch("/api/set_access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: body.toString(),
        });
        if (!response.ok) {
          dispatch({
            type: "SET_STATE",
            state: {
              itemId: `no item_id retrieved`,
              accessToken: `no access_token retrieved`,
              isItemAccess: false,
            },
          });
          return false;
        }
        const data = await response.json();
        dispatch({
          type: "SET_STATE",
          state: {
            itemId: data.item_id,
            accessToken: data.access_token,
            isItemAccess: true,
          },
        });
        return true;
      };

      // 'payment_initiation' products do not require the public_token to be exchanged for an access_token.
      if (isPaymentInitiation) {
        dispatch({ type: "SET_STATE", state: { isItemAccess: false } });
        dispatch({ type: "SET_STATE", state: { linkSuccess: true } });
      } else if (isCraProductsExclusively) {
        // When only CRA products are enabled, only user_token is needed. access_token/public_token exchange is not needed.
        dispatch({ type: "SET_STATE", state: { isItemAccess: false } });
        dispatch({ type: "SET_STATE", state: { linkSuccess: true } });
      } else {
        // Wait for the database save to complete before setting linkSuccess
        const success = await exchangePublicTokenForAccessToken();
        if (success) {
          // Add a small delay to ensure database save is fully committed
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        dispatch({ type: "SET_STATE", state: { linkSuccess: true } });
      }

      window.history.pushState("", "", "/");
    },
    [dispatch, isPaymentInitiation, isCraProductsExclusively, selectedProducts]
  );

  let isOauth = false;
  // For OAuth redirects, we need the token. Otherwise, token will be generated on button click
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken || '',
    onSuccess,
  };

  if (window.location.href.includes("?oauth_state_id=") && linkToken) {
    // TODO: figure out how to delete this ts-ignore
    // @ts-ignore
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (isOauth && ready && linkToken) {
      open();
    }
  }, [ready, open, isOauth, linkToken]);
  
  // Auto-open Link when token is set after product selection
  useEffect(() => {
    if (pendingOpen && linkToken && ready) {
      const timer = setTimeout(() => {
        open();
        setPendingOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingOpen, linkToken, ready, open]);

  const handleProductSelect = async (products: string[]) => {
    setSelectedProducts(products);
    setShowProductSelector(false);
    setPendingOpen(true);
    
    // Generate link token with selected products
    const response = await fetch("/api/create_link_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ products }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.link_token) {
        dispatch({ type: "SET_STATE", state: { linkToken: data.link_token } });
        localStorage.setItem("link_token", data.link_token);
        // Set flag to open Link once token is set and ready
        setPendingOpen(true);
      }
    } else {
      // Handle error
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to create link token:", errorData);
      alert("Failed to create link token. Please check the console for details.");
      setPendingOpen(false);
    }
  };

  const handleLaunchClick = () => {
    // Always show product selector when Launch Link is clicked
    // This allows user to change products even if a token already exists
    setShowProductSelector(true);
  };

  return (
    <>
      <Button type="button" large onClick={handleLaunchClick} disabled={!backend}>
        Launch Link
      </Button>
      {showProductSelector && (
        <ProductSelector
          onSelect={handleProductSelect}
          onCancel={() => setShowProductSelector(false)}
        />
      )}
    </>
  );
};

Link.displayName = "Link";

export default Link;
