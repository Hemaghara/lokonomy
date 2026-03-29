import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { notificationService } from "../services/notificationService";
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
  ChevronRight,
  X,
} from "lucide-react";

const CATEGORY_META = {
  order: {
    icon: <Package className="w-4 h-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    ring: "ring-blue-500/20",
  },
  booking: {
    icon: <Calendar className="w-4 h-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/20",
  },
  message: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    ring: "ring-violet-500/20",
  },
  job_application: {
    icon: <Briefcase className="w-4 h-4" />,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/20",
  },
  review: {
    icon: <Star className="w-4 h-4" />,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    ring: "ring-rose-500/20",
  },
  system: {
    icon: <Zap className="w-4 h-4" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    ring: "ring-cyan-500/20",
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
  return new Date(date).toLocaleDateString();
};

const NotificationBell = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (res.data.success) setUnreadCount(res.data.count);
      } catch (_) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user.id);

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on("newNotification", handleNewNotification);
    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [user]);

  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const res = await notificationService.getNotifications(1, 15);
        if (res.data.success) setNotifications(res.data.notifications);
      } catch (_) {}
      setLoading(false);
    };
    fetchNotifs();
  }, [isOpen, user]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (_) {}
    }
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white/3 hover:bg-white/8 rounded-xl border border-white/5 transition-all group/tool"
      >
        <Bell
          className={`w-4 h-4 transition-colors ${
            isOpen
              ? "text-primary"
              : "text-white/20 group-hover/tool:text-white/60"
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-primary rounded-full flex items-center justify-center text-[9px] text-white font-black px-1 shadow-[0_0_12px_rgba(168,85,247,0.4)] ring-2 ring-[#050508] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-3 w-95 max-h-130 bg-[#0d0d16]/98 backdrop-blur-3xl border border-white/8 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden z-100"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="min-w-5 h-5 bg-primary/20 text-primary text-[10px] font-black px-1.5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-95 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-[11px] text-white/20 font-bold uppercase tracking-widest">
                    Loading...
                  </span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-white/3 rounded-2xl flex items-center justify-center border border-white/5">
                    <Bell className="w-7 h-7 text-white/10" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white/30">
                      All caught up!
                    </p>
                    <p className="text-[11px] text-white/15 mt-1">
                      No notifications yet
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const meta =
                    CATEGORY_META[notif.type] || CATEGORY_META.system;
                  return (
                    <motion.div
                      key={notif._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-all border-b border-white/3 group/item ${
                        notif.read
                          ? "hover:bg-white/3"
                          : "bg-primary/3 hover:bg-primary/6"
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color} ring-1 ${meta.ring} mt-0.5`}
                      >
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[12px] leading-snug ${
                            notif.read
                              ? "text-white/40 font-medium"
                              : "text-white/80 font-bold"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-white/20 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-white/10 mt-1.5 font-bold uppercase tracking-wider">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>

                      <div className="shrink-0 mt-1">
                        {!notif.read ? (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notif._id)}
                            className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/40 transition-all group/read"
                            title="Mark as read"
                          >
                            <div className="w-2 h-2 bg-primary rounded-full group-hover/read:hidden" />
                            <Check className="w-3 h-3 text-primary hidden group-hover/read:block" />
                          </button>
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Check className="w-3 h-3 text-white/15" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-white/5 px-5 py-3">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 text-[11px] font-black text-primary/60 hover:text-primary uppercase tracking-widest transition-colors group/all"
                >
                  View All Notifications
                  <ChevronRight className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
