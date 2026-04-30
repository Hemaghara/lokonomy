import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../services";
import {
  FiTarget,
  FiPlus,
  FiSend,
  FiTrash2,
  FiUsers,
  FiCheck,
  FiX,
} from "react-icons/fi";

const PLANS = ["free", "silver", "gold", "platinum"];
const DISTRICTS = [
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Gandhinagar",
  "Anand",
  "Mehsana",
  "Patan",
];

const defaultSegment = {
  districts: [],
  plans: [],
  lastLoginBefore: "",
  lastLoginAfter: "",
  minLoyaltyPoints: "",
  maxLoyaltyPoints: "",
};
const defaultNotif = { title: "", body: "", actionUrl: "" };

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "one_time",
    segment: defaultSegment,
    notification: defaultNotif,
    scheduledAt: "",
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await adminService.getCampaigns();
      setCampaigns(res.data);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handlePreview = async () => {
    try {
      const res = await adminService.previewSegment(form.segment);
      setPreview(res.data);
    } catch {
      toast.error("Preview failed");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCampaign(form);
      toast.success("Campaign created!");
      setShowForm(false);
      setForm({
        name: "",
        description: "",
        type: "one_time",
        segment: defaultSegment,
        notification: defaultNotif,
        scheduledAt: "",
      });
      setPreview(null);
      fetchCampaigns();
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  const handleSend = async (id) => {
    try {
      setSending(id);
      const res = await adminService.sendCampaign(id);
      toast.success(res.data.message);
      fetchCampaigns();
    } catch {
      toast.error("Failed to send campaign");
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminService.deleteCampaign(id);
      toast.success("Campaign deleted");
      fetchCampaigns();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const segField = (key, val) =>
    setForm((f) => ({ ...f, segment: { ...f.segment, [key]: val } }));
  const notifField = (key, val) =>
    setForm((f) => ({ ...f, notification: { ...f.notification, [key]: val } }));

  const statusColor = {
    draft: "text-slate-400 bg-slate-800",
    scheduled: "text-sky-400 bg-sky-500/10",
    running: "text-amber-400 bg-amber-500/10",
    completed: "text-emerald-400 bg-emerald-500/10",
    cancelled: "text-rose-400 bg-rose-500/10",
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            User <span className="text-indigo-400">Campaigns</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Segment users and send targeted notifications
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20"
        >
          <FiPlus /> New Campaign
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-lg font-black text-white">Create Campaign</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setPreview(null);
                }}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Campaign Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. July Renewal Push"
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60"
                  >
                    <option value="one_time">One Time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                  Target Segment
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2">
                    Plans
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLANS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          segField(
                            "plans",
                            form.segment.plans.includes(p)
                              ? form.segment.plans.filter((x) => x !== p)
                              : [...form.segment.plans, p],
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${form.segment.plans.includes(p) ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800 text-slate-400 border-white/10"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Min Loyalty Points
                    </label>
                    <input
                      type="number"
                      value={form.segment.minLoyaltyPoints}
                      onChange={(e) =>
                        segField("minLoyaltyPoints", e.target.value)
                      }
                      placeholder="0"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Inactive Since
                    </label>
                    <input
                      type="date"
                      value={form.segment.lastLoginBefore}
                      onChange={(e) =>
                        segField("lastLoginBefore", e.target.value)
                      }
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none scheme-dark"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="text-xs font-black text-indigo-400 hover:text-indigo-300 underline-offset-2 underline"
                >
                  Preview segment →
                </button>
                {preview && (
                  <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                    <p className="text-xs font-black text-indigo-400">
                      {preview.count} users targeted
                    </p>
                    {preview.sample?.map((u) => (
                      <p
                        key={u._id}
                        className="text-[11px] text-slate-500 mt-1"
                      >
                        {u.name} · {u.email}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  Notification Payload
                </h4>
                <input
                  required
                  value={form.notification.title}
                  onChange={(e) => notifField("title", e.target.value)}
                  placeholder="Notification Title *"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60"
                />
                <textarea
                  required
                  value={form.notification.body}
                  onChange={(e) => notifField("body", e.target.value)}
                  placeholder="Notification body message *"
                  rows={3}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none resize-none focus:border-indigo-500/60"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setPreview(null);
                  }}
                  className="px-5 py-2.5 bg-slate-800 border border-white/10 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black transition-all"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-900/60 border border-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiTarget className="text-indigo-400 text-5xl mb-4" />
          <p className="text-white font-black text-lg">No Campaigns Yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Create your first targeted campaign above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c._id}
              className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-black text-white">{c.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColor[c.status] || "text-slate-400 bg-slate-800"}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {c.notification?.title} · {c.stats?.targetedCount} targeted
                    · {c.stats?.sentCount} sent · {c.stats?.openedCount} opened
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(c.status === "draft" || c.status === "scheduled") && (
                    <button
                      onClick={() => handleSend(c._id)}
                      disabled={sending === c._id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all"
                    >
                      {sending === c._id ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <FiSend size={12} />
                      )}
                      Send Now
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c._id)}
                    aria-label="Delete Campaign"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCampaigns;
