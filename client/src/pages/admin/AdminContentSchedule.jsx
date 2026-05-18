import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../services";
import {
  FiCalendar,
  FiRefreshCw,
  FiClock,
  FiStar,
  FiEye,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const AdminContentSchedule = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getScheduledContent();
      setData(res.data);
    } catch {
      toast.error("Failed to load content schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePin = async (id) => {
    try {
      setProcessing(id);
      await adminService.togglePinFeed(id);
      toast.success("Feed pinning status updated");
      fetchData();
    } catch {
      toast.error("Failed to update pinning");
    } finally {
      setProcessing(null);
    }
  };

  const handleScheduleStory = async (id, scheduledAt, expiresAt) => {
    try {
      await adminService.scheduleStory(id, { scheduledAt, expiresAt });
      toast.success("Story schedule updated");
      fetchData();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Content <span className="text-sky-400">Scheduling</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage featured content, stories expiry, and community pins
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-2xl text-sm font-bold text-slate-300 hover:text-white transition-all"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-900/60 border border-white/5 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FiClock size={20} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Scheduled <span className="text-indigo-400">Stories</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!data?.scheduledStories || data.scheduledStories.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-900/40 border border-dashed border-white/5 rounded-3xl text-slate-500 text-sm italic">
                  No stories scheduled for future release
                </div>
              ) : (
                data.scheduledStories.map((s) => (
                  <div
                    key={s._id}
                    className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all"
                  >
                    <h4 className="text-sm font-black text-white mb-1 truncate">
                      {s.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4">
                      By {s.author?.name || "Admin"}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 border-t border-white/5">
                      <span>
                        Goes Live:{" "}
                        {new Date(s.scheduledAt).toLocaleDateString()}
                      </span>
                      <span className="text-indigo-400">
                        {new Date(s.scheduledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FiStar size={20} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Pinned <span className="text-amber-400">Community Posts</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!data?.pinnedFeeds || data.pinnedFeeds.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-900/40 border border-dashed border-white/5 rounded-3xl text-slate-500 text-sm italic">
                  No feed posts pinned currently
                </div>
              ) : (
                data.pinnedFeeds.map((f) => (
                  <div
                    key={f._id}
                    className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-white line-clamp-2 mb-3">
                        "{f.title}"
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                        By {f.authorId?.name || f.author || "User"} · Pinned{" "}
                        {new Date(f.pinnedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTogglePin(f._id)}
                      disabled={processing === f._id}
                      className="p-2 bg-slate-800 rounded-xl text-amber-400 hover:bg-slate-700 transition-all shrink-0"
                      title="Unpin Post"
                    >
                      <FiStar fill="currentColor" size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <FiAlertCircle size={20} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Expiring <span className="text-rose-400">Soon</span>
              </h3>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl overflow-hidden">
              {!data?.expiringStories || data.expiringStories.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm italic">
                  No stories expiring in the next 7 days
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2">
                      <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Story Title
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Author
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Expires At
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.expiringStories.map((s) => (
                      <tr
                        key={s._id}
                        className="hover:bg-white/2 transition-all"
                      >
                        <td className="py-4 px-6 text-sm font-bold text-white truncate max-w-50">
                          {s.title}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400">
                          {s.author?.name || "Admin"}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] font-black text-rose-400 uppercase tracking-widest">
                            {new Date(s.expiresAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() =>
                              navigate(`/admin/stories-feed/story/${s._id}`)
                            }
                            className="text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-widest"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContentSchedule;
