import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiUser,
  FiBriefcase,
  FiPackage,
  FiFileText,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import { adminService } from "../../services";

const AdminGlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        setIsOpen(true);
        try {
          const res = await adminService.globalSearch(query);
          setResults(res.data);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults(null);
        if (query.trim().length === 0) setIsOpen(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleResultClick = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery("");
  };

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.businesses.length > 0 ||
      results.jobs.length > 0 ||
      results.products.length > 0);

  return (
    <div
      className="flex-1 max-w-md ml-4 hidden md:block relative"
      ref={searchRef}
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <FiSearch
            className={`transition-colors ${isOpen ? "text-indigo-400" : "text-slate-500 group-focus-within:text-indigo-400"}`}
          />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search users, businesses, jobs..."
          className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-2.5 pl-11 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all backdrop-blur-xl"
        />
        {query && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-112.5 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex items-center justify-center p-8 gap-3">
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Searching...
                </span>
              </div>
            ) : !hasResults ? (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-slate-400">
                  No results found
                </p>
                <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest">
                  Try a different keyword
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-2">
                {results.users.length > 0 && (
                  <div>
                    <h4 className="px-3 py-1 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">
                      Users
                    </h4>
                    {results.users.map((u) => (
                      <button
                        key={u._id}
                        onClick={() =>
                          handleResultClick(`/admin/users?search=${u.email}`)
                        }
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              className="w-full h-full object-cover rounded-lg"
                              alt=""
                            />
                          ) : (
                            <FiUser />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {u.email}
                          </p>
                        </div>
                        <FiArrowRight className="text-slate-700 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {results.businesses.length > 0 && (
                  <div>
                    <h4 className="px-3 py-1 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
                      Businesses
                    </h4>
                    {results.businesses.map((b) => (
                      <button
                        key={b._id}
                        onClick={() =>
                          handleResultClick(`/admin/businesses?id=${b._id}`)
                        }
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                          {b.logo || b.banner ? (
                            <img
                              src={b.logo || b.banner}
                              className="w-full h-full object-cover rounded-lg"
                              alt=""
                            />
                          ) : (
                            <FiBriefcase />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {b.businessName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {b.mainCategory} • {b.district}
                          </p>
                        </div>
                        <FiArrowRight className="text-slate-700 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {results.jobs.length > 0 && (
                  <div>
                    <h4 className="px-3 py-1 text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">
                      Jobs
                    </h4>
                    {results.jobs.map((j) => (
                      <button
                        key={j._id}
                        onClick={() =>
                          handleResultClick(`/admin/jobs?id=${j._id}`)
                        }
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center text-amber-400">
                          <FiFileText />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {j.position}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {j.posterName} • {j.district}
                          </p>
                        </div>
                        <FiArrowRight className="text-slate-700 group-hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {results.products.length > 0 && (
                  <div>
                    <h4 className="px-3 py-1 text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">
                      Products
                    </h4>
                    {results.products.map((p) => (
                      <button
                        key={p._id}
                        onClick={() =>
                          handleResultClick(`/admin/marketplace?id=${p._id}`)
                        }
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-600/20 flex items-center justify-center text-rose-400">
                          {p.productImages && p.productImages[0] ? (
                            <img
                              src={p.productImages[0]}
                              className="w-full h-full object-cover rounded-lg"
                              alt=""
                            />
                          ) : (
                            <FiPackage />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {p.productName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            ₹{p.price} • {p.mainCategory}
                          </p>
                        </div>
                        <FiArrowRight className="text-slate-700 group-hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Global Search Active
            </span>
            <span className="text-[9px] font-bold text-slate-600">
              Press ENTER for full results
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGlobalSearch;
