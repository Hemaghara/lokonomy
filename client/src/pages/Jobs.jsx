import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import { jobService } from "../services";
import { toast } from "react-hot-toast";
import { getTalukas } from "../data/locations";
import { useUser } from "../context/UserContext";
import {
  HiOutlineMapPin,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineRocketLaunch,
  HiOutlineCurrencyRupee,
  HiOutlineBriefcase,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlinePhone,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineShare,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import { FiExternalLink, FiFlag } from "react-icons/fi";
import WishlistButton from "../components/WishlistButton";
import ReportModal from "../components/ReportModal";

// ─── Helpers ────────────────────────────────────────────────────────────────
const getDeadlineInfo = (deadline) => {
  if (!deadline) return null;
  const diff = Math.ceil(
    (new Date(deadline) - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return { text: "Deadline passed", urgent: true, expired: true };
  if (diff === 0) return { text: "Closes today", urgent: true, expired: false };
  if (diff <= 3)
    return { text: `Closes in ${diff}d`, urgent: true, expired: false };
  return { text: `${diff} days left`, urgent: false, expired: false };
};

const JobTypeBadge = ({ type }) => {
  const colors = {
    "Full-time": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Part-time": "bg-blue-500/10   text-blue-400   border-blue-500/20",
    Freelance: "bg-amber-500/10  text-amber-400  border-amber-500/20",
    Contract: "bg-rose-500/10   text-rose-400   border-rose-500/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide shrink-0 ${colors[type] || colors["Full-time"]}`}
    >
      {type || "Full-time"}
    </span>
  );
};

// ─── Skeleton Card ───────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden animate-pulse">
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-[#1f2a3d]" />
        <div className="w-20 h-5 rounded-lg bg-[#1f2a3d]" />
        <div className="w-8 h-8 rounded-xl bg-[#1f2a3d]" />
      </div>
      <div className="h-4 bg-[#1f2a3d] rounded-lg mb-2 w-3/4" />
      <div className="h-4 bg-[#1f2a3d] rounded-lg mb-4 w-1/3" />
      <div className="space-y-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-3 bg-[#1f2a3d] rounded w-full" />
        ))}
      </div>
      <div className="h-1.5 bg-[#1f2a3d] rounded-full w-full" />
    </div>
    <div className="border-t border-[#1f2a3d] p-4 space-y-2">
      <div className="h-9 bg-[#1f2a3d] rounded-xl" />
      <div className="h-9 bg-[#1f2a3d] rounded-xl" />
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
const Jobs = () => {
  const navigate = useNavigate();
  const {
    state,
    district: userDistrict,
    taluka: userTaluka,
    availableDistricts,
  } = useLocation();
  const { user } = useUser();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState("All");
  const [jobTypeFilter, setJobTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [reportConfig, setReportConfig] = useState({
    isOpen: false,
    targetId: null,
  });

  const [selectedDistrict, setSelectedDistrict] = useState(userDistrict || "");
  const [selectedTaluka, setSelectedTaluka] = useState(userTaluka || "");
  const [talukas, setTalukas] = useState([]);

  useEffect(() => {
    if (selectedDistrict) setTalukas(getTalukas(state, selectedDistrict));
    else setTalukas([]);
  }, [selectedDistrict, state]);

  useEffect(() => {
    fetchJobs();
  }, [
    selectedDistrict,
    selectedTaluka,
    genderFilter,
    jobTypeFilter,
    search,
    user,
  ]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobService.getJobs({
        district: selectedDistrict || undefined,
        taluka: selectedTaluka || undefined,
        gender: genderFilter !== "All" ? genderFilter : undefined,
        jobType: jobTypeFilter !== "All" ? jobTypeFilter : undefined,
        search: search || undefined,
      });
      setJobs(response.data);
    } catch (err) {
      console.error("Job fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleApplyClick = (job) => {
    if (!user) {
      toast.error("Please login to apply for this job.");
      navigate("/");
      return;
    }
    navigate(`/jobs/${job._id}/apply`);
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job listing?"))
      return;
    try {
      const response = await jobService.deleteJob(id);
      if (response.data.success) {
        toast.success("Job listing removed successfully");
        fetchJobs();
      }
    } catch {
      toast.error("Failed to delete job listing");
    }
  };

  const handleShare = (job, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/jobs/${job._id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied!"));
  };

  const genderFilters = [
    { label: "All", value: "All" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Universal", value: "Both" },
  ];

  const jobTypeFilters = [
    { label: "All Types", value: "All" },
    { label: "Full-time", value: "Full-time" },
    { label: "Part-time", value: "Part-time" },
    { label: "Freelance", value: "Freelance" },
    { label: "Contract", value: "Contract" },
  ];

  const genderColor = (gender) => {
    if (gender === "Both")
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    if (gender === "Male")
      return "bg-blue-500/10   text-blue-400   border-blue-500/20";
    if (gender === "Female")
      return "bg-pink-500/10   text-pink-400   border-pink-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 appearance-none placeholder:text-slate-600";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <Helmet>
        <title>Find Local Jobs Near You | Lokonomy Careers</title>
        <meta
          name="description"
          content="Explore local job opportunities in your area. Apply to positions posted by verified local businesses and expand your professional career on Lokonomy."
        />
      </Helmet>
      <style>{`
        .jb * { font-family: 'DM Sans', sans-serif; }
        .jb select option { background: #111827; color: #e2e8f0; }
        .no-sb::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="jb max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
              Careers Portal
            </p>
            <h1 className="text-white font-bold text-3xl leading-tight">
              Job Opportunities
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Find employment in{" "}
              <span className="text-slate-300 font-medium">
                {selectedTaluka || selectedDistrict || "all areas"}
              </span>
            </p>
          </div>
          <div className="flex gap-3 self-start sm:self-auto">
            <button
              onClick={() => navigate("/jobs/applied")}
              className="flex items-center gap-2 bg-[#0d1424] border border-[#1f2a3d] hover:border-violet-500/30 text-slate-300 hover:text-violet-400 text-xs font-semibold px-4 py-3 rounded-xl transition-all"
            >
              My Applications
            </button>
            <button
              onClick={() => navigate("/jobs/post")}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30"
            >
              <HiOutlinePlus className="text-base" /> Post Job
            </button>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <div className={`${card} p-4 mb-6 space-y-4`}>
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-base pointer-events-none" />
              <input
                id="job-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by position or skills..."
                className={inputCls + " pl-10"}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all active:scale-95"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                }}
                className="px-4 py-2.5 bg-[#0d1424] border border-[#1f2a3d] text-slate-500 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                Clear
              </button>
            )}
          </form>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Gender filter */}
            <div className="no-sb flex items-center gap-2 overflow-x-auto shrink-0">
              <HiOutlineFunnel className="text-slate-600 text-base shrink-0" />
              {genderFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setGenderFilter(f.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                    ${
                      genderFilter === f.value
                        ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                        : "bg-[#0d1424] text-slate-500 hover:text-slate-300 border border-[#1f2a3d]"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-px lg:h-7 w-full lg:w-px bg-[#1f2a3d] shrink-0" />

            {/* Job Type filter */}
            <div className="no-sb flex items-center gap-2 overflow-x-auto shrink-0">
              {jobTypeFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setJobTypeFilter(f.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                    ${
                      jobTypeFilter === f.value
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-[#0d1424] text-slate-500 hover:text-slate-300 border border-[#1f2a3d]"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-px lg:h-7 w-full lg:w-px bg-[#1f2a3d] shrink-0" />

            {/* Location dropdowns */}
            <div className="flex flex-wrap gap-3 flex-1 w-full">
              <div className="relative flex-1 min-w-36">
                <label htmlFor="district" className="sr-only">
                  Select District
                </label>
                <select
                  id="district"
                  className={inputCls + " pr-9 cursor-pointer"}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedTaluka("");
                  }}
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-sm" />
              </div>

              <div
                className={`relative flex-1 min-w-36 transition-opacity ${!selectedDistrict ? "opacity-30 pointer-events-none" : ""}`}
              >
                <label htmlFor="taluka" className="sr-only">
                  Select Taluka
                </label>
                <select
                  id="taluka"
                  className={inputCls + " pr-9 cursor-pointer"}
                  value={selectedTaluka}
                  onChange={(e) => setSelectedTaluka(e.target.value)}
                  disabled={!selectedDistrict}
                >
                  <option value="">All Talukas</option>
                  {talukas.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Job Grid */}
        <div className="min-h-64">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {jobs.map((job) => {
                  const applied = job.applications?.some(
                    (app) => app.candidateId === user?._id,
                  );
                  const fillPct =
                    job.vacancies > 0
                      ? Math.min(
                          100,
                          Math.round(
                            ((job.applications?.length || 0) / job.vacancies) *
                              100,
                          ),
                        )
                      : 0;
                  const deadlineInfo = getDeadlineInfo(job.deadline);

                  return (
                    <motion.div
                      layout
                      key={job._id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className={`${card} flex flex-col overflow-hidden hover:border-violet-500/30 hover:bg-[#131d2e] transition-all duration-300 cursor-pointer group`}
                      onClick={() => navigate(`/jobs/${job._id}`)}
                    >
                      <div className="p-5 flex-1 flex flex-col">
                        {/* Top row: icon + badges */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="w-11 h-11 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center shrink-0 group-hover:border-violet-500/30 transition-colors">
                            <HiOutlineBriefcase className="text-violet-400 text-xl" />
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            <span
                              className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wide ${genderColor(job.gender)}`}
                            >
                              {job.gender === "Both" ? "Universal" : job.gender}
                            </span>
                            <JobTypeBadge type={job.jobType} />
                            {deadlineInfo && (
                              <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold
                                ${deadlineInfo.urgent ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
                              >
                                <HiOutlineCalendarDays className="text-[10px]" />
                                {deadlineInfo.text}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => handleShare(job, e)}
                              className="w-8 h-8 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center text-slate-500 hover:text-violet-400 hover:border-violet-500/30 transition-all"
                              title="Share"
                            >
                              <HiOutlineShare size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportConfig({
                                  isOpen: true,
                                  targetId: job._id,
                                });
                              }}
                              className="w-8 h-8 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                              title="Report Listing"
                            >
                              <FiFlag size={13} />
                            </button>
                            <WishlistButton
                              type="job"
                              id={job._id}
                              aria-label="Add to wishlist"
                            />
                          </div>
                        </div>

                        {/* Title & Salary */}
                        <h3 className="text-slate-100 font-semibold text-base leading-snug mb-1 group-hover:text-violet-400 transition-colors line-clamp-1">
                          {job.position}
                        </h3>
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm mb-4">
                          <HiOutlineCurrencyRupee className="text-base" />
                          {job.salary}
                          <span className="text-slate-300 font-normal text-xs">
                            /month
                          </span>
                        </div>

                        {/* Meta rows */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2.5 text-xs text-slate-400">
                            <HiOutlineMapPin className="text-rose-400 shrink-0 text-sm" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-slate-400">
                            <HiOutlineAcademicCap className="text-blue-400 shrink-0 text-sm" />
                            <span className="truncate">{job.education}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-slate-400">
                            <HiOutlineClock className="text-amber-400 shrink-0 text-sm" />
                            <span className="truncate">{job.experience}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-slate-400">
                            <HiOutlineUserGroup className="text-purple-400 shrink-0 text-sm" />
                            <span>{job.vacancies} vacancies</span>
                            <span className="ml-auto text-violet-400 font-medium flex items-center gap-1">
                              <HiOutlineRocketLaunch className="text-xs" />
                              {job.applications?.length || 0} applied
                            </span>
                          </div>
                        </div>

                        {/* #11 Vacancy Fill-Rate bar */}
                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-600">
                              Fill Rate
                            </span>
                            <span
                              className={`text-[10px] font-bold ${fillPct >= 80 ? "text-rose-400" : fillPct >= 50 ? "text-amber-400" : "text-emerald-400"}`}
                            >
                              {fillPct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#1f2a3d] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${fillPct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${fillPct >= 80 ? "bg-rose-500" : fillPct >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-[#1f2a3d] p-4 flex flex-col gap-2">
                        <div className="flex gap-2">
                          {applied ? (
                            <button
                              disabled
                              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed"
                            >
                              <HiOutlineCheckCircle className="text-sm" />{" "}
                              Applied
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyClick(job);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[.98]"
                            >
                              <HiOutlinePaperAirplane className="text-sm" />{" "}
                              Apply Now
                            </button>
                          )}
                          {user && user._id === job.posterId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJob(job._id);
                              }}
                              className="w-10 flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                              title="Delete Listing"
                            >
                              <HiOutlineTrash className="text-sm" />
                            </button>
                          )}
                        </div>

                        <a
                          href={`https://wa.me/${job.posterContact}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full bg-[#0d1424] border border-[#1f2a3d] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-300 py-2.5 rounded-xl text-xs font-medium transition-all"
                        >
                          <HiOutlinePhone className="text-sm text-slate-300 group-hover:text-emerald-400" />
                          <span className="truncate">{job.posterContact}</span>
                          <FiExternalLink className="text-xs ml-auto text-slate-400" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {jobs.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center"
                >
                  <div className="text-5xl mb-4 opacity-20">💼</div>
                  <h3 className="text-slate-500 font-semibold text-base mb-1">
                    {search ? `No jobs matching "${search}"` : "No Jobs Found"}
                  </h3>
                  <p className="text-slate-600 text-xs">
                    Try adjusting your filters or location
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ isOpen: false, targetId: null })}
        targetType="job"
        targetId={reportConfig.targetId}
      />
    </div>
  );
};

export default Jobs;
