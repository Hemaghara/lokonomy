import React from "react";
import { Navigate } from "react-router-dom";
import useAdminPermission from "../../hooks/useAdminPermission";
import { toast } from "react-hot-toast";

/**
 * Guard component to protect admin routes based on permissions.
 * @param {string} permission - The permission key required (e.g., 'canManageUsers').
 * @param {React.ReactNode} children - The component to render if authorized.
 */
const AdminGuard = ({ permission, children }) => {
  const permissions = useAdminPermission();
  const isAuthorized = permission ? permissions[permission] : true;

  if (!isAuthorized) {
    toast.error("Access Denied: You do not have permission to view this page.");
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default AdminGuard;
