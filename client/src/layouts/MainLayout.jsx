import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-text-primary">
      <Navbar />
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
