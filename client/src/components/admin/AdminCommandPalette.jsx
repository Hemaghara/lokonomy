import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch, FiUser, FiBriefcase, FiPackage, FiFileText,
  FiArrowRight, FiCommand, FiX, FiHome, FiActivity,
  FiAlertCircle, FiShield, FiDollarSign, FiZap,
  FiUsers, FiBarChart2, FiCalendar, FiKey, FiTarget,
} from "react-icons/fi";
import { adminService } from "../../services/adminService";

const NAV_COMMANDS = [
  { label: "Dashboard Overview", path: "/admin/dashboard", icon: FiHome, group: "Navigate" },
  { label: "Users", path: "/admin/users", icon: FiUsers, group: "Navigate" },
  { label: "Businesses", path: "/admin/businesses", icon: FiBriefcase, group: "Navigate" },
  { label: "Marketplace", path: "/admin/marketplace", icon: FiPackage, group: "Navigate" },
  { label: "Jobs", path: "/admin/jobs", icon: FiFileText, group: "Navigate" },
  { label: "Alert Center", path: "/admin/alerts", icon: FiAlertCircle, group: "Navigate" },
  { label: "Fraud Detection", path: "/admin/fraud", icon: FiShield, group: "Navigate" },
  { label: "Campaigns", path: "/admin/campaigns", icon: FiTarget, group: "Navigate" },
  { label: "Activity Heatmap", path: "/admin/heatmap", icon: FiBarChart2, group: "Navigate" },
  { label: "Churn Predictor", path: "/admin/churn", icon: FiActivity, group: "Navigate" },
  { label: "Content Schedule", path: "/admin/content-schedule", icon: FiCalendar, group: "Navigate" },
  { label: "API Key Management", path: "/admin/api-keys", icon: FiKey, group: "Navigate" },
  { label: "Subscriptions", path: "/admin/subscriptions", icon: FiDollarSign, group: "Navigate" },
  { label: "Analytics", path: "/admin/analytics", icon: FiBarChart2, group: "Navigate" },
  { label: "Sub-Admins", path: "/admin/sub-admins", icon: FiShield, group: "Navigate" },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: FiActivity, group: "Navigate" },
  { label: "Push Notifications", path: "/admin/notifications", icon: FiZap, group: "Navigate" },
  { label: "Reviews", path: "/admin/reviews", icon: FiActivity, group: "Navigate" },
  { label: "Rewards", path: "/admin/rewards", icon: FiZap, group: "Navigate" },
  { label: "Support", path: "/admin/support", icon: FiActivity, group: "Navigate" },
  { label: "Settings", path: "/admin/settings", icon: FiActivity, group: "Navigate" },
  { label: "Health Monitor", path: "/admin/health", icon: FiActivity, group: "Navigate" },
];

const ICON_MAP = { users: FiUser, businesses: FiBriefcase, jobs: FiFileText, products: FiPackage };
const COLOR_MAP = {
  users: "text-indigo-400 bg-indigo-500/10",
  businesses: "text-emerald-400 bg-emerald-500/10",
  jobs: "text-amber-400 bg-amber-500/10",
  products: "text-rose-400 bg-rose-500/10",
};

const AdminCommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filteredNav = NAV_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [
    ...filteredNav.map((c) => ({ ...c, resultType: "nav" })),
    ...(results?.users?.map((u) => ({ ...u, resultType: "user", label: u.name, sub: u.email, path: `/admin/user/${u._id}`, icon: FiUser, group: "Users", colorClass: COLOR_MAP.users })) || []),
    ...(results?.businesses?.map((b) => ({ ...b, resultType: "business", label: b.businessName, sub: `${b.mainCategory} · ${b.district}`, path: `/admin/business/${b._id}`, icon: FiBriefcase, group: "Businesses", colorClass: COLOR_MAP.businesses })) || []),
    ...(results?.jobs?.map((j) => ({ ...j, resultType: "job", label: j.position, sub: j.district, path: `/admin/jobs/${j._id}`, icon: FiFileText, group: "Jobs", colorClass: COLOR_MAP.jobs })) || []),
    ...(results?.products?.map((p) => ({ ...p, resultType: "product", label: p.productName, sub: `₹${p.price}`, path: `/admin/marketplace/product/${p._id}`, icon: FiPackage, group: "Products", colorClass: COLOR_MAP.products })) || []),
  ];

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await adminService.globalSearch(query);
          setResults(res.data);
        } catch (_) {}
        setLoading(false);
      } else {
        setResults(null);
      }
      setSelectedIdx(0);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = useCallback(
    (item) => {
      navigate(item.path);
      onClose();
    },
    [navigate, onClose]
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, allResults.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && allResults[selectedIdx]) handleSelect(allResults[selectedIdx]);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, allResults, selectedIdx, handleSelect, onClose]);

  if (!open) return null;

  const groups = allResults.reduce((acc, item) => {
    const g = item.group || "Navigate";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

      <div
        className="relative w-full max-w-2xl bg-slate-900/98 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
          <FiSearch className={`text-lg shrink-0 transition-colors ${loading ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, pages, actions..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none font-medium"
            spellCheck={false}
          />
          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button onClick={() => setQuery("")} className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <FiX size={14} />
              </button>
            )}
            <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-800 border border-white/5 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <FiCommand size={10} /> K
            </span>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {allResults.length === 0 && !loading && (
            <div className="py-16 text-center">
              <FiSearch className="text-slate-700 text-4xl mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-bold">
                {query.length >= 2 ? "No results found" : "Type to search or navigate"}
              </p>
              <p className="text-slate-700 text-xs mt-1 uppercase tracking-widest font-bold">
                {query.length < 2 ? "All pages listed above" : "Try a different keyword"}
              </p>
            </div>
          )}

          {Object.entries(groups).map(([group, items]) => {
            let absIdx = allResults.indexOf(items[0]);
            return (
              <div key={group} className="p-2">
                <p className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">{group}</p>
                {items.map((item) => {
                  const idx = allResults.indexOf(item);
                  const Icon = item.icon || FiArrowRight;
                  const isSelected = idx === selectedIdx;
                  const colorClass = item.colorClass || "text-indigo-400 bg-indigo-500/10";
                  return (
                    <button
                      key={`${item.resultType || "nav"}-${item._id || item.path}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${isSelected ? "bg-indigo-600/20 border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-slate-300"}`}>{item.label}</p>
                        {item.sub && <p className="text-[11px] text-slate-500 truncate">{item.sub}</p>}
                      </div>
                      <FiArrowRight className={`text-sm shrink-0 transition-all ${isSelected ? "text-indigo-400 translate-x-0.5" : "text-slate-700"}`} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/2">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-black">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-black">↵</kbd> Select</span>
            <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-black">Esc</kbd> Close</span>
          </div>
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{allResults.length} result{allResults.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandPalette;
