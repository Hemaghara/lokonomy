import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
