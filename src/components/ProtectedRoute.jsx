import React, { useSyncExternalStore } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isUsableAccessToken } from "../utils/accessToken";

const hasUsableToken = () => {
  try {
    return isUsableAccessToken(localStorage.getItem("accessToken"));
  } catch {
    return false;
  }
};

const subscribeToToken = (onChange) => {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  // Same-tab storage changes do not emit a storage event. Also detect expiry.
  const timer = window.setInterval(onChange, 1000);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
    window.clearInterval(timer);
  };
};

const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
  const location = useLocation();
  const hasToken = useSyncExternalStore(subscribeToToken, hasUsableToken, () => false);

  if (!hasToken) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
