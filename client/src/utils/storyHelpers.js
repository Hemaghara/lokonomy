import {
  HiOutlineNewspaper,
  HiOutlineTag,
  HiOutlineRocketLaunch,
  HiOutlineCalendarDays,
  HiOutlineMegaphone,
  HiOutlineLightBulb,
  HiOutlineSparkles,
} from "react-icons/hi2";
import React from "react";

export const getTimeRemaining = (expiresAt) => {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diff = exp - now;
  if (diff <= 0)
    return { expired: true, label: "Expired", pct: 0, urgent: true };
  const totalMs = 24 * 60 * 60 * 1000;
  const pct = Math.max(0, Math.min(100, (diff / totalMs) * 100));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const urgent = diff < 3 * 60 * 60 * 1000;
  const label = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return { expired: false, label, pct, urgent };
};

export const getIconForType = (type) => {
  switch (type) {
    case "News":
      return React.createElement(HiOutlineNewspaper, { className: "text-sky-400" });
    case "Offers":
      return React.createElement(HiOutlineTag, { className: "text-emerald-400" });
    case "Promotions":
      return React.createElement(HiOutlineRocketLaunch, { className: "text-violet-400" });
    case "Events":
      return React.createElement(HiOutlineCalendarDays, { className: "text-pink-400" });
    case "Announcements":
      return React.createElement(HiOutlineMegaphone, { className: "text-amber-400" });
    case "Tips":
      return React.createElement(HiOutlineLightBulb, { className: "text-yellow-400" });
    default:
      return React.createElement(HiOutlineSparkles, { className: "text-slate-400" });
  }
};

export const getTypeColor = (type) => {
  switch (type) {
    case "News":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "Offers":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Promotions":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "Events":
      return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    case "Announcements":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Tips":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

export const formatTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
