"use client";

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from "react-helmet";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? (
    <>
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Outlet />
    </>
  ) : (
    <Navigate to="/login" />
  );
};

export default ProtectedRoute;