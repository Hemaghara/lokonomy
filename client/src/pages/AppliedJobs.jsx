import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { jobService } from "../services";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineChevronRight,
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import { Helmet } from "react-helmet-async";

const AppliedJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await jobService.getAppliedJobs();
        setApplications(response.data);
      } catch (err) {
        console.error("Error fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Selected":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Rejected":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Interview":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Under Review":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1a] pt-28 pb-20 px-4">
      <Helmet>
        <title>My Applications | Lokonomy Careers</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-white font-bold text-3xl mb-2">
            My Applications
          </h1>
          <p className="text-slate-400 text-sm">
            Track the status of job applications you've submitted.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-[#111827] border border-[#1f2a3d] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : applications.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {applications.map((app, idx) => (
                <motion.div
                  key={app.jobId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#111827] border border-[#1f2a3d] rounded-2xl p-5 hover:border-violet-500/30 transition-all group cursor-pointer"
                  onClick={() => navigate(`/jobs/${app.jobId}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center shrink-0 group-hover:border-violet-500/30 transition-colors">
                        <HiOutlineBriefcase className="text-violet-400 text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-slate-100 font-semibold text-lg group-hover:text-violet-400 transition-colors">
                          {app.position}
                        </h3>
                        <p className="text-slate-500 text-sm mb-2">
                          {app.posterName}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <HiOutlineMapPin className="text-rose-400" />
                            {app.district}, {app.location}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <HiOutlineCurrencyRupee className="text-emerald-400" />
                            {app.salary}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] uppercase font-bold tracking-wider">
                              {app.jobType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
                      <div
                        className={`px-4 py-1.5 rounded-full border text-xs font-bold ${getStatusColor(app.status)}`}
                      >
                        {app.status}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <HiOutlineCalendarDays />
                        Applied on{" "}
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#1f2a3d] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 italic">
                      {app.jobStatus === "Closed" && (
                        <span className="flex items-center gap-1 text-rose-400">
                          <HiOutlineInformationCircle /> This job is no longer
                          accepting new applications
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:gap-2 transition-all">
                      View details <HiOutlineChevronRight />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center">
            <div className="text-6xl mb-4 opacity-10">💼</div>
            <h3 className="text-slate-400 font-semibold mb-2">
              No applications yet
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              You haven't applied to any job opportunities. Start exploring and
              build your career!
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-900/20"
            >
              Exlpore Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppliedJobs;
