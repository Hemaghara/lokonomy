import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { chatService } from "../services";
import { connectSocket } from "../services/socket";
import NotificationBell from "./NotificationBell";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import {
  Home,
  Compass,
  ShoppingBag,
  Briefcase,
  Library,
  LayoutGrid,
  Map as MapIcon,
  Menu,
  X,
  LogOut,
  Crown,
  Gem,
  Heart,
  Package,
  Tag,
  ChevronRight,
  Bell,
  Search,
  MessageCircle,
  User as UserIcon,
  Zap,
  Star,
} from "lucide-react";

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
    {
      name: "Home",
      path: "/home",
      icon: <Home className="w-5 h-5 md:w-4 md:h-4 text-white" />,
    },
    {
      name: "Explore",
      path: "/explore",
      icon: <Compass className="w-5 h-5 md:w-4 md:h-4 text-white" />,
    },
    {
      name: "Market",
      path: "/market",
      icon: <ShoppingBag className="w-5 h-5 md:w-4 md:h-4 text-white " />,
    },
    {
      name: "Jobs",
      path: "/jobs",
      icon: <Briefcase className="w-5 h-5 md:w-4 md:h-4 text-white" />,
    },
    {
      name: "Stories",
      path: "/stories",
      icon: <Library className="w-5 h-5 md:w-4 md:h-4 text-white" />,
    },
    {
      name: "Feed",
      path: "/feed",
      icon: <LayoutGrid className="w-5 h-5 md:w-4 md:h-4 text-white" />,
    },
    {
      name: "Map",
      path: "/events-map",
      icon: <MapIcon className="w-5 h-5 md:w-4 md:h-4 text-white" />,
    },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-60 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          scrolled || isOpen
            ? "bg-[#050508]/85 backdrop-blur-3xl border-b border-white/8 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            : "bg-transparent py-4 md:py-8"
        }`}
      >
        <div className="max-w-425 mx-auto px-4 md:px-10 flex items-center gap-0 h-14 md:h-16">
          <Link
            to="/home"
            className="flex items-center gap-2.5 group shrink-0 mr-12 h-10"
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-primary/30 rounded-xl blur-xl group-hover:bg-primary/50 transition-all duration-500 scale-125" />
              <div className="relative w-full h-full bg-[#0d0d14] border border-white/10 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-2xl group-hover:border-primary/40 group-hover:scale-105 transition-all duration-500">
                <span className="bg-linear-to-br from-primary to-violet-500 bg-clip-text text-transparent">
                  L
                </span>
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-0.5">
                Loko<span className="text-primary">nomy</span>
              </span>
              <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.4em] -translate-y-px">
                Global Hub
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center flex-1 ml-4 py-1">
            <div className="flex items-center gap-1 bg-white/3 p-1 rounded-2xl border border-white/5 backdrop-blur-xl group/hub hover:border-white/10 transition-colors overflow-hidden">
              <div className="flex items-center gap-0.5 px-1 pr-1.5 border-r border-white/5">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="relative px-4 py-2 text-[12px] font-bold text-white transition-all duration-500 rounded-xl hover:bg-white/5 group flex items-center gap-2.5 flex-nowrap shrink-0"
                  >
                    <div className="w-4 h-4 text-white/30 group-hover:text-primary transition-all group-hover:scale-110">
                      {link.icon}
                    </div>
                    <span className="hidden xl:block whitespace-nowrap">
                      {link.name}
                    </span>
                    <span className="absolute bottom-1 left-4 right-4 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-0.5 pl-1.5 pr-1.5 border-r border-white/5 flex-nowrap">
                {[
                  {
                    name: "My Orders",
                    path: "/my-orders",
                    icon: <Package className="w-4 h-4" />,
                    color: "text-blue-400",
                  },
                  {
                    name: "Sell Hub",
                    path: "/sales-management",
                    icon: <Tag className="w-4 h-4" />,
                    color: "text-emerald-400",
                  },
                  {
                    name: "Wishlist",
                    path: "/wishlist",
                    icon: <Heart className="w-4 h-4" />,
                    color: "text-rose-400",
                  },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-3.5 py-2 text-[11px] font-black text-white/30 hover:text-white uppercase tracking-[0.15em] hover:bg-white/5 rounded-xl transition-all flex items-center gap-2.5 shrink-0 group/item"
                  >
                    <div
                      className={`${item.color} opacity-40 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500`}
                    >
                      {item.icon}
                    </div>
                    <span className="hidden b-xl:block whitespace-nowrap font-bold">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center pl-1.5 pr-2">
                <Link
                  to="/my-chats"
                  className="relative px-3.5 py-2 text-[11px] font-black text-white/30 hover:text-white uppercase tracking-[0.15em] hover:bg-white/5 rounded-xl transition-all flex items-center gap-2.5 shrink-0 group/chat"
                  onClick={() => setUnreadCount(0)}
                >
                  <MessageCircle className="w-4 h-4 text-violet-400 opacity-40 group-hover/chat:opacity-100 group-hover/chat:scale-110 transition-all duration-500" />
                  <span className="hidden b-xl:block whitespace-nowrap font-bold">
                    Inbox
                  </span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-violet-600 rounded-full flex items-center justify-center text-[9px] text-white font-black px-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-[#050508]">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto pl-10 shrink-0">
            {user ? (
              <>
                <div className="hidden min-[1200px]:flex items-center gap-3">
                  <Link
                    to="/rewards"
                    className="flex items-center gap-2.5 px-4 py-2 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-xl transition-all group/rew"
                  >
                    <Gem className="w-4 h-4 text-violet-400/60 group-hover/rew:text-violet-400 group-hover/rew:scale-110 transition-all" />
                    <span className="text-[12px] font-black text-violet-300 tabular-nums tracking-wider leading-none">
                      {(user.loyaltyPoints || 0).toLocaleString()}
                    </span>
                  </Link>

                  <Link
                    to="/upgrade-plan"
                    className="flex items-center gap-2.5 px-4 py-2.5 bg-[#facc15] hover:bg-white text-[10px] font-black text-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-xl shadow-yellow-500/10 active:scale-95"
                  >
                    <Crown className="w-3.5 h-3.5 fill-black" />
                    <span className="hidden b-xl:block">Upgrade</span>
                  </Link>
                </div>

                <div className="hidden xl:block w-px h-6 bg-white/5 mx-1" />

                <div className="hidden sm:flex items-center gap-2">
                  <button className="p-2.5 bg-white/3 hover:bg-white/8 rounded-xl border border-white/5 transition-all group/tool">
                    <Search className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                  </button>
                  <NotificationBell />
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-3.5 bg-white/3 hover:bg-white/8 p-1.5 pr-4 rounded-xl border border-white/5 transition-all hidden sm:flex group/profile active:scale-95 shadow-lg"
                >
                  <div className="w-9 h-9 bg-[#0d0d14] border border-white/10 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-xl group-hover/profile:border-primary/50 group-hover/profile:shadow-primary/10 transition-all relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-violet-600/10 opacity-0 group-hover/profile:opacity-100 transition-opacity" />
                    <span className="relative z-10">
                      {user.name?.[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-bold text-white whitespace-nowrap leading-none tracking-tight">
                      {user.name?.split(" ")[0]}
                    </span>
                    <span className="text-[8px] font-black text-white/20 group-hover/profile:text-primary transition-colors uppercase tracking-widest leading-none">
                      {user.subscription?.plan?.toUpperCase() || "MEMBER"}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="lg:hidden w-11 h-11 flex items-center justify-center bg-white/5 rounded-xl border border-white/8 transition-all active:scale-90"
                >
                  <Menu className="w-5 h-5 text-white/70" />
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="btn-primary py-3 px-8 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden absolute top-full left-0 right-0 h-[calc(100vh-64px)] overflow-y-auto bg-[#0d0d14]/98 backdrop-blur-3xl border-t border-white/8 p-5"
            >
              {user && (
                <div className="mb-8 p-4 bg-white/5 rounded-3xl border border-white/8 flex items-center gap-4">
                  <div className="w-14 h-14 bg-linear-to-br from-primary to-violet-600 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-2xl">
                    {user.name?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {user.subscription?.plan || "Free"}
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {user.email?.split("@")[0]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/10 active:scale-95 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {user && (
                  <>
                    <Link
                      to="/my-chats"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 p-4 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-2xl transition-all group"
                    >
                      <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          Inbox
                        </span>
                        <span className="text-[10px] text-white/30 uppercase tracking-tight">
                          Recent Messages
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="ml-auto w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-[10px] font-black text-white ring-4 ring-violet-500/20">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/rewards"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 p-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 rounded-2xl transition-all group"
                    >
                      <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Star className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          Rewards
                        </span>
                        <span className="text-[10px] text-white/30 uppercase tracking-tight">
                          {(user.loyaltyPoints || 0).toLocaleString()} Points
                        </span>
                      </div>
                      <ChevronRight className="ml-auto w-4 h-4 text-white/20" />
                    </Link>

                    <Link
                      to="/upgrade-plan"
                      onClick={() => setIsOpen(false)}
                      className="sm:col-span-2 flex items-center gap-4 p-4 bg-linear-to-r from-primary/10 to-violet-600/10 border border-primary/20 rounded-2xl overflow-hidden relative"
                    >
                      <div className="absolute -right-2.5 -top-2.5 opacity-10">
                        <Crown className="w-24 h-24 rotate-12" />
                      </div>
                      <div className="w-10 h-10 bg-linear-to-br from-primary to-violet-600 rounded-xl flex items-center justify-center text-white">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white uppercase tracking-wider">
                          Premium Access
                        </span>
                        <span className="text-[10px] text-primary font-bold">
                          Unlock exclusive features & tools
                        </span>
                      </div>
                      <div className="ml-auto bg-white text-black px-3 py-1 rounded-full text-[9px] font-black">
                        GO PRO
                      </div>
                    </Link>
                  </>
                )}
              </div>

              <div className="space-y-2 mb-10">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-3 mb-2 block">
                  General Hub
                </span>
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-4 bg-white/3 hover:bg-white/5 border border-white/5 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-white/5 text-white/40 group-hover:text-primary group-hover:bg-primary/10 transition-all rounded-xl flex items-center justify-center">
                          {link.icon}
                        </div>
                        <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">
                          {link.name}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/30 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {user && (
                <div className="grid grid-cols-2 gap-3 mb-20">
                  {[
                    {
                      name: "My Orders",
                      path: "/my-orders",
                      icon: <Package className="w-4 h-4" />,
                      color: "blue",
                    },
                    {
                      name: "My Wishlist",
                      path: "/wishlist",
                      icon: <Heart className="w-4 h-4" />,
                      color: "rose",
                    },
                    {
                      name: "Sell Hub",
                      path: "/sales-management",
                      icon: <Tag className="w-4 h-4" />,
                      color: "emerald",
                    },
                    {
                      name: "My Profile",
                      path: "/profile",
                      icon: <UserIcon className="w-4 h-4" />,
                      color: "primary",
                    },
                  ].map((item, i) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col gap-3 p-4 bg-white/5 border border-white/8 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                      <div
                        className={`w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:scale-110 transition-transform`}
                      >
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold text-white/60 group-hover:text-white">
                        {item.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-10 border-t border-white/5 text-center">
                <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">
                  Lokonomy Secure Session Hub v2.5
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
