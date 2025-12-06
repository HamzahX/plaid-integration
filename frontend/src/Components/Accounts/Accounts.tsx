import React, { useEffect, useContext, useCallback } from "react";
import Callout from "plaid-threads/Callout";
import { Outlet } from "react-router-dom";

import Header from "../Headers";
import Context from "../../Context";
import styles from "./Accounts.module.scss";

const Accounts = () => {
    const { dispatch, environment } = useContext(Context);

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
            localStorage.setItem("link_token", data.link_token);
        },
        [dispatch]
    );

    useEffect(() => {
        const init = async () => {
            if (window.location.href.includes("?oauth_state_id=")) {
                dispatch({
                    type: "SET_STATE",
                    state: {
                        linkToken: localStorage.getItem("link_token"),
                    },
                });
                return;
            }
            await getInfo();
        };
        init();
    }, [dispatch, getInfo]);

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
                <div style={{ width: '100%' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Accounts;
