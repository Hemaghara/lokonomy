import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";

const Navbar = () => {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "Explore", path: "/explore" },
    { name: "Market", path: "/market" },
    { name: "Jobs", path: "/jobs" },
    { name: "Stories", path: "/stories" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-dark-bg/80 backdrop-blur-lg border-b border-white/5 py-3" : "bg-transparent py-5"}`}
    >
      <div className="container flex items-center justify-between">
        <Link
          to="/home"
          className="text-xl font-bold tracking-tight text-white flex items-center gap-2 transition-transform hover:scale-105"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm shadow-lg shadow-primary/20">
            L
          </div>
          Lokonomy
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-sm font-medium text-text-dim hover:text-white transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-1">
                <Link
                  to="/my-orders"
                  className="text-white/60 hover:text-white transition-colors flex flex-col items-center gap-0.5 group"
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100">
                    Orders
                  </span>
                </Link>
                <Link
                  to="/sales-management"
                  className="text-white/60 hover:text-white transition-colors flex flex-col items-center gap-0.5 group"
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100">
                    Sell
                  </span>
                </Link>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-3 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5 transition-all"
              >
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-primary/20">
                  {user.name?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white leading-none">
                    {user.name?.split(" ")[0]}
                  </span>
                  <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest mt-0.5">
                    Profile
                  </span>
                </div>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              to="/"
              className="btn-primary py-2 px-6 text-xs uppercase tracking-widest font-bold"
            >
              Login
            </Link>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-text-dim hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 md:hidden bg-card-bg border-b border-white/10 p-6 shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-text-dim hover:text-white flex items-center justify-between"
                >
                  {link.name}
                  <span className="text-white/10">→</span>
                </Link>
              ))}
              <div className="pt-6 mt-2 border-t border-white/5">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-text-dim"
                    >
                      <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xs">
                        {user.name?.[0].toUpperCase()}
                      </div>
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="text-red-500/60 text-sm font-bold uppercase tracking-widest px-1"
                    >
                      Logout Account
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="btn-primary block text-center text-xs uppercase tracking-widest font-bold"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
export default Navbar;
