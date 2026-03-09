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
  HiOutlineFunnel,
} from "react-icons/hi2";
import { FiPlus } from "react-icons/fi";

const JobDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [expandedApplicant, setExpandedApplicant] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMyJobs();
  }, [user]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getMyJobs();
      setMyJobs(response.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job listing?"))
      return;
    try {
      const response = await jobService.deleteJob(id);
      if (response.data.success) {
        toast.success("Job listing deleted successfully");
        fetchMyJobs();
      }
    } catch (err) {
      toast.error("Could not delete job");
    }
  };

  const totalApplicants = myJobs.reduce(
    (sum, j) => sum + (j.applications?.length || 0),
    0,
  );
  const totalVacancies = myJobs.reduce((sum, j) => sum + (j.vacancies || 0), 0);

  const recentApplicants = myJobs
    .flatMap((job) =>
      (job.applications || []).map((app) => ({
        ...app,
        jobPosition: job.position,
        jobId: job._id,
      })),
    )
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .slice(0, 5);

  const filteredJobs =
    filter === "all"
      ? myJobs
      : filter === "with-applicants"
        ? myJobs.filter((j) => j.applications?.length > 0)
        : myJobs.filter((j) => !j.applications?.length);

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";

  const timeAgo = (date) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            Loading Dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .jd * { font-family: 'DM Sans', sans-serif; }
        .no-sb::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="jd max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-3"
            >
              <HiOutlineArrowLeft className="text-sm" /> Back to Profile
            </button>
            <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
              Employer Hub
            </p>
            <h1 className="text-white font-bold text-3xl leading-tight">
              Job Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage listings, track applicants, and review candidates
            </p>
          </div>
          <button
            onClick={() => navigate("/jobs/post")}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30 self-start sm:self-auto"
          >
            <FiPlus className="text-base" /> Post New Job
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          {[
            {
              label: "Total Listings",
              value: myJobs.length,
              icon: <HiOutlineBriefcase />,
              color: "violet",
              desc: "Active job posts",
            },
            {
              label: "Total Applicants",
              value: totalApplicants,
              icon: <HiOutlineUserGroup />,
              color: "emerald",
              desc: "Across all jobs",
            },
            {
              label: "Open Vacancies",
              value: totalVacancies,
              icon: <HiOutlineMapPin />,
              color: "sky",
              desc: "Positions available",
            },
            {
              label: "Avg. per Job",
              value:
                myJobs.length > 0
                  ? (totalApplicants / myJobs.length).toFixed(1)
                  : "0",
              icon: <HiOutlineFunnel />,
              color: "orange",
              desc: "Applicant ratio",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`${card} p-4 group hover:border-${stat.color}-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
            >
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-${stat.color}-400 group-hover:w-full transition-all duration-500 rounded-full`}
              />
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-xl flex items-center justify-center text-${stat.color}-400 text-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {stat.icon}
                </div>
              </div>
              <p className="text-white font-bold text-2xl leading-none mb-1 group-hover:text-white transition-colors">
                {stat.value}
              </p>
              <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-slate-600 text-[10px] mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="lg:col-span-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">
                Your Job Listings
              </h2>
              <div className="no-sb flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: "all", label: "All" },
                  { id: "with-applicants", label: "With Applicants" },
                  { id: "no-applicants", label: "No Applicants" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border
                      ${
                        filter === f.id
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-[#0d1424] text-slate-500 border-[#1f2a3d] hover:text-slate-300"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <motion.div
                  layout
                  key={job._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`${card} overflow-hidden hover:border-violet-500/20 transition-all duration-300`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigate(`/jobs/${job._id}`)}
                      >
                        💼
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="cursor-pointer group"
                            onClick={() => navigate(`/jobs/${job._id}`)}
                          >
                            <h3 className="text-slate-200 font-semibold text-sm group-hover:text-violet-400 transition-colors truncate">
                              {job.position}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                                <HiOutlineMapPin className="text-xs text-violet-400" />
                                {job.location}, {job.district}
                              </span>
                              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                                <HiOutlineBanknotes className="text-xs text-emerald-400" />
                                {job.salary}
                              </span>
                              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                                <HiOutlineClock className="text-xs text-sky-400" />
                                {timeAgo(job.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold">
                            <HiOutlineUserGroup className="text-xs" />
                            {job.applications?.length || 0} Applicants
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold">
                            {job.vacancies} Vacancies
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            {job.education}
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">
                            {job.gender}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => navigate(`/jobs/${job._id}`)}
                          title="View Job"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        >
                          <HiOutlineEye />
                        </button>
                        <button
                          onClick={() => {
                            setExpandedJob(
                              expandedJob === job._id ? null : job._id,
                            );
                            setExpandedApplicant(null);
                          }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1
                            ${
                              expandedJob === job._id
                                ? "bg-violet-600 text-white"
                                : "bg-[#1a2540] text-slate-400 hover:text-slate-200 border border-[#1f2a3d]"
                            }`}
                        >
                          {expandedJob === job._id
                            ? "Hide"
                            : `${job.applications?.length || 0} Apps`}
                          <HiOutlineChevronDown
                            className={`text-xs transition-transform ${expandedJob === job._id ? "rotate-180" : ""}`}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          title="Delete Job"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedJob === job._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-[#1f2a3d] bg-[#0a0f1c]"
                      >
                        <div className="px-4 py-3 flex items-center justify-between border-b border-[#1f2a3d]">
                          <p className="text-slate-400 text-xs font-semibold">
                            <span className="text-white">
                              {job.applications?.length || 0}
                            </span>{" "}
                            Applicant
                            {job.applications?.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-slate-600 text-[10px]">
                            Click on an applicant to expand details
                          </p>
                        </div>

                        <div className="p-4 space-y-2">
                          {job.applications?.length > 0 ? (
                            job.applications.map((app, idx) => {
                              const appKey = `${job._id}-${idx}`;
                              const isExpanded = expandedApplicant === appKey;
                              return (
                                <div
                                  key={idx}
                                  className="bg-[#111827] border border-[#1f2a3d] rounded-xl overflow-hidden hover:border-violet-500/20 transition-all"
                                >
                                  <div
                                    className="p-3.5 flex items-center gap-3 cursor-pointer"
                                    onClick={() =>
                                      setExpandedApplicant(
                                        isExpanded ? null : appKey,
                                      )
                                    }
                                  >
                                    <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 text-sm font-bold shrink-0">
                                      {app.candidateName?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-slate-200 font-semibold text-sm truncate">
                                        {app.candidateName}
                                      </p>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        <p className="text-slate-500 text-[11px] truncate flex items-center gap-1">
                                          <HiOutlineEnvelope className="text-[10px]" />{" "}
                                          {app.candidateEmail}
                                        </p>
                                        {app.candidateExperience && (
                                          <span className="text-slate-600 text-[10px] font-medium hidden sm:block">
                                            • {app.candidateExperience}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {app.appliedAt && (
                                        <span className="text-slate-600 text-[10px] font-medium hidden sm:flex items-center gap-1">
                                          <HiOutlineCalendarDays className="text-[10px]" />
                                          {timeAgo(app.appliedAt)}
                                        </span>
                                      )}
                                      <HiOutlineChevronDown
                                        className={`text-slate-500 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                      />
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                          height: "auto",
                                          opacity: 1,
                                        }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-4 pb-4 pt-1 border-t border-[#1f2a3d]">
                                          <div className="grid grid-cols-2 gap-2.5 mt-3">
                                            <div className="bg-[#0d1424] border border-[#1f2a3d] rounded-lg p-3">
                                              <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <HiOutlinePhone className="text-violet-400" />{" "}
                                                Phone
                                              </p>
                                              <p className="text-slate-200 font-semibold text-xs">
                                                {app.candidateContact || "N/A"}
                                              </p>
                                            </div>
                                            <div className="bg-[#0d1424] border border-[#1f2a3d] rounded-lg p-3">
                                              <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <HiOutlineClock className="text-amber-400" />{" "}
                                                Experience
                                              </p>
                                              <p className="text-slate-200 font-semibold text-xs">
                                                {app.candidateExperience ||
                                                  "N/A"}
                                              </p>
                                            </div>
                                            <div className="bg-[#0d1424] border border-[#1f2a3d] rounded-lg p-3">
                                              <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <HiOutlineAcademicCap className="text-blue-400" />{" "}
                                                Education
                                              </p>
                                              <p className="text-slate-200 font-semibold text-xs">
                                                {app.candidateEducation ||
                                                  "N/A"}
                                              </p>
                                            </div>
                                            <div className="bg-[#0d1424] border border-[#1f2a3d] rounded-lg p-3">
                                              <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <HiOutlineCalendarDays className="text-emerald-400" />{" "}
                                                Applied
                                              </p>
                                              <p className="text-slate-200 font-semibold text-xs">
                                                {app.appliedAt
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
                                                  : "N/A"}
                                              </p>
                                            </div>
                                          </div>

                                          {app.candidateSkills && (
                                            <div className="mt-3">
                                              <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <HiOutlineWrenchScrewdriver className="text-violet-400" />{" "}
                                                Skills
                                              </p>
                                              <div className="flex flex-wrap gap-1.5">
                                                {app.candidateSkills
                                                  .split(",")
                                                  .map((skill, si) => (
                                                    <span
                                                      key={si}
                                                      className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-[10px] font-semibold"
                                                    >
                                                      {skill.trim()}
                                                    </span>
                                                  ))}
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#1f2a3d]">
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
                                                className="flex items-center gap-1.5 px-3 py-2 bg-[#0d1424] border border-[#1f2a3d] hover:border-violet-500/30 hover:text-violet-400 text-slate-400 rounded-xl text-[11px] font-semibold transition-all"
                                              >
                                                <HiOutlineDocumentText className="text-sm" />{" "}
                                                Download Biodata
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
                                                className="flex items-center gap-1.5 px-3 py-2 bg-[#0d1424] border border-[#1f2a3d] hover:border-blue-500/30 hover:text-blue-400 text-slate-400 rounded-xl text-[11px] font-semibold transition-all"
                                              >
                                                <HiOutlineAcademicCap className="text-sm" />{" "}
                                                Download Certificate
                                              </a>
                                            )}
                                            <a
                                              href={`https://wa.me/${app.candidateContact}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-xl text-[11px] font-semibold transition-all"
                                            >
                                              <HiOutlineArrowUpRight className="text-sm" />{" "}
                                              WhatsApp
                                            </a>
                                            <a
                                              href={`mailto:${app.candidateEmail}`}
                                              className="flex items-center gap-1.5 px-3 py-2 bg-[#0d1424] border border-[#1f2a3d] hover:border-violet-500/30 hover:text-violet-400 text-slate-400 rounded-xl text-[11px] font-semibold transition-all"
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
                            <div className="py-10 text-center">
                              <div className="text-2xl mb-2 opacity-20">📭</div>
                              <p className="text-slate-600 text-xs">
                                No applicants yet for this position
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-16 text-center">
                  <div className="text-4xl mb-3 opacity-20">💼</div>
                  <p className="text-slate-500 text-sm font-medium mb-1">
                    {filter === "all"
                      ? "No job listings yet"
                      : filter === "with-applicants"
                        ? "No jobs with applicants"
                        : "All jobs have applicants!"}
                  </p>
                  <p className="text-slate-600 text-xs mb-5">
                    {filter === "all"
                      ? "Post your first job to start receiving applications"
                      : "Try changing the filter"}
                  </p>
                  {filter === "all" && (
                    <button
                      onClick={() => navigate("/jobs/post")}
                      className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
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
            transition={{ duration: 0.35, delay: 0.15 }}
            className="lg:col-span-4 space-y-4"
          >
            <div className={`${card} p-4`}>
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <HiOutlineClock className="text-violet-400" />
                Recent Applications
              </h3>

              {recentApplicants.length > 0 ? (
                <div className="space-y-2.5">
                  {recentApplicants.map((app, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 bg-[#0d1424] border border-[#1f2a3d] rounded-xl hover:border-violet-500/20 transition-all"
                    >
                      <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                        {app.candidateName?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-semibold text-xs truncate">
                          {app.candidateName}
                        </p>
                        <p className="text-slate-600 text-[10px] truncate mt-0.5">
                          Applied for{" "}
                          <span className="text-violet-400/70">
                            {app.jobPosition}
                          </span>
                        </p>
                      </div>
                      <span className="text-slate-600 text-[10px] font-medium shrink-0">
                        {timeAgo(app.appliedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-slate-600 text-xs">
                    No applications received yet
                  </p>
                </div>
              )}
            </div>

            <div className={`${card} p-4`}>
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <HiOutlineBriefcase className="text-emerald-400" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                {myJobs.slice(0, 5).map((job) => (
                  <div key={job._id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs font-medium truncate">
                        {job.position}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 bg-[#1f2a3d] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, ((job.applications?.length || 0) / Math.max(1, job.vacancies)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-slate-500 text-[10px] font-bold w-8 text-right">
                        {job.applications?.length || 0}/{job.vacancies}
                      </span>
                    </div>
                  </div>
                ))}
                {myJobs.length === 0 && (
                  <p className="text-slate-600 text-xs text-center py-4">
                    Post jobs to see stats
                  </p>
                )}
              </div>
            </div>

            <div className={`${card} p-4`}>
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <HiOutlineArrowUpRight className="text-sky-400" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/jobs/post")}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#0d1424] border border-[#1f2a3d] hover:border-violet-500/30 hover:text-violet-400 text-slate-400 rounded-xl text-xs font-semibold transition-all"
                >
                  <FiPlus className="text-sm" /> Post New Job
                </button>
                <button
                  onClick={() => navigate("/jobs")}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#0d1424] border border-[#1f2a3d] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-400 rounded-xl text-xs font-semibold transition-all"
                >
                  <HiOutlineEye className="text-sm" /> Browse All Jobs
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
