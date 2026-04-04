import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiRss,
  FiUser,
  FiAlertTriangle,
  FiArrowLeft,
  FiMapPin,
  FiMail,
  FiPhone,
  FiInfo,
  FiClock,
  FiTag,
  FiTrash2,
  FiCalendar,
} from "react-icons/fi";

const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const typeColorMap = {
  Sale: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  Offer: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  Information: "bg-sky-500/15 text-sky-400 border-sky-500/25",
  "New Arrival": "bg-lime-500/15 text-lime-400 border-lime-500/25",
  Exhibition: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  Event: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

const SectionHead = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-5">
    <Icon size={14} className="text-cyan-400 shrink-0" />
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
      {label}
    </span>
  </div>
);

const StatTile = ({ icon: Icon, label, value, accent = "cyan" }) => (
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
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/15 border-t-cyan-500 animate-spin" />
        <FiRss
          className="absolute inset-0 m-auto text-cyan-400 animate-pulse"
          size={18}
        />
      </div>
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
        Loading feed post…
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
          This feed post could not be located in the database.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm rounded-xl transition-colors"
        >
          Return to Stories & Feed
        </button>
      </motion.div>
    </div>
  </AdminLayout>
);

const DeleteModal = ({ feed, onConfirm, onCancel, loading }) => (
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
        <h3 className="text-lg font-bold text-white">Delete Feed Post?</h3>
      </div>
      <p className="text-slate-400 text-sm mb-2">
        You are about to permanently delete this feed post:
      </p>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 mb-6">
        <p className="text-white text-sm font-semibold truncate">
          {feed?.title}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          by {feed?.author} · #{feed?._id?.slice(-6)}
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

const AdminFeedDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await adminService.getFeedDetails(id);
      setFeed(res.data);
    } catch {
      toast.error("Failed to fetch feed details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminService.deleteFeed(id);
      toast.success("Feed post deleted successfully");
      navigate("/admin/stories-feed");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!feed)
    return <NotFoundScreen onBack={() => navigate("/admin/stories-feed")} />;

  const author = feed.authorId || {};

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
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all"
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight truncate max-w-55 sm:max-w-xs md:max-w-none">
                  {feed.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${typeColorMap[feed.type] || "bg-slate-500/10 text-slate-400 ring-slate-500/25"}`}
                >
                  {feed.type}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                <FiMapPin size={10} className="text-cyan-400" />
                {feed.locationAddress || feed.district || "No location"}{" "}
                {feed.taluka ? `· ${feed.taluka}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-sm bg-rose-600 hover:bg-rose-500 text-white shrink-0"
          >
            <FiTrash2 size={13} /> Delete Feed Post
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        >
          <StatTile icon={FiTag} label="Type" value={feed.type} accent="cyan" />
          <StatTile
            icon={FiCalendar}
            label="Created"
            value={new Date(feed.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            accent="emerald"
          />
          <StatTile
            icon={FiClock}
            label="Event Date"
            value={feed.eventDate || "—"}
            accent="amber"
          />
          <StatTile
            icon={FiMapPin}
            label="District"
            value={feed.district || "—"}
            accent="violet"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {feed.image && (
              <motion.div {...FADE_UP} transition={{ delay: 0.12 }}>
                <Card className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={feed.image}
                      alt={feed.title}
                      className="w-full max-h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div {...FADE_UP} transition={{ delay: 0.15 }}>
              <Card className="p-5">
                <SectionHead icon={FiRss} label="Feed Content" />
                <h3 className="text-lg font-bold text-white mb-3">
                  {feed.title}
                </h3>
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {feed.content}
                  </p>
                </div>

                <div className="flex gap-3 mt-4 text-[10px] text-slate-600 font-semibold flex-wrap">
                  <span className="flex items-center gap-1">
                    <FiClock size={10} />
                    Created:{" "}
                    {new Date(feed.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {feed.eventDate && (
                    <span className="flex items-center gap-1">
                      <FiCalendar size={10} />
                      Event: {feed.eventDate}
                      {feed.eventTime && ` at ${feed.eventTime}`}
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.18 }}>
              <Card className="p-5">
                <SectionHead icon={FiInfo} label="Feed Details" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: "Title", value: feed.title },
                    { label: "Type", value: feed.type },
                    { label: "District", value: feed.district },
                    { label: "Taluka", value: feed.taluka },
                    { label: "Location", value: feed.locationAddress },
                    { label: "Event Date", value: feed.eventDate },
                    { label: "Event Time", value: feed.eventTime },
                    { label: "Author", value: feed.author },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30"
                    >
                      <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1">
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
                <SectionHead icon={FiUser} label="Author Profile" />
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center overflow-hidden">
                      {author.profilePic ? (
                        <img
                          src={author.profilePic}
                          alt=""
                          className="w-14 h-14 object-cover"
                        />
                      ) : (
                        <FiUser size={24} className="text-cyan-400" />
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
                        className="text-sm font-black text-white hover:text-cyan-400 transition-colors truncate block text-left"
                      >
                        {feed.author || author.name || "—"}
                      </button>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Email
                      </p>
                      <a
                        href={`mailto:${author.email}`}
                        className="text-sm font-bold text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
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
                          className="text-sm font-bold text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
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
                <SectionHead icon={FiMapPin} label="Location Details" />
                <div className="space-y-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Full Address
                    </p>
                    <p className="text-[11px] font-bold text-white">
                      {feed.locationAddress || "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        District
                      </p>
                      <p className="text-[11px] font-bold text-white">
                        {feed.district || "—"}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Taluka
                      </p>
                      <p className="text-[11px] font-bold text-white">
                        {feed.taluka || "—"}
                      </p>
                    </div>
                  </div>
                  {feed.location?.coordinates && (
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Coordinates
                      </p>
                      <p className="text-[11px] font-mono font-bold text-slate-400">
                        {feed.location.coordinates[1]?.toFixed(4)},{" "}
                        {feed.location.coordinates[0]?.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.24 }}>
              <Card className="p-5">
                <SectionHead icon={FiInfo} label="Registry Info" />
                <div className="space-y-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                      Feed ID
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                      {feed._id}
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                      Author ID
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                      {author._id || feed.authorId || "—"}
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
              feed={feed}
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

export default AdminFeedDetails;
