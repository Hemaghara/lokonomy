import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jobService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineWrenchScrewdriver,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineBriefcase,
  HiOutlineDocumentArrowUp,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const ApplyJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    candidateName: user?.name || "",
    candidateEmail: user?.email || "",
    candidateContact: "",
    candidateSkills: "",
    candidateExperience: "",
    candidateEducation: "Graduate",
    candidateBiodata: "",
    candidateCertificate: "",
  });

  const [biodataFileName, setBiodataFileName] = useState("");
  const [certificateFileName, setCertificateFileName] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        candidateName: user.name || prev.candidateName,
        candidateEmail: user.email || prev.candidateEmail,
      }));
    }
  }, [user]);

  const fetchJob = async () => {
    try {
      const response = await jobService.getJobById(id);
      setJob(response.data);
      if (
        user &&
        response.data.applications?.some((a) => a.candidateId === user._id)
      ) {
        toast.error("You have already applied for this job");
        navigate(`/jobs/${id}`);
      }
    } catch (err) {
      console.error("Error fetching job:", err);
      toast.error("Job not found");
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "biodata") {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file for biodata");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Biodata PDF must be under 5MB");
        return;
      }
    } else {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowed.includes(file.type)) {
        toast.error("Certificate must be PDF, JPG, or PNG");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Certificate file must be under 5MB");
        return;
      }
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "biodata") {
        setFormData((prev) => ({ ...prev, candidateBiodata: reader.result }));
        setBiodataFileName(file.name);
      } else {
        setFormData((prev) => ({
          ...prev,
          candidateCertificate: reader.result,
        }));
        setCertificateFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type) => {
    if (type === "biodata") {
      setFormData((prev) => ({ ...prev, candidateBiodata: "" }));
      setBiodataFileName("");
    } else {
      setFormData((prev) => ({ ...prev, candidateCertificate: "" }));
      setCertificateFileName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to apply");
      navigate("/");
      return;
    }
    setSubmitting(true);
    try {
      const response = await jobService.applyForJob(id, formData);
      if (response.data.success) {
        toast.success("Application submitted successfully!");
        navigate(`/jobs/${id}`);
      }
    } catch (err) {
      console.error("Apply error:", err);
      toast.error(
        err.response?.data?.message || "Failed to submit application",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600";
  const labelCls =
    "text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";
  const sectionTitle =
    "flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-5 pb-4 border-b border-[#1f2a3d]";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
          Loading…
        </p>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .aj * { font-family: 'DM Sans', sans-serif; }
        .aj select option { background: #111827; color: #e2e8f0; }
      `}</style>

      <div className="aj max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-6"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back to Job Details
          </button>
          <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
            Job Application
          </p>
          <h1 className="text-white font-bold text-2xl md:text-3xl leading-snug">
            Apply for {job.position}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete the form below and submit your application.
          </p>
        </div>
        <div className={card + " p-5 mb-5"}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
              <HiOutlineBriefcase className="text-violet-400 text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base truncate">
                {job.position}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <HiOutlineMapPin className="text-rose-400" />
                  {job.location}, {job.district}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <HiOutlineCurrencyRupee />
                  {job.salary}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineAcademicCap className="text-blue-400" />
                  {job.education}
                </span>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className={card + " p-6"}>
            <h2 className={sectionTitle}>
              <HiOutlineUser className="text-violet-400 text-base" /> Personal
              Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  <HiOutlineUser className="text-violet-400" /> Full Name *
                </label>
                <input
                  type="text"
                  name="candidateName"
                  placeholder="Your full name"
                  className={inputCls}
                  required
                  value={formData.candidateName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineEnvelope className="text-violet-400" /> Email
                  Address *
                </label>
                <input
                  type="email"
                  name="candidateEmail"
                  placeholder="your@email.com"
                  className={inputCls}
                  required
                  value={formData.candidateEmail}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  <HiOutlinePhone className="text-violet-400" /> Phone Number *
                </label>
                <input
                  type="tel"
                  name="candidateContact"
                  placeholder="+91 XXXXX XXXXX"
                  className={inputCls}
                  required
                  value={formData.candidateContact}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className={card + " p-6"}>
            <h2 className={sectionTitle}>
              <HiOutlineBriefcase className="text-violet-400 text-base" />{" "}
              Professional Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  <HiOutlineWrenchScrewdriver className="text-violet-400" />{" "}
                  Skills *
                </label>
                <input
                  type="text"
                  name="candidateSkills"
                  placeholder="e.g. Communication, Computer, Marketing"
                  className={inputCls}
                  required
                  value={formData.candidateSkills}
                  onChange={handleChange}
                />
                <p className="text-slate-600 text-[10px] mt-1.5">
                  Separate multiple skills with commas
                </p>
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineClock className="text-violet-400" /> Experience *
                </label>
                <select
                  name="candidateExperience"
                  className={inputCls}
                  required
                  value={formData.candidateExperience}
                  onChange={handleChange}
                >
                  <option value="">Select Experience</option>
                  <option value="Fresher">Fresher (0 years)</option>
                  <option value="1 Year">1 Year</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3 Years">3 Years</option>
                  <option value="4-5 Years">4-5 Years</option>
                  <option value="5+ Years">5+ Years</option>
                  <option value="10+ Years">10+ Years</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineAcademicCap className="text-violet-400" /> Education
                  *
                </label>
                <select
                  name="candidateEducation"
                  className={inputCls}
                  required
                  value={formData.candidateEducation}
                  onChange={handleChange}
                >
                  <option value="Non-Graduate">Non-Graduate</option>
                  <option value="10th Pass">10th Pass</option>
                  <option value="12th Pass">12th Pass</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>
            </div>
          </div>
          <div className={card + " p-6"}>
            <h2 className={sectionTitle}>
              <HiOutlineDocumentText className="text-violet-400 text-base" />{" "}
              Documents
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>
                  <HiOutlineDocumentArrowUp className="text-violet-400" />{" "}
                  Biodata / Resume (PDF)
                </label>
                {formData.candidateBiodata ? (
                  <div className="flex items-center gap-3 bg-[#0d1424] border border-emerald-500/30 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlineCheckCircle className="text-emerald-400 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-semibold truncate">
                        {biodataFileName}
                      </p>
                      <p className="text-emerald-400 text-[10px] font-medium">
                        PDF uploaded successfully
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("biodata")}
                      className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0"
                    >
                      <HiOutlineXMark className="text-sm" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#1f2a3d] hover:border-violet-500/40 bg-[#0d1424] hover:bg-violet-500/5 rounded-xl py-8 cursor-pointer transition-all group">
                    <HiOutlineDocumentArrowUp className="text-2xl text-slate-700 group-hover:text-violet-400 transition-colors" />
                    <span className="text-xs text-slate-600 group-hover:text-violet-400 font-medium transition-colors">
                      Click to upload your biodata (PDF)
                    </span>
                    <span className="text-[10px] text-slate-700">Max 5MB</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "biodata")}
                    />
                  </label>
                )}
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineAcademicCap className="text-violet-400" />{" "}
                  Certificate (PDF / Image)
                </label>
                {formData.candidateCertificate ? (
                  <div className="flex items-center gap-3 bg-[#0d1424] border border-emerald-500/30 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlineCheckCircle className="text-emerald-400 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-semibold truncate">
                        {certificateFileName}
                      </p>
                      <p className="text-emerald-400 text-[10px] font-medium">
                        Certificate uploaded successfully
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("certificate")}
                      className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0"
                    >
                      <HiOutlineXMark className="text-sm" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#1f2a3d] hover:border-violet-500/40 bg-[#0d1424] hover:bg-violet-500/5 rounded-xl py-8 cursor-pointer transition-all group">
                    <HiOutlineAcademicCap className="text-2xl text-slate-700 group-hover:text-violet-400 transition-colors" />
                    <span className="text-xs text-slate-600 group-hover:text-violet-400 font-medium transition-colors">
                      Click to upload certificate (PDF, JPG, PNG)
                    </span>
                    <span className="text-[10px] text-slate-700">Max 5MB</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/jpg"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "certificate")}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 active:scale-[.98] text-white font-semibold text-sm py-4 rounded-xl transition-all shadow-lg shadow-violet-900/30"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Submitting Application…
              </>
            ) : (
              <>
                <HiOutlinePaperAirplane className="text-base" /> Submit
                Application
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyJob;
