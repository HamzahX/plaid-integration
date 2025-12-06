import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './Components/Layout/Layout';
import Home from './Components/Home/Home';
import Accounts from './Components/Accounts/Accounts';
import AccountsIndex from './Components/Accounts/AccountsIndex';
import AccountDetails from './Components/AccountDetails/AccountDetails';

// Helper to handle OAuth redirect preservation
const OAuthHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isOAuthRedirect = location.search.includes('oauth_state_id');

  if (isOAuthRedirect && location.pathname === '/') {
    return <Navigate to={`/accounts${location.search}`} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <OAuthHandler>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="accounts" element={<Accounts />}>
              <Route index element={<AccountsIndex />} />
              <Route path=":itemId" element={<AccountDetails />} />
            </Route>
          </Route>
        </Routes>
      </OAuthHandler>
    </BrowserRouter>
  );
};

export default App;
