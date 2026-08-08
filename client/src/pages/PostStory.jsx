import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { storyService } from "../services";
import { toast } from "react-hot-toast";
import MapPicker from "../components/MapPicker";
import { usePlanLimits } from "../hooks/usePlanLimits";
import { storySchema } from "../validators/social.schema";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
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

const Field = ({ label, id, required, span2, children }) => (
  <div className={span2 ? "sm:col-span-2" : ""}>
    <label
      htmlFor={id}
      className="block text-[11px] font-medium text-white/35 mb-2 tracking-wider uppercase"
    >
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
  const { storyId } = useParams();
  const isEditMode = !!storyId;
  const { user } = useUser();
  const { limits } = usePlanLimits();

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
    district: "",
    taluka: "",
    isHighlighted: false,
    highlightCategory: "Other",
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollEndDate, setPollEndDate] = useState("");

  const [showCTA, setShowCTA] = useState(false);
  const [actionLinkUrl, setActionLinkUrl] = useState("");
  const [actionLinkText, setActionLinkText] = useState("Visit Link");

  useEffect(() => {
    return () => {
      mediaFiles.forEach(item => {
        if (item.preview && !item.isExisting) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [mediaFiles]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (mediaFiles.length + files.length > 5) {
      toast.error("Maximum 5 media items allowed");
      return;
    }

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 10MB limit`);
        return;
      }
      if (file.type.startsWith("video")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 16) {
            toast.error(`"${file.name}" is too long (max 15s)`);
          } else {
            const newMedia = {
              file,
              preview: URL.createObjectURL(file),
              type: "video",
            };
            setMediaFiles((prev) => [...prev, newMedia]);
          }
        };
        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          toast.error(`"${file.name}" is not a valid or readable video format`);
        };
        video.src = URL.createObjectURL(file);
      } else {
        const newMedia = {
          file,
          preview: URL.createObjectURL(file),
          type: "image",
        };
        setMediaFiles((prev) => [...prev, newMedia]);
      }
    });
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  useEffect(() => {
    if (isEditMode) {
      storyService
        .getStoryById(storyId)
        .then((res) => {
          const s = res.data.data;
          setFormData({
            title: s.title || "",
            content: s.content || "",
            type: s.type || "News",
            image: s.image || "",
            latitude: s.location?.coordinates?.[1] || null,
            longitude: s.location?.coordinates?.[0] || null,
            locationAddress: s.locationAddress || "",
            district: s.district || "",
            taluka: s.taluka || "",
            isHighlighted: s.isHighlighted || false,
            highlightCategory: s.highlightCategory || "Other",
          });
          if (s.media && s.media.length > 0) {
            setMediaFiles(s.media.map(m => ({
              preview: m.url,
              type: m.type || 'image',
              isExisting: true
            })));
          }
          if (s.location?.coordinates) {
            setStoryLocation({
              lat: s.location.coordinates[1],
              lng: s.location.coordinates[0],
              address: s.locationAddress || "",
              district: s.district || "",
              taluka: s.taluka || "",
            });
          }
          if (s.poll?.question) {
            setShowPoll(true);
            setPollQuestion(s.poll.question);
            setPollOptions(s.poll.options.map((o) => o.text));
            if (s.poll.endsAt)
              setPollEndDate(
                new Date(s.poll.endsAt).toISOString().slice(0, 16),
              );
          }
          if (s.actionLink?.url) {
            setShowCTA(true);
            setActionLinkUrl(s.actionLink.url);
            setActionLinkText(s.actionLink.text || "Visit Link");
          }
        })
        .catch(() => {
          toast.error("Failed to load story for editing");
          navigate("/stories");
        });
    }
  }, [storyId, isEditMode, navigate]);

  useEffect(() => {
    if (storyLocation) {
      setFormData((prev) => ({
        ...prev,
        latitude: storyLocation.lat,
        longitude: storyLocation.lng,
        locationAddress: storyLocation.address,
        pincode: storyLocation.pincode,
        district: storyLocation.district,
        taluka: storyLocation.taluka,
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
    const { name, value, type, checked } = e.target;
    if (name === "isHighlighted" && checked) {
      if (
        user?.subscription?.plan !== "gold" &&
        user?.subscription?.plan !== "platinum"
      ) {
        toast.error(
          "Story Highlights are only available for Gold and Platinum members!",
        );
        return;
      }
    }
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };



  const addPollOption = () => {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, ""]);
  };

  const removePollOption = (idx) => {
    if (pollOptions.length > 2)
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storyLocation) {
      toast.error("Please select a location on the map for your broadcast.");
      return;
    }
    try {
      setLoading(true);
      
      const processedMedia = [];
      for (const item of mediaFiles) {
        if (item.file) {
          const base64 = await fileToBase64(item.file);
          processedMedia.push({ url: base64, type: item.type });
        } else if (item.preview) {
          processedMedia.push({ url: item.preview, type: item.type });
        }
      }

      const storyData = {
        ...formData,
        author: user?.name || "Anonymous",
        media: processedMedia,
        image: processedMedia[0]?.url || formData.image,
      };

      if (showPoll && pollQuestion.trim()) {
        const validOptions = pollOptions.filter((o) => o.trim());
        if (validOptions.length >= 2) {
          storyData.poll = {
            question: pollQuestion.trim(),
            options: validOptions.map((o) => ({ text: o.trim() })),
            endsAt: pollEndDate || undefined,
          };
        } else {
          setLoading(false);
          toast.error("A poll requires at least 2 options.");
          return;
        }
      }

      if (showCTA && actionLinkUrl.trim()) {
        storyData.actionLink = {
          url: actionLinkUrl.trim(),
          text: actionLinkText
        };
      }
      
      storySchema.parse(formData);

      let response;
      if (isEditMode) {
        response = await storyService.updateStory(storyId, storyData);
      } else {
        response = await storyService.createStory(storyData);
      }

      if (response.data.success) {
        toast.success(
          response.data.message ||
            (isEditMode ? "Story updated!" : "Broadcasted successfully!"),
        );
        navigate(isEditMode ? `/stories/${storyId}` : "/stories");
      }
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        return toast.error(error.errors[0].message);
      }
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
  const highlightCategoryOptions = [
    { value: "Offers", label: "Offers" },
    { value: "Gallery", label: "Gallery" },
    { value: "Events", label: "Events" },
    { value: "Announcements", label: "Announcements" },
    { value: "Other", label: "Other" },
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
              {isEditMode ? "Edit Broadcast" : "Community Broadcast"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {isEditMode ? "Edit Story" : "Share Local Update"}
          </h1>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-white/30">
              Broadcast information to your neighborhood.
            </p>
            {limits && (
              <div className="shrink-0 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                  Remaining:{" "}
                  {Math.max(
                    0,
                    (limits.storiesPosted || 0) -
                      (user?.usage?.storiesPosted || 0),
                  )}{" "}
                  / {limits.storiesPosted}
                </span>
              </div>
            )}
          </div>
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

              <Field label="Update Category" id="story-type" required>
                <CustomDropdown
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={storyTypeOptions}
                />
              </Field>

              <Field label="Title / Subject" id="story-title" required>
                <input
                  id="story-title"
                  type="text"
                  name="title"
                  placeholder="e.g. New Local Shop Opening"
                  className={inputCls}
                  required
                  value={formData.title}
                  onChange={handleChange}
                />
              </Field>

              <Field
                label="Content Description"
                id="story-content"
                required
                span2
              >
                <textarea
                  id="story-content"
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
                <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-2.5 block">
                  Media Gallery (Max 5)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {mediaFiles.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group"
                    >
                      <img
                        src={m.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600/90 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <HiOutlineTrash size={12} />
                      </button>
                      {m.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                          <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded">Video</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {mediaFiles.length < 5 && (
                    <label className="relative aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 bg-white/2 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaChange}
                      />
                      <HiOutlinePlus size={24} className="text-white/20 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] text-white/20 mt-1 font-bold group-hover:text-primary/70">Add Media</span>
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-white/15">
                  Optional · Up to 5 items · Max 10MB each · Videos max 15s
                </p>
              </div>

              {!isEditMode && (
                <>
                  <Divider label="Community Poll (Optional)" />
                  <div className="sm:col-span-2">
                    <label className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/2 cursor-pointer transition-all hover:bg-white/4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📊</span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Add a Poll
                          </p>
                          <p className="text-[10px] text-white/40">
                            Let the community vote on something
                          </p>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={showPoll}
                          onChange={() => setShowPoll(!showPoll)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                    </label>

                    {showPoll && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 space-y-3 p-4 border border-white/10 rounded-xl bg-white/2"
                      >
                        <input
                          type="text"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          placeholder="Ask a question..."
                          className={inputCls}
                          maxLength={200}
                        />
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...pollOptions];
                                newOpts[idx] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              placeholder={`Option ${idx + 1}`}
                              className={inputCls + " flex-1"}
                              maxLength={100}
                            />
                            {pollOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removePollOption(idx)}
                                className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0"
                              >
                                <HiOutlineTrash className="text-sm" />
                              </button>
                            )}
                          </div>
                        ))}
                        <div className="flex items-center gap-3">
                          {pollOptions.length < 4 && (
                            <button
                              type="button"
                              onClick={addPollOption}
                              className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary font-semibold transition-colors"
                            >
                              <HiOutlinePlus className="text-sm" /> Add Option
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-white/30 mb-1.5 tracking-wider uppercase">
                            Poll End Date (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={pollEndDate}
                            onChange={(e) => setPollEndDate(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              <Divider label="Call To Action (CTA)" />
              <div className="sm:col-span-2">
                <label className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/2 cursor-pointer transition-all hover:bg-white/4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔗</span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Add Action Link
                      </p>
                      <p className="text-[10px] text-white/40">
                        Let users visit a website or product
                      </p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={showCTA}
                      onChange={() => setShowCTA(!showCTA)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>

                {showCTA && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 space-y-3 p-4 border border-white/10 rounded-xl bg-white/2"
                  >
                    <Field label="Button Text" id="actionLinkText">
                      <CustomDropdown
                        name="actionLinkText"
                        value={actionLinkText}
                        onChange={(e) => setActionLinkText(e.target.value)}
                        options={[
                          { label: "Visit Link", value: "Visit Link" },
                          { label: "Shop Now", value: "Shop Now" },
                          { label: "Learn More", value: "Learn More" },
                          { label: "Get Offer", value: "Get Offer" },
                          { label: "Book Now", value: "Book Now" },
                          { label: "Contact Us", value: "Contact Us" },
                          { label: "Download", value: "Download" },
                        ]}
                      />
                    </Field>
                    <Field label="Destination URL" id="actionLinkUrl">
                      <input
                        type="url"
                        value={actionLinkUrl}
                        onChange={(e) => setActionLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        className={inputCls}
                      />
                    </Field>
                  </motion.div>
                )}
              </div>

              <Divider label="Highlight (Premium Only)" />

              <div className="sm:col-span-2">
                <label className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer w-full ...">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.isHighlighted
                          ? "bg-primary/20 text-primary"
                          : "bg-white/5 text-white/30"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Pin to Highlights
                      </p>
                      <p className="text-[10px] text-white/40">
                        Permanently display on your profile
                      </p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      name="isHighlighted"
                      checked={formData.isHighlighted}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>
              </div>

              {formData.isHighlighted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="sm:col-span-2"
                >
                  <Field label="Highlight Category">
                    <CustomDropdown
                      name="highlightCategory"
                      value={formData.highlightCategory}
                      onChange={handleChange}
                      options={highlightCategoryOptions}
                    />
                  </Field>
                </motion.div>
              )}

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
                      {isEditMode
                        ? "Update Story"
                        : formData.isHighlighted
                          ? "Create Highlight"
                          : "Broadcast Update"}
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
