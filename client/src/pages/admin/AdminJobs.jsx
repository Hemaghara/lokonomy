import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiSearch,
  FiFilter,
  FiEye,
  FiUser,
  FiSlash,
  FiPauseCircle,
  FiFlag,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiBook,
} from "react-icons/fi";

const FILTERS = ["all", "open", "closed", "banned", "suspended"];

const EDUCATION_FILTERS = [
  "All",
  "10th pass",
  "12th pass",
  "Graduate",
  "Post Graduate",
];

const STAT_CONFIG = [
  { key: "openJobs", label: "Open", icon: FiBriefcase, color: "indigo" },
  { key: "closedJobs", label: "Closed", icon: FiXCircle, color: "slate" },
  { key: "bannedJobs", label: "Banned", icon: FiSlash, color: "rose" },
  {
    key: "suspendedJobs",
    label: "Suspended",
    icon: FiPauseCircle,
    color: "amber",
  },
  {
    key: "totalApplications",
    label: "Applications",
    icon: FiFileText,
    color: "emerald",
  },
];

const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
  },
  slate: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-400",
  },
};

const getPlanBadge = (plan) => {
  const map = {
    free: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    silver: "bg-slate-300/20 text-slate-200 border-slate-300/30",
    gold: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    platinum: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  };
  return map[plan] || map.free;
};

const Pagination = ({ page, totalPages, onPage }) =>
  totalPages > 1 ? (
    <div className="flex justify-center items-center gap-3 pt-8">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-700 hover:text-white transition-all"
      >
        <FiChevronLeft size={14} /> Prev
      </button>
      <span className="text-xs text-slate-500 font-semibold px-2">
        <span className="text-white font-bold">{page}</span> / {totalPages}
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
      >
        Next <FiChevronRight size={14} />
      </button>
    </div>
  ) : null;

const EmptyState = ({ text }) => (
  <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-600">
      <FiBriefcase size={22} />
    </div>
    <p className="text-slate-500 text-sm font-medium">{text}</p>
  </div>
);

const JobCard = ({ job, onBan, onSuspend, onView }) => (
  <div
    onClick={() => onView(job)}
    className={`group relative flex flex-col bg-slate-900/60 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 ${
      job.isFlagged
        ? "border-rose-500/40"
        : job.isSuspended
          ? "border-amber-500/40"
          : "border-slate-800 hover:border-indigo-500/40"
    }`}
  >
    <div className="relative bg-linear-to-br from-slate-800/80 to-slate-900 p-4 pb-3">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex gap-1.5 flex-wrap">
          {job.isFlagged && (
            <span className="flex items-center gap-1 bg-rose-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <FiFlag size={9} /> Banned
            </span>
          )}
          {job.isSuspended && (
            <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Suspended
            </span>
          )}
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              job.status === "Open"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-slate-500/20 text-slate-400"
            }`}
          >
            {job.status}
          </span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono shrink-0">
          #{job._id?.slice(-6)}
        </span>
      </div>

      <h4 className="font-bold text-white text-sm leading-snug truncate group-hover:text-indigo-300 transition-colors">
        {job.position}
      </h4>
      <div className="flex items-center gap-1.5 mt-1.5">
        <FiMapPin size={10} className="text-slate-500" />
        <p className="text-[11px] text-slate-500 truncate">
          {job.location}, {job.district}
        </p>
      </div>
    </div>

    <div className="flex flex-col flex-1 p-4 gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-0.5">
            Salary
          </p>
          <p className="text-xs font-bold text-white flex items-center gap-1">
            <FiDollarSign size={10} className="text-indigo-400" />
            {job.salary}
          </p>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-0.5">
            Vacancies
          </p>
          <p className="text-xs font-bold text-white flex items-center gap-1">
            <FiUsers size={10} className="text-emerald-400" />
            {job.vacancies}
          </p>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-0.5">
            Education
          </p>
          <p className="text-xs font-bold text-white flex items-center gap-1">
            <FiBook size={10} className="text-violet-400" />
            {job.education}
          </p>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800">
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-0.5">
            Applications
          </p>
          <p className="text-xs font-bold text-white flex items-center gap-1">
            <FiFileText size={10} className="text-cyan-400" />
            {job.applications?.length || 0}
          </p>
        </div>
      </div>

      {/* Poster info */}
      <div className="flex items-center justify-between py-2.5 px-3 bg-slate-800/40 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
            <FiUser size={12} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none mb-0.5">
              Posted by
            </p>
            <p className="text-xs font-semibold text-white truncate">
              {job.posterName}
            </p>
          </div>
        </div>
        {job.posterId?.subscription?.plan && (
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${getPlanBadge(
              job.posterId.subscription.plan,
            )}`}
          >
            {job.posterId.subscription.plan}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBan();
          }}
          title={job.isFlagged ? "Unban" : "Ban"}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
            job.isFlagged
              ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
          }`}
        >
          <FiSlash size={12} /> {job.isFlagged ? "Unban" : "Ban"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSuspend();
          }}
          title={job.isSuspended ? "Activate" : "Suspend"}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
            job.isSuspended
              ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
          }`}
        >
          <FiPauseCircle size={12} /> {job.isSuspended ? "Activate" : "Suspend"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(job);
          }}
          className="w-10 h-10 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-indigo-500 transition-all shrink-0"
        >
          <FiEye size={14} />
        </button>
      </div>
    </div>
  </div>
);

const AdminJobs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [education, setEducation] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [filter, education, search, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await adminService.getJobs({
        status: filter !== "all" ? filter : undefined,
        education: education !== "All" ? education : undefined,
        search,
        page,
        limit: 6,
      });
      setJobs(r.data.jobs);
      setTotalPages(r.data.totalPages);
    } catch {
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const r = await adminService.getJobStats();
      setStats(r.data);
    } catch (e) {
      console.error("Stats error:", e);
    }
  };

  const handleToggleBan = async (id) => {
    try {
      const r = await adminService.toggleBanJob(id);
      toast.success(r.data.message);
      fetchData();
      fetchStats();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleToggleSuspend = async (id) => {
    try {
      const r = await adminService.toggleSuspendJob(id);
      toast.success(r.data.message);
      fetchData();
      fetchStats();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleViewJob = (jobOrId) => {
    const id =
      typeof jobOrId === "object" ? jobOrId._id || jobOrId.id : jobOrId;
    if (id) navigate(`/admin/jobs/${id}`);
  };

  const handleFilterChange = (f) => {
    setFilter(f);
    setPage(1);
  };

  const handleEducationChange = (e) => {
    setEducation(e);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="max-w-screen-2xl mx-auto space-y-6 pb-16 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Job <span className="text-indigo-400">Management</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl self-start sm:self-auto">
            <FiBriefcase size={16} className="text-indigo-400" />
            <span className="text-sm font-bold text-white">
              {stats?.totalJobs ?? 0}
            </span>
            <span className="text-xs text-slate-500">Total Jobs</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAT_CONFIG.map(({ key, label, icon: Icon, color }, i) => {
            const c = colorMap[color];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-hidden group hover:border-slate-700 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center mb-3`}
                >
                  <Icon size={16} className={c.text} />
                </div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">
                  {label}
                </p>
                <p className="text-xl font-extrabold text-white">
                  {stats?.[key] ?? 0}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0 sm:max-w-xs">
              <FiSearch
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search jobs by position, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <FiFilter size={14} className="text-slate-600 shrink-0" />
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
                    filter === f
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-slate-800/40 text-slate-500 border border-transparent hover:bg-slate-800 hover:text-slate-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <FiBook size={14} className="text-slate-600 shrink-0" />
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider shrink-0">
              Education:
            </span>
            {EDUCATION_FILTERS.map((e) => (
              <button
                key={e}
                onClick={() => handleEducationChange(e)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                  education === e
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : "bg-slate-800/40 text-slate-500 border border-transparent hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter + education}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm font-medium animate-pulse">
                  Loading jobs…
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onBan={() => handleToggleBan(job._id)}
                      onSuspend={() => handleToggleSuspend(job._id)}
                      onView={handleViewJob}
                    />
                  ))}
                  {jobs.length === 0 && (
                    <EmptyState text="No jobs found matching your filters" />
                  )}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPage={setPage}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminJobs;
