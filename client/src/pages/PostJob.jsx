import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "../context/LocationContext";
import { jobService } from "../services";
import { toast } from "react-hot-toast";
const CustomDropdown = ({
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (optValue) => {
    onChange({ target: { name, value: optValue } });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none
          ${
            open
              ? "bg-white/[0.07] border-primary/60 ring-2 ring-primary/10"
              : "bg-white/4 border-white/10 hover:bg-white/6 hover:border-white/20"
          }`}
      >
        <span className={selected ? "text-white" : "text-white/25"}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30 ml-2 shrink-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-full bg-[#131929] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="py-1.5 max-h-56 overflow-y-auto scrollbar-thin">
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 flex items-center justify-between group
                      ${
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-white/70 hover:bg-white/6 hover:text-white"
                      }`}
                  >
                    <span>{opt.label}</span>
                    {isActive && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200";
const Section = ({ icon, title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="space-y-5"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-base shrink-0">
        {icon}
      </div>
      <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        {title}
      </span>
      <div className="flex-1 h-px bg-white/6" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </motion.div>
);
const Field = ({ label, required, span2, children }) => (
  <div className={span2 ? "sm:col-span-2" : ""}>
    <label className="block text-[11px] font-medium text-white/35 mb-2 tracking-wider uppercase">
      {label}
      {required && <span className="text-primary/60 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const PostJob = () => {
  const navigate = useNavigate();
  const { availableDistricts } = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    position: "",
    location: "",
    vacancies: "",
    education: "10th pass",
    district: "",
    experience: "",
    skills: "",
    salary: "",
    gender: "Both",
    posterName: "",
    posterEmail: "",
    posterContact: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await jobService.createJob(formData);
      if (res.data.success) {
        toast.success("Job posted successfully!");
        navigate("/jobs");
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.code === "LIMIT_REACHED") {
        toast(
          (t) => (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-200">
                {errorData.message}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate("/upgrade-plan");
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  Upgrade Plan
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          ),
          {
            duration: 6000,
            position: "top-center",
            style: {
              background: "#111827",
              border: "1px solid #1f2a3d",
              padding: "16px",
              color: "#fff",
              borderRadius: "16px",
              maxWidth: "350px",
            },
            icon: "🚀",
          },
        );
      } else {
        console.error("Error posting job:", err);
        toast.error(errorData?.message || "Failed to post job.");
      }
    } finally {
      setLoading(false);
    }
  };

  const districtOptions = [
    { value: "", label: "Select District" },
    ...(availableDistricts || []).map((d) => ({ value: d, label: d })),
  ];

  const educationOptions = [
    { value: "10th pass", label: "10th Pass" },
    { value: "12th pass", label: "12th Pass" },
    { value: "Graduate", label: "Graduate" },
    { value: "Post Graduate", label: "Post Graduate" },
  ];

  const genderOptions = [
    { value: "Both", label: "Both / Any" },
    { value: "Male", label: "Male Only" },
    { value: "Female", label: "Female Only" },
  ];

  return (
    <div className="min-h-screen bg-dark-bg pt-28 pb-24 px-4 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-125 h-125 bg-primary/6 blur-[130px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-100 h-100 bg-secondary/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-[0.18em]">
              Employer Portal
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Post a Job Listing
          </h1>
          <p className="text-sm text-white/30 leading-relaxed">
            Fill in the details below to reach local talent and publish your
            opportunity.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white/2.5 border border-white/8 rounded-2xl p-7 sm:p-10 backdrop-blur-sm shadow-2xl shadow-black/30 space-y-10"
          >
            <Section icon="📋" title="Role Specifications" delay={0.15}>
              <Field label="Job Position" required>
                <input
                  type="text"
                  name="position"
                  placeholder="e.g. Sales Executive"
                  className={inputCls}
                  required
                  value={formData.position}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Location / Area" required>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. MG Road, Pune"
                  className={inputCls}
                  required
                  value={formData.location}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Vacancies" required>
                <input
                  type="number"
                  name="vacancies"
                  placeholder="e.g. 3"
                  className={inputCls}
                  required
                  value={formData.vacancies}
                  onChange={handleChange}
                />
              </Field>

              <Field label="District" required>
                <CustomDropdown
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  options={districtOptions.filter((o) => o.value !== "")}
                  placeholder="Select District"
                />
              </Field>
            </Section>

            <div className="h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

            <Section icon="🎯" title="Requirements & Value" delay={0.2}>
              <Field label="Education" required>
                <CustomDropdown
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  options={educationOptions}
                  placeholder="Select Education"
                />
              </Field>

              <Field label="Experience" required>
                <input
                  type="text"
                  name="experience"
                  placeholder="e.g. 0–2 Years"
                  className={inputCls}
                  required
                  value={formData.experience}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Monthly Salary (₹)" required>
                <input
                  type="text"
                  name="salary"
                  placeholder="e.g. 15,000 – 20,000"
                  className={inputCls}
                  required
                  value={formData.salary}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Gender Preference">
                <CustomDropdown
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  options={genderOptions}
                  placeholder="Select Preference"
                />
              </Field>

              <Field label="Required Skills" required span2>
                <input
                  type="text"
                  name="skills"
                  placeholder="e.g. Communication, Basic Tally, MS Excel"
                  className={inputCls}
                  required
                  value={formData.skills}
                  onChange={handleChange}
                />
              </Field>
            </Section>

            <div className="h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

            <Section icon="📞" title="Contact Information" delay={0.25}>
              <Field label="Hiring Officer" required>
                <input
                  type="text"
                  name="posterName"
                  placeholder="Full Name"
                  className={inputCls}
                  required
                  value={formData.posterName}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Official Email" required>
                <input
                  type="email"
                  name="posterEmail"
                  placeholder="email@company.com"
                  className={inputCls}
                  required
                  value={formData.posterEmail}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Primary Contact" required span2>
                <input
                  type="tel"
                  name="posterContact"
                  placeholder="Mobile Number"
                  className={inputCls}
                  required
                  value={formData.posterContact}
                  onChange={handleChange}
                />
              </Field>
            </Section>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-primary text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 group"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/10 to-transparent" />

                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Publishing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Publish Job Listing
                    <svg
                      className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                )}
              </button>

              <p className="text-center text-[11px] text-white/20 mt-4">
                All fields marked <span className="text-primary/50">*</span> are
                required
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PostJob;
