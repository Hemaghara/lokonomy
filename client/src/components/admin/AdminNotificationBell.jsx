import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiX,
  FiActivity,
  FiBriefcase,
  FiPackage,
  FiZap,
} from "react-icons/fi";
import { notificationService } from "../../services";

const CATEGORY_META = {
  order: {
    icon: <FiPackage className="w-4 h-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    ring: "ring-blue-500/20",
  },
  booking: {
    icon: <FiActivity className="w-4 h-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/20",
  },
  job_application: {
    icon: <FiBriefcase className="w-4 h-4" />,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/20",
  },
  system: {
    icon: <FiZap className="w-4 h-4" />,
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
    ring: "ring-indigo-500/20",
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

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.data.success) setUnreadCount(res.data.count);
    } catch (_) {}
  };

  useEffect(() => {
    if (!adminInfo.id && !adminInfo._id) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen || (!adminInfo.id && !adminInfo._id)) return;
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const res = await notificationService.getNotifications(1, 10);
        if (res.data.success) setNotifications(res.data.notifications);
      } catch (_) {}
      setLoading(false);
    };
    fetchNotifs();
  }, [isOpen]);

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
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all group ${
          isOpen
            ? "bg-indigo-600 border-indigo-500 text-white"
            : "bg-slate-800/30 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800/60"
        }`}
      >
        <FiBell className="text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-black px-1 shadow-lg shadow-indigo-500/40 ring-2 ring-slate-950 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 -mr-12.5 md:mr-0"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-indigo-600/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                    title="Mark all as read"
                  >
                    <FiCheckCircle className="text-sm" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Clear all"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
            </div>

            <div className="max-h-100 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Loading...
                  </span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                    <FiBell className="text-2xl text-slate-700" />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-xs font-bold text-slate-400">
                      All caught up!
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      No new notifications for you right now.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif) => {
                    const meta =
                      CATEGORY_META[notif.type] || CATEGORY_META.system;
                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-all hover:bg-white/5 relative group ${
                          !notif.read ? "bg-indigo-600/5" : ""
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color} ring-1 ${meta.ring}`}
                        >
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs leading-snug ${notif.read ? "text-slate-400" : "text-white font-bold"}`}
                          >
                            {notif.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase tracking-tight">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notif._id)}
                            className="w-2 h-2 rounded-full bg-indigo-500 mt-1 focus:outline-none"
                            title="Mark as read"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => {
                  navigate("/admin/notifications");
                  setIsOpen(false);
                }}
                className="w-full py-3 text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest border-t border-white/5 transition-colors"
              >
                View Push Manager
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotificationBell;
