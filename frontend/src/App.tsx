import React, { useEffect, useContext, useCallback, useState } from "react";
import Button from "plaid-threads/Button";
import Callout from "plaid-threads/Callout";

import Header from "./Components/Headers";
import ItemsList from "./Components/ItemsList";
import Context from "./Context";

import styles from "./App.module.scss";

const App = () => {
  const { linkSuccess, isPaymentInitiation, itemId, dispatch, environment } =
    useContext(Context);
  const [showItemsList, setShowItemsList] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const isProduction = environment === 'production';

  const getInfo = useCallback(async () => {
    const response = await fetch("/api/info", { method: "POST" });
    if (!response.ok) {
      dispatch({ type: "SET_STATE", state: { backend: false } });
      return { paymentInitiation: false };
    }
    const data = await response.json();
    const paymentInitiation: boolean =
      data.products.includes("payment_initiation");

    // CRA products are those that start with "cra_"
    const craProducts = data.products.filter((product: string) =>
      product.startsWith("cra_")
    );
    const isUserTokenFlow: boolean = craProducts.length > 0;
    const isCraProductsExclusively: boolean =
      craProducts.length > 0 && craProducts.length === data.products.length;

    dispatch({
      type: "SET_STATE",
      state: {
        products: data.products,
        isPaymentInitiation: paymentInitiation,
        isCraProductsExclusively: isCraProductsExclusively,
        isUserTokenFlow: isUserTokenFlow,
        environment: data.environment || null,
      },
    });
    return { paymentInitiation, isUserTokenFlow };
  }, [dispatch]);

  const generateUserToken = useCallback(async () => {
    const response = await fetch("api/create_user_token", { method: "POST" });
    if (!response.ok) {
      dispatch({ type: "SET_STATE", state: { userToken: null } });
      return;
    }
    const data = await response.json();
    if (data) {
      if (data.error != null) {
        dispatch({
          type: "SET_STATE",
          state: {
            linkToken: null,
            linkTokenError: data.error,
          },
        });
        return;
      }
      dispatch({ type: "SET_STATE", state: { userToken: data.user_token } });
      return data.user_token;
    }
  }, [dispatch]);

  const generateToken = useCallback(
    async (isPaymentInitiation: boolean) => {
      // Link tokens for 'payment_initiation' use a different creation flow in your backend.
      const path = isPaymentInitiation
        ? "/api/create_link_token_for_payment"
        : "/api/create_link_token";
      const response = await fetch(path, {
        method: "POST",
      });
      if (!response.ok) {
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }
      const data = await response.json();
      if (data) {
        if (data.error != null) {
          dispatch({
            type: "SET_STATE",
            state: {
              linkToken: null,
              linkTokenError: data.error,
            },
          });
          return;
        }
        dispatch({ type: "SET_STATE", state: { linkToken: data.link_token } });
      }
      // Save the link_token to be used later in the Oauth flow.
      localStorage.setItem("link_token", data.link_token);
    },
    [dispatch]
  );

  useEffect(() => {
    const init = async () => {
      // do not generate a new token for OAuth redirect; instead
      // setLinkToken from localStorage
      if (window.location.href.includes("?oauth_state_id=")) {
        dispatch({
          type: "SET_STATE",
          state: {
            linkToken: localStorage.getItem("link_token"),
          },
        });
        return;
      }

      // Don't generate token on load - wait for user to click "Launch Link"
      // Token will be generated when user selects products
      await getInfo();
    };
    init();
  }, [dispatch, getInfo]);

  // When link is successful, show items list and refresh it
  useEffect(() => {
    if (linkSuccess) {
      setShowItemsList(true);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [linkSuccess]);

  return (
    <div className={styles.App}>
      {isProduction && (
        <div className={styles.productionBanner}>
          <Callout warning>
            <strong>⚠️ PRODUCTION MODE</strong> - You are connected to Plaid's production environment. 
            All actions will result in <strong>real, billable charges</strong>. Linking accounts will 
            start monthly subscription fees. Use with caution.
          </Callout>
        </div>
      )}
      <div className={styles.container}>
        <Header />
        {!showItemsList && (
          <div className={styles.viewAccountsButton}>
            <Button onClick={() => setShowItemsList(true)} large>
              View Linked Accounts
            </Button>
          </div>
        )}
        {showItemsList && (
          <ItemsList 
            onBack={() => setShowItemsList(false)} 
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
};

export default App;
