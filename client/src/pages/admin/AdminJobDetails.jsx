import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiBriefcase,
  FiUser,
  FiAlertTriangle,
  FiArrowLeft,
  FiDollarSign,
  FiPhone,
  FiMapPin,
  FiSlash,
  FiPauseCircle,
  FiMail,
  FiEye,
  FiInfo,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiFileText,
  FiBook,
  FiShield,
  FiActivity,
  FiAward,
  FiTarget,
} from "react-icons/fi";

const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const StatusPill = ({ isFlagged, isSuspended, status }) => {
  if (isFlagged)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 bg-rose-500/10 text-rose-400 ring-rose-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Banned
      </span>
    );
  if (isSuspended)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 bg-amber-500/10 text-amber-400 ring-amber-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />{" "}
        Suspended
      </span>
    );
  if (status === "Closed")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 bg-slate-500/10 text-slate-400 ring-slate-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Closed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 bg-emerald-500/10 text-emerald-400 ring-emerald-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Open
    </span>
  );
};

const StatTile = ({ icon: Icon, label, value, accent = "indigo" }) => (
  <div
    className={`flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-${accent}-500/30 transition-colors`}
  >
    <div
      className={`w-9 h-9 rounded-lg bg-${accent}-500/10 flex items-center justify-center shrink-0`}
    >
      <Icon size={16} className={`text-${accent}-400`} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
        {label}
      </p>
      <p className="text-xs font-black text-white truncate">{value}</p>
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

const SectionHead = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-5">
    <Icon size={14} className="text-indigo-400 shrink-0" />
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
      {label}
    </span>
  </div>
);

const ActionBtn = ({
  onClick,
  disabled,
  danger,
  warning,
  neutral,
  children,
}) => {
  const base =
    "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm";
  const variant = danger
    ? "bg-rose-600 hover:bg-rose-500 text-white"
    : warning
      ? "bg-amber-600 hover:bg-amber-500 text-white"
      : neutral
        ? "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
        : "bg-emerald-600 hover:bg-emerald-500 text-white";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variant}`}
    >
      {children}
    </button>
  );
};

const LoadingScreen = () => (
  <AdminLayout>
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/15 border-t-indigo-500 animate-spin" />
        <FiBriefcase
          className="absolute inset-0 m-auto text-indigo-400 animate-pulse"
          size={18}
        />
      </div>
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
        Loading job…
      </p>
    </div>
  </AdminLayout>
);

const NotFoundScreen = ({ onBack }) => (
  <AdminLayout>
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div {...FADE_UP} className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <FiAlertTriangle size={36} className="text-rose-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Not Found</h2>
        <p className="text-sm text-slate-500 mb-8">
          This job could not be located in the database.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl transition-colors"
        >
          Return to Jobs
        </button>
      </motion.div>
    </div>
  </AdminLayout>
);

const getPlanColor = (plan) => {
  const map = {
    free: {
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/20",
    },
    silver: {
      bg: "bg-slate-300/10",
      text: "text-slate-300",
      border: "border-slate-300/20",
    },
    gold: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
    },
    platinum: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
    },
  };
  return map[plan] || map.free;
};

const getAppStatusColor = (status) => {
  const map = {
    Applied: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
    "Under Review": "bg-amber-500/15 text-amber-400 border-amber-500/25",
    Interview: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
    Selected: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    Rejected: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  };
  return map[status] || map.Applied;
};

const AdminJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const res = await adminService.getJobDetails(id);
      setJob(res.data);
      if (res.data.posterId?._id) {
        try {
          const usageRes = await adminService.getJobPosterUsage(
            res.data.posterId._id,
          );
          setUsage(usageRes.data);
        } catch {}
      }
    } catch {
      toast.error("Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.toggleBanJob(id);
      toast.success(res.data.message);
      fetchJobDetails();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.toggleSuspendJob(id);
      toast.success(res.data.message);
      fetchJobDetails();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!job) return <NotFoundScreen onBack={() => navigate("/admin/jobs")} />;

  const poster = job.posterId || {};
  const applications = job.applications || [];
  const planSlug = poster.subscription?.plan || "free";
  const planC = getPlanColor(planSlug);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 pb-20 space-y-5">
        <motion.div
          {...FADE_UP}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all"
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight truncate max-w-55 sm:max-w-xs md:max-w-none">
                  {job.position}
                </h1>
                <StatusPill
                  isFlagged={job.isFlagged}
                  isSuspended={job.isSuspended}
                  status={job.status}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                <FiMapPin size={10} className="text-indigo-400" />
                {job.location} · {job.district}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ActionBtn
              onClick={handleToggleBan}
              disabled={actionLoading}
              danger={!job.isFlagged}
              neutral={job.isFlagged}
            >
              <FiSlash size={13} />
              {job.isFlagged ? "Unban" : "Ban"}
            </ActionBtn>
            <ActionBtn
              onClick={handleToggleSuspend}
              disabled={actionLoading}
              warning={!job.isSuspended}
              neutral={job.isSuspended}
            >
              <FiPauseCircle size={13} />
              {job.isSuspended ? "Activate" : "Suspend"}
            </ActionBtn>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        >
          <StatTile
            icon={FiDollarSign}
            label="Salary"
            value={job.salary}
            accent="indigo"
          />
          <StatTile
            icon={FiUsers}
            label="Vacancies"
            value={job.vacancies}
            accent="emerald"
          />
          <StatTile
            icon={FiBook}
            label="Education"
            value={job.education}
            accent="violet"
          />
          <StatTile
            icon={FiFileText}
            label="Applications"
            value={`${applications.length} received`}
            accent="cyan"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <motion.div {...FADE_UP} transition={{ delay: 0.12 }}>
              <Card className="p-5">
                <SectionHead icon={FiBriefcase} label="Job Details" />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: "Position", value: job.position },
                    { label: "Location", value: job.location },
                    { label: "District", value: job.district },
                    { label: "Experience", value: job.experience },
                    { label: "Skills", value: job.skills },
                    { label: "Gender", value: job.gender },
                    { label: "Salary", value: job.salary },
                    { label: "Education", value: job.education },
                    { label: "Status", value: job.status },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30"
                    >
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                        {label}
                      </p>
                      <p className="text-[11px] font-bold text-white truncate">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-4 text-[10px] text-slate-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <FiClock size={10} />
                    Created:{" "}
                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiActivity size={10} />
                    Updated:{" "}
                    {new Date(job.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.15 }}>
              <Card className="p-5">
                <SectionHead icon={FiUser} label="Poster Profile" />

                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FiUser size={24} className="text-indigo-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center">
                      <FiCheckCircle size={11} className="text-emerald-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Name
                      </p>
                      <button
                        onClick={() => navigate(`/admin/user/${poster._id}`)}
                        className="text-sm font-black text-white hover:text-indigo-400 transition-colors truncate block text-left"
                      >
                        {job.posterName || poster.name || "—"}
                      </button>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Email
                      </p>
                      <a
                        href={`mailto:${job.posterEmail || poster.email}`}
                        className="text-sm font-bold text-indigo-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <FiMail size={12} />{" "}
                        {job.posterEmail || poster.email || "—"}
                      </a>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Phone
                      </p>
                      <a
                        href={`tel:${job.posterContact || poster.phoneNumber}`}
                        className="text-sm font-bold text-indigo-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <FiPhone size={12} />{" "}
                        {job.posterContact || poster.phoneNumber || "—"}
                      </a>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Location
                      </p>
                      <p className="text-sm font-bold text-slate-300 flex items-center gap-1.5 truncate">
                        <FiMapPin size={12} className="text-rose-400" />
                        {poster.district || "—"}
                        {poster.taluka ? `, ${poster.taluka}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${planC.bg} ${planC.text} ${planC.border}`}
                    >
                      <FiAward size={10} />
                      {planSlug} Plan
                    </span>
                    {poster.subscription?.status && (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Status:{" "}
                        <span className="text-slate-400">
                          {poster.subscription.status}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.18 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <SectionHead icon={FiFileText} label="Applications" />
                  <span className="text-[10px] font-black text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/40">
                    {applications.length} total
                  </span>
                </div>

                {applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-600">
                      <FiFileText size={22} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">
                      No applications received yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-125 overflow-y-auto pr-1 scrollbar-hide">
                    {applications.map((app, i) => (
                      <motion.div
                        key={app._id || i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <FiUser size={14} className="text-indigo-400" />
                        </div>

                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-3">
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                              Candidate
                            </p>
                            <p className="text-xs font-bold text-white truncate">
                              {app.candidateName}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                              Contact
                            </p>
                            <p className="text-xs font-bold text-slate-400 truncate">
                              {app.candidateContact}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                              Education
                            </p>
                            <p className="text-xs font-bold text-slate-400 truncate">
                              {app.candidateEducation || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getAppStatusColor(app.applicationStatus)}`}
                          >
                            {app.applicationStatus}
                          </span>
                          <span className="text-[9px] text-slate-600 font-semibold">
                            {new Date(app.appliedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          <div className="space-y-5">
            {usage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-5 border-indigo-500/25">
                  <SectionHead icon={FiTarget} label="Poster Usage & Limits" />

                  <div className="bg-linear-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/15 rounded-xl p-5 mb-4 text-center">
                    <p className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-widest mb-1">
                      Jobs Posted
                    </p>
                    <p className="text-4xl font-black text-white tracking-tight">
                      {usage.usage?.jobsPosted ?? 0}
                      <span className="text-lg text-slate-500 font-bold">
                        {" "}
                        / {usage.usage?.jobsLimit ?? 0}
                      </span>
                    </p>
                    <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(usage.usage?.percentUsed ?? 0, 100)}%`,
                        }}
                        transition={{ duration: 1.2, ease: "circOut" }}
                        className={`h-full rounded-full ${
                          (usage.usage?.percentUsed ?? 0) >= 90
                            ? "bg-linear-to-r from-rose-500 to-red-500"
                            : (usage.usage?.percentUsed ?? 0) >= 60
                              ? "bg-linear-to-r from-amber-500 to-orange-500"
                              : "bg-linear-to-r from-indigo-500 to-violet-500"
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-2">
                      {usage.usage?.percentUsed ?? 0}% quota used ·{" "}
                      {usage.usage?.remaining ?? 0} remaining
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      className={`rounded-xl p-3 text-center border ${planC.bg} ${planC.border}`}
                    >
                      <FiAward
                        size={14}
                        className={`mx-auto mb-1 ${planC.text}`}
                      />
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${planC.text}`}
                      >
                        {usage.user?.plan || "Free"}
                      </p>
                    </div>
                    <div className="rounded-xl p-3 text-center border bg-slate-800/30 border-slate-700/30">
                      <FiShield
                        size={14}
                        className="mx-auto mb-1 text-emerald-400"
                      />
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        {usage.user?.subscriptionStatus || "None"}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div {...FADE_UP} transition={{ delay: 0.22 }}>
              <Card className="p-5">
                <SectionHead icon={FiShield} label="Moderation Status" />

                <div className="space-y-3">
                  <div
                    className={`rounded-xl p-4 border flex items-center gap-3 ${
                      job.isFlagged
                        ? "bg-rose-500/5 border-rose-500/20"
                        : "bg-slate-800/30 border-slate-700/30"
                    }`}
                  >
                    <FiSlash
                      size={16}
                      className={
                        job.isFlagged ? "text-rose-400" : "text-slate-600"
                      }
                    />
                    <div>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          job.isFlagged ? "text-rose-400" : "text-slate-600"
                        }`}
                      >
                        {job.isFlagged ? "Banned" : "Not Banned"}
                      </p>
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {job.isFlagged
                          ? "This job is hidden from user searches"
                          : "This job is visible in listings"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-4 border flex items-center gap-3 ${
                      job.isSuspended
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-slate-800/30 border-slate-700/30"
                    }`}
                  >
                    <FiPauseCircle
                      size={16}
                      className={
                        job.isSuspended ? "text-amber-400" : "text-slate-600"
                      }
                    />
                    <div>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          job.isSuspended ? "text-amber-400" : "text-slate-600"
                        }`}
                      >
                        {job.isSuspended ? "Suspended" : "Active"}
                      </p>
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {job.isSuspended
                          ? "Applications are paused on this job"
                          : "Users can apply to this job"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.24 }}>
              <Card className="p-5">
                <SectionHead icon={FiInfo} label="Registry Info" />

                <div className="space-y-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                      Job ID
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                      {job._id}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                      Poster ID
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                      {poster._id || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex gap-2.5 items-start">
                  <FiInfo
                    size={12}
                    className="text-slate-600 mt-0.5 shrink-0"
                  />
                  <p className="text-[9px] text-slate-600 leading-relaxed">
                    All admin actions are permanent and auditable by the
                    compliance engine.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminJobDetails;
