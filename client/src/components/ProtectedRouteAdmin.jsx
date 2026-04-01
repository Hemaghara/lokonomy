import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { adminService } from "../services";

const ProtectedRouteAdmin = () => {
  const [isVerified, setIsVerified] = useState(null);
  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    const verify = async () => {
      if (!adminToken) {
        setIsVerified(false);
        return;
      }
      try {
        await adminService.verify();
        setIsVerified(true);
      } catch (error) {
        console.error("Admin verification failed", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setIsVerified(false);
      }
    };
    verify();
  }, [adminToken]);

  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-indigo-400">
           <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
           <p className="font-medium">Authenticating Admin...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRouteAdmin;
