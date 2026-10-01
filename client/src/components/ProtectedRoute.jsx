import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  
  let hasValidStoredUser = false;
  try {
    const stored = localStorage.getItem("lokonomy_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's a real user object with a token
      if (parsed && parsed.token && (parsed.id || parsed._id)) {
        hasValidStoredUser = true;
      }
    }
  } catch (err) {
    hasValidStoredUser = false;
  }

  if (!isAuthenticated && !hasValidStoredUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
