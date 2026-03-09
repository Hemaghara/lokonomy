import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jobService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineChevronDown,
  HiOutlineUserGroup,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineWrenchScrewdriver,
  HiOutlineCalendarDays,
  HiOutlineArrowUpRight,
  HiOutlineBriefcase,
  HiOutlineBanknotes,
  HiOutlineMapPin,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineChartBarSquare,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FiPlus } from "react-icons/fi";

const STATUS_STYLES = {
  Applied: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Under Review": "bg-amber-500/10  text-amber-400  border-amber-500/20",
  Interview: "bg-sky-500/10    text-sky-400    border-sky-500/20",
  Selected: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Rejected: "bg-rose-500/10   text-rose-400   border-rose-500/20",
};

const JobDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [expandedApplicant, setExpandedApplicant] = useState(null);
  const [filter, setFilter] = useState("all");
  const [togglingStatus, setTogglingStatus] = useState(null);

  useEffect(() => {
    fetchMyJobs();
  }, [user]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await jobService.getMyJobs();
      setMyJobs(res.data);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job listing?")) return;
    try {
      const res = await jobService.deleteJob(id);
      if (res.data.success) {
        toast.success("Job deleted successfully");
        fetchMyJobs();
      }
    } catch {
      toast.error("Could not delete job");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      setTogglingStatus(id);
      const res = await jobService.toggleJobStatus(id);
      if (res.data.success) {
        toast.success(res.data.message);
        setMyJobs((prev) =>
          prev.map((j) =>
            j._id === id ? { ...j, status: res.data.status } : j,
          ),
        );
      }
    } catch {
      toast.error("Could not update status");
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleUpdateAppStatus = async (jobId, applicantId, newStatus) => {
    try {
      const res = await jobService.updateApplicationStatus(
        jobId,
        applicantId,
        newStatus,
      );
      if (res.data.success) {
        toast.success("Applicant status updated");
        setMyJobs((prev) =>
          prev.map((j) => {
            if (j._id !== jobId) return j;
            return {
              ...j,
              applications: j.applications.map((a) =>
                a._id === applicantId
                  ? { ...a, applicationStatus: newStatus }
                  : a,
              ),
            };
          }),
        );
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const totalApplicants = myJobs.reduce(
    (s, j) => s + (j.applications?.length || 0),
    0,
  );
  const totalVacancies = myJobs.reduce((s, j) => s + (j.vacancies || 0), 0);
  const openJobs = myJobs.filter((j) => (j.status || "Open") === "Open").length;
  const closedJobs = myJobs.filter((j) => j.status === "Closed").length;

  const recentApplicants = myJobs
    .flatMap((j) =>
      (j.applications || []).map((a) => ({
        ...a,
        jobPosition: j.position,
        jobId: j._id,
      })),
    )
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .slice(0, 5);

  const filteredJobs =
    {
      all: myJobs,
      open: myJobs.filter((j) => (j.status || "Open") === "Open"),
      closed: myJobs.filter((j) => j.status === "Closed"),
      "with-applicants": myJobs.filter((j) => j.applications?.length > 0),
      "no-applicants": myJobs.filter((j) => !j.applications?.length),
    }[filter] || myJobs;

  const timeAgo = (date) => {
    if (!date) return "";
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-slate-600 text-[11px] font-semibold tracking-[0.18em] uppercase">
          Loading Dashboard
        </p>
      </div>
    );

  const STATS = [
    {
      label: "Total Listings",
      value: myJobs.length,
      icon: <HiOutlineBriefcase />,
      badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      val: "text-white",
    },
    {
      label: "Active Openings",
      value: openJobs,
      icon: <HiOutlineSparkles />,
      badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      val: "text-emerald-400",
    },
    {
      label: "Closed Roles",
      value: closedJobs,
      icon: <HiOutlineBriefcase />,
      badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      val: "text-rose-400",
    },
    {
      label: "Total Applicants",
      value: totalApplicants,
      icon: <HiOutlineUserGroup />,
      badge: "bg-sky-500/10 border-sky-500/20 text-sky-400",
      val: "text-sky-400",
    },
    {
      label: "Open Vacancies",
      value: totalVacancies,
      icon: <HiOutlineChartBarSquare />,
      badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      val: "text-amber-400",
    },
  ];

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "open", label: "Active" },
    { id: "closed", label: "Closed" },
    { id: "with-applicants", label: "Has Apps" },
    { id: "no-applicants", label: "No Apps" },
  ];

  return (
    <div className="min-h-screen bg-[#030712] pt-24 pb-20 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-indigo-600/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10"
        >
          <div>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-400 text-xs font-medium mb-5 transition-colors"
            >
              <HiOutlineArrowLeft /> Back to Profile
            </button>

            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-0.5 h-6 rounded-full bg-linear-to-b from-indigo-500 to-violet-600" />
              <span className="text-indigo-400 text-[10px] font-bold tracking-[0.22em] uppercase">
                Employer Hub
              </span>
            </div>

            <h1 className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-[1.08]">
              Job Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Manage listings · Track applicants · Review candidates
            </p>
          </div>

          <button
            onClick={() => navigate("/jobs/post")}
            className="self-start sm:self-auto flex items-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white text-[13px] font-semibold px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/40"
          >
            <FiPlus className="text-base" /> Post a New Job
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.07 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="relative bg-[#080f1c] border border-white/5.5 rounded-2xl p-5 overflow-hidden group hover:border-white/10 hover:bg-[#0b1422] transition-all duration-300 cursor-default"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/7 to-transparent" />

              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[15px] mb-4 ${s.badge}`}
              >
                {s.icon}
              </div>
              <p
                className={`text-[28px] font-extrabold tracking-tight leading-none ${s.val}`}
              >
                {s.value}
              </p>
              <p className="text-slate-300 text-[11px] font-semibold mt-1.5 tracking-wide">
                {s.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_310px] gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.13 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-white font-bold text-[15px] tracking-tight">
                  Your Listings
                </h2>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  {filteredJobs.length} result
                  {filteredJobs.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all duration-200
                      ${
                        filter === f.id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-900/30"
                          : "bg-white/2.5 border-white/6 text-slate-500 hover:text-slate-300 hover:border-white/10"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const isOpen = (job.status || "Open") === "Open";
                const isExpanded = expandedJob === job._id;

                return (
                  <motion.div
                    layout
                    key={job._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-[#080f1c] border rounded-2xl overflow-hidden transition-all duration-300
                      hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/50
                      ${
                        isOpen
                          ? "border-white/5.5 hover:border-indigo-500/25"
                          : "border-white/3 opacity-70 hover:opacity-85 hover:border-white/7"
                      }`}
                  >
                    <div
                      className={`h-px ${isOpen ? "bg-linear-to-r from-indigo-500/60 via-violet-500/30 to-transparent" : "bg-linear-to-r from-slate-700/50 to-transparent"}`}
                    />

                    <div className="p-5">
                      <div className="flex gap-4 items-start">
                        <div
                          onClick={() => navigate(`/jobs/${job._id}`)}
                          className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition-transform
                            ${isOpen ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-white/4 border border-white/6"}`}
                        >
                          💼
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div
                              onClick={() => navigate(`/jobs/${job._id}`)}
                              className="cursor-pointer group/title"
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <h3 className="text-[15px] font-bold text-slate-100 group-hover/title:text-indigo-400 transition-colors">
                                  {job.position}
                                </h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border
                                  ${isOpen ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}
                                  />
                                  {isOpen ? "Hiring" : "Closed"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <HiOutlineMapPin className="text-indigo-400 text-xs shrink-0" />
                                  {job.location}, {job.district}
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <HiOutlineBanknotes className="text-emerald-400 text-xs shrink-0" />
                                  {job.salary}
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <HiOutlineClock className="text-sky-400 text-xs shrink-0" />
                                  Posted {timeAgo(job.createdAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 flex-wrap">
                              <button
                                onClick={() => handleToggleStatus(job._id)}
                                disabled={togglingStatus === job._id}
                                title={
                                  isOpen ? "Close listing" : "Reopen listing"
                                }
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-[13px]
                                  ${isOpen ? "border-white/6 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20" : "border-white/6 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20"}
                                  ${togglingStatus === job._id ? "animate-spin" : ""}`}
                              >
                                <HiOutlineArrowPath />
                              </button>
                              <button
                                onClick={() => navigate(`/edit-job/${job._id}`)}
                                title="Edit listing"
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/6 text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all text-[13px]"
                              >
                                <HiOutlinePencilSquare />
                              </button>
                              <button
                                onClick={() => navigate(`/jobs/${job._id}`)}
                                title="Preview listing"
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/6 text-slate-600 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/20 transition-all text-[13px]"
                              >
                                <HiOutlineEye />
                              </button>
                              <button
                                onClick={() => {
                                  setExpandedJob(isExpanded ? null : job._id);
                                  setExpandedApplicant(null);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all
                                  ${
                                    isExpanded
                                      ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                                      : "border-white/6 text-slate-500 hover:text-slate-300 hover:border-white/10"
                                  }`}
                              >
                                {isExpanded
                                  ? "Hide"
                                  : `${job.applications?.length || 0} Apps`}
                                <HiOutlineChevronDown
                                  className={`text-[10px] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job._id)}
                                title="Delete listing"
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/6 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all text-[13px]"
                              >
                                <HiOutlineTrash />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4 pt-3.5 border-t border-white/4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[10px] font-semibold">
                              <HiOutlineUserGroup className="text-[11px]" />
                              {job.applications?.length || 0} Applicants
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/15 text-sky-400 text-[10px] font-semibold">
                              {job.vacancies}{" "}
                              {job.vacancies === 1 ? "Vacancy" : "Vacancies"}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/15 text-violet-400 text-[10px] font-semibold">
                              {job.education}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15 text-amber-400 text-[10px] font-semibold">
                              {job.gender}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          key="drawer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/5 bg-black/25">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/4">
                              <p className="text-[12px] font-semibold text-slate-400">
                                <span className="text-white font-bold">
                                  {job.applications?.length || 0}
                                </span>{" "}
                                Applicant
                                {job.applications?.length !== 1 ? "s" : ""}
                              </p>
                              <p className="text-slate-700 text-[10px]">
                                Click a candidate to expand
                              </p>
                            </div>

                            <div className="p-4 space-y-2">
                              {job.applications?.length > 0 ? (
                                job.applications.map((app, idx) => {
                                  const appKey = `${job._id}-${idx}`;
                                  const isExpApp = expandedApplicant === appKey;
                                  const st =
                                    STATUS_STYLES[
                                      app.applicationStatus || "Applied"
                                    ] || STATUS_STYLES.Applied;

                                  return (
                                    <div
                                      key={idx}
                                      className="bg-[#080f1c] border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/20 transition-all duration-200"
                                    >
                                      <div
                                        onClick={() =>
                                          setExpandedApplicant(
                                            isExpApp ? null : appKey,
                                          )
                                        }
                                        className="flex items-center gap-3 p-3.5 cursor-pointer"
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0">
                                          {app.candidateName?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-slate-200 font-semibold text-[13px] truncate">
                                            {app.candidateName}
                                          </p>
                                          <p className="text-slate-600 text-[10px] truncate flex items-center gap-1 mt-0.5">
                                            <HiOutlineEnvelope className="text-[9px]" />{" "}
                                            {app.candidateEmail}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${st}`}
                                          >
                                            {app.applicationStatus || "Applied"}
                                          </span>
                                          <select
                                            value={
                                              app.applicationStatus || "Applied"
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) =>
                                              handleUpdateAppStatus(
                                                job._id,
                                                app._id,
                                                e.target.value,
                                              )
                                            }
                                            className="bg-[#0c1526] border border-white/7 text-[10px] text-slate-400 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500/50 cursor-pointer transition-colors"
                                          >
                                            {[
                                              "Applied",
                                              "Under Review",
                                              "Interview",
                                              "Selected",
                                              "Rejected",
                                            ].map((s) => (
                                              <option key={s} value={s}>
                                                {s}
                                              </option>
                                            ))}
                                          </select>
                                          {app.appliedAt && (
                                            <span className="text-slate-700 text-[10px] hidden sm:flex items-center gap-1">
                                              <HiOutlineCalendarDays className="text-[9px]" />{" "}
                                              {timeAgo(app.appliedAt)}
                                            </span>
                                          )}
                                          <HiOutlineChevronDown
                                            className={`text-slate-600 text-xs transition-transform duration-200 ${isExpApp ? "rotate-180" : ""}`}
                                          />
                                        </div>
                                      </div>

                                      {/* Applicant detail */}
                                      <AnimatePresence>
                                        {isExpApp && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                              height: "auto",
                                              opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.17 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-4 pb-4 pt-0.5 border-t border-white/4">
                                              <div className="grid grid-cols-2 gap-2 mt-3">
                                                {[
                                                  {
                                                    icon: <HiOutlinePhone />,
                                                    iconColor:
                                                      "text-indigo-400",
                                                    label: "Phone",
                                                    val:
                                                      app.candidateContact ||
                                                      "N/A",
                                                  },
                                                  {
                                                    icon: <HiOutlineClock />,
                                                    iconColor: "text-amber-400",
                                                    label: "Experience",
                                                    val:
                                                      app.candidateExperience ||
                                                      "N/A",
                                                  },
                                                  {
                                                    icon: (
                                                      <HiOutlineAcademicCap />
                                                    ),
                                                    iconColor: "text-sky-400",
                                                    label: "Education",
                                                    val:
                                                      app.candidateEducation ||
                                                      "N/A",
                                                  },
                                                  {
                                                    icon: (
                                                      <HiOutlineCalendarDays />
                                                    ),
                                                    iconColor:
                                                      "text-emerald-400",
                                                    label: "Applied On",
                                                    val: app.appliedAt
                                                      ? new Date(
                                                          app.appliedAt,
                                                        ).toLocaleDateString(
                                                          undefined,
                                                          {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                          },
                                                        )
                                                      : "N/A",
                                                  },
                                                ].map((f, fi) => (
                                                  <div
                                                    key={fi}
                                                    className="bg-black/30 border border-white/4 rounded-xl p-3"
                                                  >
                                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.12em] mb-1 flex items-center gap-1">
                                                      <span
                                                        className={f.iconColor}
                                                      >
                                                        {f.icon}
                                                      </span>{" "}
                                                      {f.label}
                                                    </p>
                                                    <p className="text-slate-200 font-semibold text-xs">
                                                      {f.val}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>

                                              {app.candidateSkills && (
                                                <div className="mt-3">
                                                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.12em] mb-2 flex items-center gap-1">
                                                    <HiOutlineWrenchScrewdriver className="text-violet-400" />{" "}
                                                    Skills
                                                  </p>
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {app.candidateSkills
                                                      .split(",")
                                                      .map((sk, si) => (
                                                        <span
                                                          key={si}
                                                          className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/15 text-violet-400 rounded-lg text-[10px] font-semibold"
                                                        >
                                                          {sk.trim()}
                                                        </span>
                                                      ))}
                                                  </div>
                                                </div>
                                              )}

                                              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/4">
                                                {app.candidateBiodata && (
                                                  <a
                                                    href={
                                                      app.candidateBiodata.includes(
                                                        "cloudinary.com",
                                                      )
                                                        ? app.candidateBiodata.replace(
                                                            "/upload/",
                                                            "/upload/fl_attachment/",
                                                          )
                                                        : app.candidateBiodata
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={`${app.candidateName}_biodata.pdf`}
                                                    className="flex items-center gap-2 px-3.5 py-2 bg-white/2.5 border border-white/7 hover:border-indigo-500/30 hover:text-indigo-400 text-slate-400 rounded-xl text-[11px] font-semibold transition-all"
                                                  >
                                                    <HiOutlineDocumentText className="text-sm" />{" "}
                                                    Biodata
                                                  </a>
                                                )}
                                                {app.candidateCertificate && (
                                                  <a
                                                    href={
                                                      app.candidateCertificate.includes(
                                                        "cloudinary.com",
                                                      )
                                                        ? app.candidateCertificate.replace(
                                                            "/upload/",
                                                            "/upload/fl_attachment/",
                                                          )
                                                        : app.candidateCertificate
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={`${app.candidateName}_certificate`}
                                                    className="flex items-center gap-2 px-3.5 py-2 bg-white/2.5 border border-white/7 hover:border-sky-500/30 hover:text-sky-400 text-slate-400 rounded-xl text-[11px] font-semibold transition-all"
                                                  >
                                                    <HiOutlineAcademicCap className="text-sm" />{" "}
                                                    Certificate
                                                  </a>
                                                )}
                                                <a
                                                  href={`https://wa.me/${app.candidateContact}`}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-emerald-400 rounded-xl text-[11px] font-semibold transition-all"
                                                >
                                                  <HiOutlineArrowUpRight className="text-sm" />{" "}
                                                  WhatsApp
                                                </a>
                                                <a
                                                  href={`mailto:${app.candidateEmail}`}
                                                  className="flex items-center gap-2 px-3.5 py-2 bg-white/2.5 border border-white/7 hover:border-violet-500/30 hover:text-violet-400 text-slate-400 rounded-xl text-[11px] font-semibold transition-all"
                                                >
                                                  <HiOutlineEnvelope className="text-sm" />{" "}
                                                  Email
                                                </a>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="py-12 text-center">
                                  <p className="text-4xl mb-3 opacity-10">📭</p>
                                  <p className="text-slate-600 text-xs font-medium">
                                    No applicants yet
                                  </p>
                                  <p className="text-slate-700 text-[11px] mt-0.5">
                                    Share this listing to attract candidates
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="border-2 border-dashed border-white/4 rounded-2xl py-20 text-center">
                  <p className="text-5xl mb-4 opacity-8">💼</p>
                  <p className="text-slate-400 text-sm font-semibold mb-1">
                    {filter === "all"
                      ? "No listings yet"
                      : filter === "open"
                        ? "No active listings"
                        : filter === "closed"
                          ? "No closed listings"
                          : filter === "with-applicants"
                            ? "No listings with applicants"
                            : "All listings have applicants!"}
                  </p>
                  <p className="text-slate-700 text-xs mb-6">
                    {filter === "all"
                      ? "Post your first job to start receiving applications"
                      : "Try a different filter to see results"}
                  </p>
                  {filter === "all" && (
                    <button
                      onClick={() => navigate("/jobs/post")}
                      className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/30"
                    >
                      <FiPlus /> Post your first job
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="space-y-4"
          >
            <div className="bg-[#080f1c] border border-white/5.5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm shrink-0">
                  <HiOutlineClock />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[13px]">
                    Recent Applications
                  </h3>
                  <p className="text-slate-600 text-[10px]">
                    Latest candidate activity
                  </p>
                </div>
              </div>

              {recentApplicants.length > 0 ? (
                <div className="space-y-2">
                  {recentApplicants.map((app, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 bg-black/20 border border-white/4 rounded-xl hover:border-indigo-500/15 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                        {app.candidateName?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-semibold text-xs truncate">
                          {app.candidateName}
                        </p>
                        <p className="text-slate-600 text-[10px] truncate mt-0.5">
                          <span className="text-indigo-400/70">
                            {app.jobPosition}
                          </span>
                        </p>
                      </div>
                      <span className="text-slate-700 text-[10px] font-medium shrink-0">
                        {timeAgo(app.appliedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-700 text-xs">
                    No applications received yet
                  </p>
                </div>
              )}
            </div>

            <div className="bg-[#080f1c] border border-white/5.5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm shrink-0">
                  <HiOutlineChartBarSquare />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[13px]">
                    Fill Rate
                  </h3>
                  <p className="text-slate-600 text-[10px]">
                    Applicants vs vacancies
                  </p>
                </div>
              </div>

              {myJobs.length > 0 ? (
                <div className="space-y-4">
                  {myJobs.slice(0, 5).map((job) => {
                    const isOpen = (job.status || "Open") === "Open";
                    const pct = Math.min(
                      100,
                      ((job.applications?.length || 0) /
                        Math.max(1, job.vacancies)) *
                        100,
                    );
                    return (
                      <div key={job._id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-slate-300 text-[11px] font-medium truncate flex-1 mr-2">
                            {job.position}
                          </p>
                          <span className="text-slate-600 text-[10px] font-bold shrink-0">
                            {job.applications?.length || 0}/{job.vacancies}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/4 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.8,
                              ease: "easeOut",
                              delay: 0.25,
                            }}
                            className={`h-full rounded-full ${isOpen ? "bg-linear-to-r from-indigo-500 to-violet-500" : "bg-slate-700"}`}
                          />
                        </div>
                        <p
                          className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isOpen ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {isOpen ? "Active" : "Closed"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-700 text-xs text-center py-6">
                  Post jobs to see fill rate
                </p>
              )}
            </div>

            <div className="bg-[#080f1c] border border-white/5.5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm shrink-0">
                  <HiOutlineSparkles />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[13px]">
                    Quick Actions
                  </h3>
                  <p className="text-slate-600 text-[10px]">Common tasks</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/jobs/post")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/15 text-indigo-400 rounded-xl text-xs font-semibold transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-sm shrink-0">
                    <FiPlus />
                  </div>
                  Post a New Job
                </button>
                <button
                  onClick={() => navigate("/jobs")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/2 border border-white/5 hover:border-white/10 hover:bg-white/4 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-semibold transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm shrink-0">
                    <HiOutlineEye />
                  </div>
                  Browse All Jobs
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JobDashboard;
