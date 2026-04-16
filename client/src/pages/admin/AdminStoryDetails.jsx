import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiBookOpen,
  FiUser,
  FiAlertTriangle,
  FiArrowLeft,
  FiMapPin,
  FiMail,
  FiPhone,
  FiInfo,
  FiClock,
  FiTag,
  FiImage,
  FiTrash2,
  FiStar,
  FiCalendar,
  FiX,
} from "react-icons/fi";

const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const typeColorMap = {
  News: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Offers: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Promotions: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/25",
  Events: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Announcements: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  Tips: "bg-teal-500/15 text-teal-400 border-teal-500/25",
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

const SectionHead = ({ icon: Icon, label, accent = "violet" }) => (
  <div className="flex items-center gap-2 mb-5">
    <Icon size={14} className={`text-${accent}-400 shrink-0`} />
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
      {label}
    </span>
  </div>
);

const StatTile = ({ icon: Icon, label, value, accent = "violet" }) => (
  <div
    className={`flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-${accent}-500/30 transition-colors`}
  >
    <div
      className={`w-9 h-9 rounded-lg bg-${accent}-500/10 flex items-center justify-center shrink-0`}
    >
      <Icon size={16} className={`text-${accent}-400`} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
        {label}
      </p>
      <p className="text-xs font-black text-white truncate">{value}</p>
    </div>
  </div>
);

const LoadingScreen = () => (
  <AdminLayout>
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-violet-500/15 border-t-violet-500 animate-spin" />
        <FiBookOpen
          className="absolute inset-0 m-auto text-violet-400 animate-pulse"
          size={18}
        />
      </div>
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
        Loading story…
      </p>
    </div>
  </AdminLayout>
);

const NotFoundScreen = ({ onBack }) => (
  <AdminLayout>
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div {...FADE_UP} className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <FiAlertTriangle size={36} className="text-rose-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Not Found</h2>
        <p className="text-sm text-slate-500 mb-8">
          This story could not be located in the database.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black text-sm rounded-xl transition-colors"
        >
          Return to Stories & Feed
        </button>
      </motion.div>
    </div>
  </AdminLayout>
);

const DeleteModal = ({ story, onConfirm, onCancel, loading }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center">
          <FiAlertTriangle size={20} className="text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Delete Story?</h3>
      </div>
      <p className="text-slate-400 text-sm mb-2">
        You are about to permanently delete this story:
      </p>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 mb-6">
        <p className="text-white text-sm font-semibold truncate">
          {story?.title}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          by {story?.author} · #{story?._id?.slice(-6)}
        </p>
      </div>
      <p className="text-rose-400/80 text-xs mb-6">
        ⚠ This action is irreversible. The content will be permanently removed.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const AdminStoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await adminService.getStoryDetails(id);
      setStory(res.data);
    } catch {
      toast.error("Failed to fetch story details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminService.deleteStory(id);
      toast.success("Story deleted successfully");
      navigate("/admin/stories-feed");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!story)
    return <NotFoundScreen onBack={() => navigate("/admin/stories-feed")} />;

  const author = story.authorId || {};

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 pb-20 space-y-5">
        <motion.div
          {...FADE_UP}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-white hover:border-violet-500/50 transition-all"
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight truncate max-w-55 sm:max-w-xs md:max-w-none">
                  {story.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${typeColorMap[story.type] || "bg-slate-500/10 text-slate-400 ring-slate-500/25"}`}
                >
                  {story.type}
                </span>
                {story.isHighlighted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 bg-amber-500/10 text-amber-400 ring-amber-500/25">
                    <FiStar size={9} /> Highlighted
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                <FiMapPin size={10} className="text-violet-400" />
                {story.locationAddress || story.district || "No location"}{" "}
                {story.taluka ? `· ${story.taluka}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-sm bg-rose-600 hover:bg-rose-500 text-white shrink-0"
          >
            <FiTrash2 size={13} /> Delete Story
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        >
          <StatTile
            icon={FiTag}
            label="Type"
            value={story.type}
            accent="violet"
          />
          <StatTile
            icon={FiCalendar}
            label="Created"
            value={new Date(story.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            accent="emerald"
          />
          <StatTile
            icon={FiClock}
            label="Expires"
            value={
              story.expiresAt
                ? new Date(story.expiresAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Never"
            }
            accent="amber"
          />
          <StatTile
            icon={FiMapPin}
            label="District"
            value={story.district || "—"}
            accent="cyan"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {story.image && (
              <motion.div {...FADE_UP} transition={{ delay: 0.12 }}>
                <Card className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full max-h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div {...FADE_UP} transition={{ delay: 0.15 }}>
              <Card className="p-5">
                <SectionHead
                  icon={FiBookOpen}
                  label="Story Content"
                  accent="violet"
                />
                <h3 className="text-lg font-bold text-white mb-3">
                  {story.title}
                </h3>
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {story.content}
                  </p>
                </div>

                <div className="flex gap-3 mt-4 text-[10px] text-slate-600 font-semibold flex-wrap">
                  <span className="flex items-center gap-1">
                    <FiClock size={10} />
                    Created:{" "}
                    {new Date(story.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {story.expiresAt && (
                    <span className="flex items-center gap-1">
                      <FiCalendar size={10} />
                      Expires:{" "}
                      {new Date(story.expiresAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.18 }}>
              <Card className="p-5">
                <SectionHead
                  icon={FiInfo}
                  label="Story Details"
                  accent="violet"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: "Title", value: story.title },
                    { label: "Type", value: story.type },
                    { label: "District", value: story.district },
                    { label: "Taluka", value: story.taluka },
                    { label: "Location", value: story.locationAddress },
                    {
                      label: "Highlighted",
                      value: story.isHighlighted ? "Yes" : "No",
                    },
                    {
                      label: "Highlight Category",
                      value: story.highlightCategory,
                    },
                    { label: "Author", value: story.author },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30"
                    >
                      <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">
                        {label}
                      </p>
                      <p className="text-[11px] font-bold text-white truncate">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-5">
            <motion.div {...FADE_UP} transition={{ delay: 0.2 }}>
              <Card className="p-5">
                <SectionHead
                  icon={FiUser}
                  label="Author Profile"
                  accent="violet"
                />
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center overflow-hidden">
                      {author.profilePic ? (
                        <img
                          src={author.profilePic}
                          alt=""
                          className="w-14 h-14 object-cover"
                        />
                      ) : (
                        <FiUser size={24} className="text-violet-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Name
                      </p>
                      <button
                        onClick={() =>
                          author._id && navigate(`/admin/user/${author._id}`)
                        }
                        className="text-sm font-black text-white hover:text-violet-400 transition-colors truncate block text-left"
                      >
                        {story.author || author.name || "—"}
                      </button>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Email
                      </p>
                      <a
                        href={`mailto:${author.email}`}
                        className="text-sm font-bold text-violet-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <FiMail size={12} /> {author.email || "—"}
                      </a>
                    </div>
                    {author.phone && (
                      <div>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                          Phone
                        </p>
                        <a
                          href={`tel:${author.phone}`}
                          className="text-sm font-bold text-violet-400 hover:underline flex items-center gap-1.5 truncate"
                        >
                          <FiPhone size={12} /> {author.phone}
                        </a>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Location
                      </p>
                      <p className="text-sm font-bold text-slate-300 flex items-center gap-1.5 truncate">
                        <FiMapPin size={12} className="text-rose-400" />
                        {author.district || "—"}
                        {author.taluka ? `, ${author.taluka}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.22 }}>
              <Card className="p-5">
                <SectionHead
                  icon={FiMapPin}
                  label="Location Details"
                  accent="violet"
                />
                <div className="space-y-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Full Address
                    </p>
                    <p className="text-[11px] font-bold text-white">
                      {story.locationAddress || "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        District
                      </p>
                      <p className="text-[11px] font-bold text-white">
                        {story.district || "—"}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Taluka
                      </p>
                      <p className="text-[11px] font-bold text-white">
                        {story.taluka || "—"}
                      </p>
                    </div>
                  </div>
                  {story.location?.coordinates && (
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Coordinates
                      </p>
                      <p className="text-[11px] font-mono font-bold text-slate-400">
                        {story.location.coordinates[1]?.toFixed(4)},{" "}
                        {story.location.coordinates[0]?.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.24 }}>
              <Card className="p-5">
                <SectionHead
                  icon={FiInfo}
                  label="Registry Info"
                  accent="violet"
                />
                <div className="space-y-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                      Story ID
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                      {story._id}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                      Author ID
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                      {author._id || story.authorId || "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex gap-2.5 items-start">
                  <FiInfo
                    size={12}
                    className="text-slate-600 mt-0.5 shrink-0"
                  />
                  <p className="text-[9px] text-slate-600 leading-relaxed">
                    All admin actions are permanent and auditable by the
                    compliance engine.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {showDeleteModal && (
            <DeleteModal
              story={story}
              onConfirm={handleDelete}
              onCancel={() => setShowDeleteModal(false)}
              loading={deleteLoading}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminStoryDetails;
