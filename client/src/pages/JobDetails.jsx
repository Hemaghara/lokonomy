import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { jobService } from "../services";
import recommendationService from "../services/recommendationService";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineShare,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendarDays,
  HiOutlineBriefcase,
  HiOutlineRocketLaunch,
  HiOutlineWrenchScrewdriver,
  HiOutlineClipboardDocument,
  HiOutlineArrowRight,
  HiOutlinePencilSquare,
  HiOutlineEye,
} from "react-icons/hi2";
import WishlistButton from "../components/WishlistButton";
import ReportModal from "../components/ReportModal";
import { FiFlag } from "react-icons/fi";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);


  const isOwner = user && job && user._id === job.posterId;
  const hasApplied =
    user &&
    job &&
    job.applications?.some((app) => app.candidateId === user._id);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobService.getJobById(id);
      setJob(response.data);
      if (user) {
        recommendationService.trackInteraction("view", "job", id);
      }
      const simResponse = await jobService.getSimilarJobs(id);
      setSimilarJobs(simResponse.data);
    } catch (err) {
      console.error("Error fetching job:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (
      !window.confirm(
        "Are you sure you want to withdraw your application? This action cannot be undone.",
      )
    )
      return;

    try {
      setWithdrawing(true);
      const res = await jobService.withdrawApplication(id);
      if (res.data.success) {
        toast.success("Application withdrawn successfully");
        fetchJobDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw application");
    } finally {
      setWithdrawing(false);
    }
  };


  const handleApplyClick = () => {
    if (!user) {
      toast.error("Please login to apply for this job.");
      navigate("/");
      return;
    }
    navigate(`/jobs/${id}/apply`);
  };

  const handleDeleteJob = async () => {
    if (!window.confirm("Are you sure you want to delete this job listing?"))
      return;
    try {
      const response = await jobService.deleteJob(id);
      if (response.data.success) {
        toast.success("Job listing removed successfully");
        navigate("/jobs");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete job listing");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
          Loading…
        </p>
      </div>
    );
  if (!job)
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4 opacity-20">💼</div>
        <h2 className="text-white font-semibold text-lg mb-2">Job Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          This listing may have been closed or removed from our network.
        </p>
        <button
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          <HiOutlineArrowLeft /> Back to Jobs
        </button>
      </div>
    );

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const label =
    "text-[10px] font-semibold text-slate-500 uppercase tracking-widest";

  const genderColor =
    job.gender === "Both"
      ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
      : job.gender === "Male"
        ? "bg-blue-500/10   text-blue-400   border-blue-500/20"
        : "bg-pink-500/10   text-pink-400   border-pink-500/20";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-32 md:pt-40 pb-20">
      <style>{`
        .jd * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="jd max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4 mb-6"
        >
          {job.isSuspended && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <HiOutlineClock className="text-amber-400 text-xl" />
              </div>
              <div>
                <p className="text-amber-400 font-bold text-sm">
                  Applications Paused
                </p>
                <p className="text-slate-400 text-xs">
                  This job listing has been temporarily suspended by an
                  administrator.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Link
              to="/jobs"
              className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <HiOutlineArrowLeft className="text-base" /> Back to Jobs
            </Link>
            <div className="flex items-center gap-2">
              <WishlistButton type="job" id={id} />
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/edit-job/${id}`)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all"
                  >
                    <HiOutlinePencilSquare className="text-sm" /> Edit
                  </button>
                  <button
                    onClick={handleDeleteJob}
                    className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <HiOutlineTrash className="text-sm" /> Delete
                  </button>
                </div>
              )}
              <button
                onClick={handleShare}
                className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all
                ${
                  copied
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/30"
                    : "bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <HiOutlineCheckCircle className="text-base" /> Copied!
                  </>
                ) : (
                  <>
                    <HiOutlineShare className="text-base" /> Share
                  </>
                )}
              </button>
              {!isOwner && (
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl border border-[#1f2a3d] text-slate-500 hover:text-rose-400 hover:border-rose-900/40 hover:bg-rose-950/20 transition-all"
                >
                  <FiFlag className="text-xs" /> Report
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={card + " p-6"}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 bg-[#0d1424] border border-[#1f2a3d] rounded-xl flex items-center justify-center shrink-0">
                  <HiOutlineBriefcase className="text-violet-400 text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h1 className="text-white font-bold text-xl leading-snug">
                      {job.position}
                    </h1>
                    {isOwner && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold">
                        Your Listing
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-300 text-sm">
                      <HiOutlineMapPin className="text-rose-400 text-base" />
                      {job.location}, {job.district}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <HiOutlineCurrencyRupee className="text-sm" />
                      {job.salary}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-semibold ${genderColor}`}
                    >
                      {job.gender === "Both" ? "Universal" : job.gender}
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-semibold uppercase tracking-wide">
                      {job.jobType || "Full-time"}
                    </span>
                    {job.deadline && (
                      <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-semibold">
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                      <HiOutlineEye size={12} /> {job.views || 0} views
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="group relative bg-[#111827] border border-[#1f2a3d] rounded-2xl p-4 overflow-hidden hover:border-amber-500/40 hover:bg-[#131d2e] transition-all duration-300 cursor-default">
                  <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-all duration-300 rounded-2xl" />
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                    <HiOutlineClock className="text-amber-400 text-base" />
                  </div>
                  <p className="text-[10px] text-slate-600 group-hover:text-amber-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                    Experience
                  </p>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300 relative z-10">
                    {job.experience}
                  </p>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-amber-400 group-hover:w-full transition-all duration-500 rounded-full" />
                </div>
                <div className="group relative bg-[#111827] border border-[#1f2a3d] rounded-2xl p-4 overflow-hidden hover:border-blue-500/40 hover:bg-[#131d2e] transition-all duration-300 cursor-default">
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-300 rounded-2xl" />
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                    <HiOutlineAcademicCap className="text-blue-400 text-base" />
                  </div>
                  <p className="text-[10px] text-slate-600 group-hover:text-blue-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                    Education
                  </p>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300 relative z-10">
                    {job.education}
                  </p>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-400 group-hover:w-full transition-all duration-500 rounded-full" />
                </div>
                <div className="group relative bg-[#111827] border border-[#1f2a3d] rounded-2xl p-4 overflow-hidden hover:border-purple-500/40 hover:bg-[#131d2e] transition-all duration-300 cursor-default">
                  <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 transition-all duration-300 rounded-2xl" />
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                    <HiOutlineUserGroup className="text-purple-400 text-base" />
                  </div>
                  <p className="text-[10px] text-slate-600 group-hover:text-purple-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                    Vacancies
                  </p>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300 relative z-10">
                    {job.vacancies} Open
                  </p>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-400 group-hover:w-full transition-all duration-500 rounded-full" />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className={card + " p-5"}
            >
              <h2 className="flex items-center gap-2 text-slate-200 font-semibold text-sm mb-4">
                <HiOutlineWrenchScrewdriver className="text-violet-400" />{" "}
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.split(",").map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-[#0d1424] border border-[#1f2a3d] rounded-lg text-slate-400 text-xs font-medium hover:border-violet-500/30 hover:text-violet-400 transition-colors cursor-default"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className={card + " p-5"}
            >
              <h3 className="flex items-center gap-2 text-slate-200 font-semibold text-sm mb-4">
                <HiOutlineClipboardDocument className="text-violet-400" /> Job
                Description
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description ||
                  `This position requires a dedicated professional to join our team in ${job.location}. As a ${job.position}, you will operate in a results-driven environment where ${job.experience} experience is essential. We are looking for candidates who have completed ${job.education} and demonstrate strong proficiency across the listed skillset.`}
              </p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4 lg:sticky lg:top-28"
          >
            <div className={`${card} p-5 sticky bottom-4 z-40 lg:static shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none bg-[#111827]/95 backdrop-blur-xl lg:bg-[#111827]`}>
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#1f2a3d]">
                <div>
                  <p className={label + " mb-1"}>Total Applications</p>
                  <p className="text-white font-bold text-2xl leading-none">
                    {job.applications?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                  <HiOutlineRocketLaunch className="text-violet-400 text-xl" />
                </div>
              </div>
              {isOwner ? (
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a2540] hover:bg-[#1f2d4d] border border-[#1f2a3d] text-slate-300 text-xs font-semibold py-3 rounded-xl transition-all mb-3"
                >
                  Manage Applications{" "}
                  <HiOutlineArrowRight className="text-sm" />
                </button>
              ) : hasApplied ? (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold py-3 rounded-xl cursor-not-allowed"
                  >
                    <HiOutlineCheckCircle className="text-sm" /> Applied
                    Successfully
                  </button>
                  {["Applied", "Under Review"].includes(
                    job.applications?.find((a) => a.candidateId === user._id)
                      ?.applicationStatus,
                  ) && (
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing}
                      className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                      {withdrawing ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                      ) : (
                        <HiOutlineTrash className="text-sm" />
                      )}
                      Withdraw Application
                    </button>
                  )}
                </div>
              ) : job.isSuspended ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-slate-800/50 text-slate-500 border border-slate-700/50 text-xs font-semibold py-3 rounded-xl mb-3 cursor-not-allowed"
                >
                  Applications Suspended
                </button>
              ) : (
                <button
                  onClick={handleApplyClick}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30 mb-3"
                >
                  <HiOutlinePaperAirplane className="text-sm" /> Apply Now
                </button>
              )}

              <a
                href={
                  job.isSuspended ? "#" : `https://wa.me/${job.posterContact}`
                }
                target={job.isSuspended ? "_self" : "_blank"}
                rel="noreferrer"
                onClick={(e) => job.isSuspended && e.preventDefault()}
                className={`w-full flex items-center justify-center gap-2 border text-xs font-medium py-3 rounded-xl transition-all ${
                  job.isSuspended
                    ? "bg-slate-800/30 border-slate-700/50 text-slate-600 cursor-not-allowed"
                    : "bg-[#0d1424] border-[#1f2a3d] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-500"
                }`}
              >
                <HiOutlineChatBubbleLeftRight
                  className={`text-sm ${job.isSuspended ? "text-slate-700 font-bold" : ""}`}
                />{" "}
                Contact on WhatsApp
              </a>
            </div>
            <div className={card + " p-5"}>
              <h4 className={label + " mb-4"}>Posted By</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <HiOutlineUser className="text-violet-400 text-base" />
                  </div>
                  <div>
                    <p className={label + " mb-0.5"}>Author</p>
                    <p className="text-slate-200 font-semibold text-sm">
                      {job.posterName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <HiOutlineCalendarDays className="text-violet-400 text-base" />
                  </div>
                  <div>
                    <p className={label + " mb-0.5"}>Posted On</p>
                    <p className="text-slate-200 font-semibold text-sm">
                      {new Date(job.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {similarJobs.length > 0 && (
          <div className="mt-16 border-t border-[#1f2a3d] pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-white font-bold text-xl mb-1">
                  Similar Opportunities
                </h3>
                <p className="text-slate-500 text-sm">
                  You might also be interested in these roles
                </p>
              </div>
              <Link
                to="/jobs"
                className="text-violet-400 hover:text-violet-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                View All <HiOutlineArrowRight />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarJobs.map((simJob) => (
                <Link
                  key={simJob._id}
                  to={`/jobs/${simJob._id}`}
                  className={card + " p-5 hover:border-violet-500/50 transition-all group"}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#0d1424] border border-[#1f2a3d] rounded-xl flex items-center justify-center shrink-0 group-hover:border-violet-500/30 transition-all">
                      <HiOutlineBriefcase className="text-violet-400 text-xl" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-bold text-sm truncate leading-tight mb-0.5 group-hover:text-violet-400 transition-colors">
                        {simJob.position}
                      </h4>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        {simJob.category || "General"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                    <HiOutlineMapPin className="text-rose-400 shrink-0" size={12} />
                    <span className="truncate">{simJob.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1f2a3d]/50">
                    <span className="text-emerald-400 font-bold text-xs">
                      {simJob.salary}
                    </span>
                    <span className="text-slate-600 text-[10px] font-medium">
                      {simJob.views} views
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>


      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="job"
        targetId={job._id}
      />
    </div>
  );
};

export default JobDetails;
