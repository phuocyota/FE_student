import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { readDemoStudent } from "../utils/demoRegistration";

const ProtectedRoute = ({ children, allowDemo = false }) => {
  const location = useLocation();
  const token = localStorage.getItem("accessToken");

  if (!token && !(allowDemo && readDemoStudent())) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
