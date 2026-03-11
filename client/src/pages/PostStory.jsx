import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "../context/LocationContext";
import { useUser } from "../context/UserContext";
import { storyService } from "../services";
import { toast } from "react-hot-toast";
import MapPicker from "../components/MapPicker";
const CustomDropdown = ({
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
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

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none
          ${
            disabled
              ? "opacity-30 cursor-not-allowed bg-white/2 border-white/8"
              : open
                ? "bg-white/[0.07] border-primary/60 ring-2 ring-primary/10"
                : "bg-white/4 border-white/10 hover:bg-white/6 hover:border-white/20 cursor-pointer"
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
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-[#131929] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="py-1.5 max-h-52 overflow-y-auto">
              {options.length === 0 ? (
                <p className="px-4 py-3 text-sm text-white/25 text-center">
                  No options available
                </p>
              ) : (
                options.map((opt) => {
                  const isActive = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 flex items-center justify-between
                        ${
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "text-white/65 hover:bg-white/6 hover:text-white"
                        }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200";

const Field = ({ label, required, span2, children }) => (
  <div className={span2 ? "sm:col-span-2" : ""}>
    <label className="block text-[11px] font-medium text-white/35 mb-2 tracking-wider uppercase">
      {label}
      {required && <span className="text-primary/60 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Divider = ({ label }) => (
  <div className="sm:col-span-2 flex items-center gap-3 pt-2">
    <div className="flex-1 h-px bg-white/6" />
    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest shrink-0">
      {label}
    </span>
    <div className="flex-1 h-px bg-white/6" />
  </div>
);
const PostStory = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { state, availableDistricts } = useLocation();

  const [storyLocation, setStoryLocation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "News",
    image: "",
    latitude: null,
    longitude: null,
    locationAddress: "",
  });

  useEffect(() => {
    if (storyLocation) {
      setFormData((prev) => ({
        ...prev,
        latitude: storyLocation.lat,
        longitude: storyLocation.lng,
        locationAddress: storyLocation.address,
        pincode: storyLocation.pincode,
      }));
    }
  }, [storyLocation]);

  const storyTypes = [
    "News",
    "Offers",
    "Promotions",
    "Events",
    "Announcements",
    "Tips",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storyLocation) {
      toast.error("Please select a location on the map for your broadcast.");
      return;
    }
    try {
      setLoading(true);
      const storyData = {
        ...formData,
        author: user?.name || "Anonymous",
      };
      const response = await storyService.createStory(storyData);
      if (response.data.success) {
        toast.success(response.data.message || "Broadcasted successfully!");
        navigate("/stories");
      }
    } catch (error) {
      const errorData = error.response?.data;
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
        console.error("Error posting story:", error);
        toast.error(errorData?.message || "Broadcast failed");
      }
    } finally {
      setLoading(false);
    }
  };
  const storyTypeOptions = storyTypes.map((t) => ({ value: t, label: t }));

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
              Community Broadcast
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Share Local Update
          </h1>
          <p className="text-sm text-white/30">
            Broadcast information to your neighborhood.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white/2.5 border border-white/8 rounded-2xl p-7 sm:p-10 backdrop-blur-sm shadow-2xl shadow-black/30"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Divider label="Story Info" />

              <Field label="Update Category" required>
                <CustomDropdown
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={storyTypeOptions}
                />
              </Field>

              <Field label="Title / Subject" required>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. New Local Shop Opening"
                  className={inputCls}
                  required
                  value={formData.title}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Content Description" required span2>
                <textarea
                  name="content"
                  placeholder="Write your community update here..."
                  className={`${inputCls} min-h-36 resize-none leading-relaxed`}
                  required
                  value={formData.content}
                  onChange={handleChange}
                />
              </Field>

              <Divider label="Set Story Location (Map)" />
              <div className="sm:col-span-2">
                <MapPicker value={storyLocation} onChange={setStoryLocation} />
              </div>

              <Divider label="Visual Asset" />

              <div className="sm:col-span-2 space-y-3">
                {!formData.image ? (
                  <label className="flex flex-col items-center justify-center gap-3 w-full py-8 rounded-xl border border-dashed border-white/10 cursor-pointer hover:bg-white/3 hover:border-primary/30 transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <svg
                      className="w-8 h-8 text-white/15 group-hover:text-primary/40 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm text-white/30 group-hover:text-white/50 transition-colors">
                        Click to upload an image
                      </p>
                      <p className="text-[11px] text-white/15 mt-1">
                        Optional · PNG, JPG up to 10MB
                      </p>
                    </div>
                  </label>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="relative rounded-xl overflow-hidden border border-white/10 group"
                    >
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={removeImage}
                          className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Remove Image
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <div className="sm:col-span-2 pt-3">
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
                      Broadcasting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Broadcast Update
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
                  Fields marked <span className="text-primary/50">*</span> are
                  required
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PostStory;
