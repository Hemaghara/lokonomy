import { useState, useEffect } from "react";
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
} from "react-icons/hi2";
import { FiExternalLink } from "react-icons/fi";
import WishlistButton from "../components/WishlistButton";

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
  const [filter, setFilter] = useState("All");

  const [selectedDistrict, setSelectedDistrict] = useState(userDistrict || "");
  const [selectedTaluka, setSelectedTaluka] = useState(userTaluka || "");
  const [talukas, setTalukas] = useState([]);

  useEffect(() => {
    if (selectedDistrict) {
      setTalukas(getTalukas(state, selectedDistrict));
    } else {
      setTalukas([]);
    }
  }, [selectedDistrict, state]);

  useEffect(() => {
    fetchJobs();
  }, [selectedDistrict, selectedTaluka, filter, user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobService.getJobs({
        district: selectedDistrict,
        taluka: selectedTaluka,
        gender: filter,
      });
      setJobs(response.data);
    } catch (err) {
      console.error("Job fetch error:", err);
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      toast.error("Failed to delete job listing");
    }
  };


  const filters = [
    { label: "All", value: "All" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Universal", value: "Both" },
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
  const label =
    "flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .jb * { font-family: 'DM Sans', sans-serif; }
        .jb select option { background: #111827; color: #e2e8f0; }
        .no-sb::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="jb max-w-6xl mx-auto px-4">
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
            <p className="text-slate-500 text-sm mt-1">
              Find employment in{" "}
              <span className="text-slate-300 font-medium">
                {selectedTaluka || selectedDistrict || "all areas"}
              </span>
            </p>
          </div>
          <button
            onClick={() => navigate("/jobs/post")}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30 self-start sm:self-auto"
          >
            <HiOutlinePlus className="text-base" /> Post Job
          </button>
        </motion.div>

        <div
          className={`${card} p-4 mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center`}
        >
          <div className="no-sb flex items-center gap-2 overflow-x-auto shrink-0">
            <HiOutlineFunnel className="text-slate-600 text-base shrink-0" />
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                  ${
                    filter === f.value
                      ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                      : "bg-[#0d1424] text-slate-500 hover:text-slate-300 border border-[#1f2a3d]"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-px lg:h-7 w-full lg:w-px bg-[#1f2a3d] shrink-0" />

          <div className="flex flex-wrap gap-3 flex-1 w-full">
            <div className="relative flex-1 min-w-36">
              <select
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
              <select
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

        <div className="min-h-64">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#111827] h-80 rounded-2xl animate-pulse opacity-40"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {jobs.map((job) => (
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
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center shrink-0 group-hover:border-violet-500/30 transition-colors">
                          <HiOutlineBriefcase className="text-violet-400 text-xl" />
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wide shrink-0 ${genderColor(job.gender)}`}
                        >
                          {job.gender === "Both" ? "Universal" : job.gender}
                        </span>
                        <WishlistButton type="job" id={job._id} />
                      </div>

                      <h3 className="text-slate-100 font-semibold text-base leading-snug mb-1 group-hover:text-violet-400 transition-colors line-clamp-1">
                        {job.position}
                      </h3>
                      <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm mb-4">
                        <HiOutlineCurrencyRupee className="text-base" />
                        {job.salary}
                        <span className="text-slate-600 font-normal text-xs">
                          /month
                        </span>
                      </div>

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
                    </div>
                    <div className="border-t border-[#1f2a3d] p-4 flex flex-col gap-2">
                      <div className="flex gap-2">
                        {job.applications?.some(
                          (app) => app.candidateId === user?._id,
                        ) ? (
                          <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed"
                          >
                            <HiOutlineCheckCircle className="text-sm" /> Applied
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyClick(job);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[.98]"
                          >
                            <HiOutlinePaperAirplane className="text-sm" /> Apply
                            Now
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
                        className="flex items-center justify-center gap-2 w-full bg-[#0d1424] border border-[#1f2a3d] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-500 py-2.5 rounded-xl text-xs font-medium transition-all"
                      >
                        <HiOutlinePhone className="text-sm" />
                        {job.posterContact}
                        <FiExternalLink className="text-xs ml-auto" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {jobs.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center"
                >
                  <div className="text-5xl mb-4 opacity-20">📭</div>
                  <h3 className="text-slate-500 font-semibold text-base mb-1">
                    No Jobs Found
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
    </div>
  );
};

export default Jobs;
