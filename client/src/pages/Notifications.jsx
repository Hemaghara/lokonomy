import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { notificationService } from "../services";
import { useUser } from "../context/UserContext";
import { connectSocket } from "../services/socket";
import {
  Bell,
  Package,
  Calendar,
  MessageCircle,
  Briefcase,
  Star,
  Zap,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  ChevronDown,
  Loader2,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All", icon: <Bell className="w-4 h-4" /> },
  { key: "order", label: "Orders", icon: <Package className="w-4 h-4" /> },
  {
    key: "booking",
    label: "Bookings",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    key: "message",
    label: "Messages",
    icon: <MessageCircle className="w-4 h-4" />,
  },
  {
    key: "job_application",
    label: "Jobs",
    icon: <Briefcase className="w-4 h-4" />,
  },
  { key: "review", label: "Reviews", icon: <Star className="w-4 h-4" /> },
  { key: "system", label: "System", icon: <Zap className="w-4 h-4" /> },
];

const CATEGORY_META = {
  order: {
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    ring: "ring-blue-500/20",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  booking: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  message: {
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    ring: "ring-violet-500/20",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
  job_application: {
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  review: {
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    ring: "ring-rose-500/20",
    gradient: "from-rose-500/20 to-rose-600/5",
  },
  system: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    ring: "ring-cyan-500/20",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getCategoryIcon = (type) => {
  const icons = {
    order: <Package className="w-5 h-5" />,
    booking: <Calendar className="w-5 h-5" />,
    message: <MessageCircle className="w-5 h-5" />,
    job_application: <Briefcase className="w-5 h-5" />,
    review: <Star className="w-5 h-5" />,
    system: <Zap className="w-5 h-5" />,
  };
  return icons[type] || icons.system;
};

const Notifications = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotifications = async (pg = 1, type = activeFilter) => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(pg, 20, type);
      if (res.data.success) {
        if (pg === 1) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...res.data.notifications]);
        }
        setTotalPages(res.data.pages);
        setTotal(res.data.total);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications(1, activeFilter);
    setPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user.id);
    const handleNew = (notification) => {
      if (activeFilter === "all" || activeFilter === notification.type) {
        setNotifications((prev) => [notification, ...prev]);
        setTotal((t) => t + 1);
      }
    };
    socket.on("newNotification", handleNew);
    return () => socket.off("newNotification", handleNew);
  }, [user, activeFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (_) {}
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setTotal(0);
    } catch (_) {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) await handleMarkAsRead(notif._id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Notifications
              </h1>
              <p className="text-sm text-white/30 mt-0.5">
                {total} notification{total !== 1 && "s"}
                {unreadCount > 0 && (
                  <span className="text-primary font-bold">
                    {" "}
                    · {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeFilter === cat.key
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "bg-white/3 text-white/30 border border-white/5 hover:bg-white/5 hover:text-white/50"
                }`}
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Read All
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3.5 py-2 bg-red-500/10 text-red-400 border border-red-500/15 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-white/20 font-bold uppercase tracking-widest">
                Loading notifications...
              </span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-20 h-20 bg-white/3 rounded-3xl flex items-center justify-center border border-white/5">
                <Bell className="w-9 h-9 text-white/8" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white/25">
                  No notifications
                </p>
                <p className="text-sm text-white/12 mt-1.5 max-w-xs">
                  {activeFilter !== "all"
                    ? `No ${activeFilter.replace("_", " ")} notifications yet`
                    : "You're all caught up! New notifications will appear here."}
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notif, i) => {
                const meta =
                  CATEGORY_META[notif.type] || CATEGORY_META.system;
                return (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`relative flex items-start gap-4 p-5 rounded-2xl cursor-pointer border transition-all group ${
                      notif.read
                        ? "bg-white/2 border-white/5 hover:bg-white/4"
                        : "bg-linear-to-r " +
                          meta.gradient +
                          " border-white/8 hover:border-white/12"
                    }`}
                  >
                    {!notif.read && (
                      <div className="absolute left-0 top-4 bottom-4 w-0.75 bg-primary rounded-r-full" />
                    )}

                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color} ring-1 ${meta.ring}`}
                    >
                      {getCategoryIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-sm leading-snug ${
                            notif.read
                              ? "text-white/40 font-medium"
                              : "text-white/90 font-bold"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-white/15 font-bold uppercase tracking-wider whitespace-nowrap shrink-0 mt-0.5">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[12px] text-white/25 mt-1 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${meta.color} opacity-60`}
                        >
                          {notif.type.replace("_", " ")}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif._id);
                            }}
                            className="text-[10px] font-bold text-white/15 hover:text-emerald-400 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Load More */}
        {page < totalPages && !loading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchNotifications(nextPage);
              }}
              className="flex items-center gap-2.5 px-6 py-3 bg-white/3 border border-white/8 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              <ChevronDown className="w-4 h-4" />
              Load More
            </button>
          </div>
        )}

        {loading && notifications.length > 0 && (
          <div className="flex justify-center mt-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
