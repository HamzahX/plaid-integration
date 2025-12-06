import React, { useContext } from "react";
import Callout from "plaid-threads/Callout";

import Link from "../Link";
import Context from "../../Context";

import styles from "./index.module.scss";

const Header = () => {
  const {
    backend,
  } = useContext(Context);

  return (
    <div className={styles.grid}>
      <h3 className={styles.title}>Plaid Quickstart</h3>

      <h4 className={styles.subtitle}>
        End-to-end integration with Plaid
      </h4>
      {/* message if backend is not running */}
      {!backend ? (
        <Callout warning>
          Unable to connect to backend: please make sure your backend server
          is running and that your .env file has been configured with your
          <code>PLAID_CLIENT_ID</code> and <code>PLAID_SECRET</code>.
        </Callout>
      ) : (
        <div className={styles.linkButton}>
          <Link />
        </div>
      )}
    </div>
  );
};

Header.displayName = "Header";

export default Header;
