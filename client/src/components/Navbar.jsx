import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { chatService } from "../services";
import { connectSocket } from "../services/socket";

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user.id);

    socket.on("newMessageNotification", () => {
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socket.off("newMessageNotification");
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await chatService.getUnreadCount();
        if (res.data.success) setUnreadCount(res.data.count);
      } catch (_) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "Explore", path: "/explore" },
    { name: "Market", path: "/market" },
    { name: "Jobs", path: "/jobs" },
    { name: "Stories", path: "/stories" },
    { name: "Feed", path: "/feed" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a0f]/90 backdrop-blur-2xl border-b border-white/8 py-2 shadow-2xl shadow-black/40"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/home" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-primary rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 opacity-60 blur-sm" />
              <div className="relative w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                L
              </div>
            </div>
            <span className="text-lg font-black tracking-tight text-white hidden sm:block">
              Loko<span className="text-primary">nomy</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-3.5 py-2 text-[13px] font-semibold text-white/50 hover:text-white transition-all duration-200 rounded-lg hover:bg-white/6 group"
              >
                {link.name}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-4" />
              </Link>
            ))}

            <div className="w-px h-5 bg-white/10 mx-2" />

            <div className="flex items-center gap-1">
              {user ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1">
                    <Link
                      to="/my-orders"
                      className="px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white uppercase tracking-wider hover:bg-white/6 rounded-lg transition-all duration-200"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/sales-management"
                      className="px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white uppercase tracking-wider hover:bg-white/6 rounded-lg transition-all duration-200"
                    >
                      Sell
                    </Link>
                    <Link
                      to="/my-chats"
                      className="relative px-3 py-1.5 text-[11px] font-bold text-white/40 hover:text-white uppercase tracking-wider hover:bg-white/6 rounded-lg transition-all duration-200"
                      onClick={() => setUnreadCount(0)}
                    >
                      Chats
                      <AnimatePresence>
                        {unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 25,
                            }}
                            className="absolute -top-1.5 -right-1 min-w-4.5 h-4.5 bg-violet-500 rounded-full flex items-center justify-center text-[9px] text-white font-black px-1 shadow-lg shadow-violet-500/50 ring-2 ring-[#0a0a0f]"
                          >
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </div>

                  <div className="w-px h-6 bg-white/10" />

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 group bg-white/5 hover:bg-white/10 pl-2 pr-4 py-1.5 rounded-2xl border border-white/8 hover:border-white/15 transition-all duration-200"
                  >
                    <div className="w-7 h-7 bg-linear-to-br from-primary to-violet-600 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-md shadow-primary/30 ring-2 ring-white/10">
                      {user.name?.[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-[12px] font-bold text-white">
                        {user.name?.split(" ")[0]}
                      </span>
                      <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mt-0.5">
                        Profile
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
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
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20"
            aria-label="Toggle menu"
          >
            <motion.svg
              key={isOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="w-4.5 h-4.5"
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
            </motion.svg>
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-[#0d0d14]/98 backdrop-blur-2xl border-t border-white/8"
            >
              <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      {link.name}
                      <svg
                        className="w-3.5 h-3.5 text-white/15"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </motion.div>
                ))}

                <div className="mt-3 pt-4 border-t border-white/8">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all"
                      >
                        <div className="w-9 h-9 bg-linear-to-br from-primary to-violet-600 rounded-full flex items-center justify-center font-black text-sm text-white ring-2 ring-white/10">
                          {user.name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                            Profile Settings
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/my-chats"
                        onClick={() => {
                          setIsOpen(false);
                          setUnreadCount(0);
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all text-[14px] font-semibold"
                      >
                        <span className="text-base">💬</span>
                        My Chats
                        {unreadCount > 0 && (
                          <span className="ml-auto min-w-5.5 h-5.5 bg-violet-500 rounded-full flex items-center justify-center text-[10px] text-white font-black px-1 shadow-lg shadow-violet-500/40">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/my-orders"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all text-[14px] font-semibold"
                      >
                        <span className="text-base">📦</span>
                        My Orders
                      </Link>

                      <Link
                        to="/sales-management"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all text-[14px] font-semibold"
                      >
                        <span className="text-base">🏷️</span>
                        Sell
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-all text-[14px] font-bold mt-1"
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
                        Logout
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/"
                      onClick={() => setIsOpen(false)}
                      className="btn-primary block text-center text-xs uppercase tracking-widest font-bold py-3"
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
    </>
  );
};

export default Navbar;
