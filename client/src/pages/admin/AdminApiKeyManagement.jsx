import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../services";
import {
  FiKey,
  FiPlus,
  FiTrash2,
  FiClock,
  FiActivity,
  FiShield,
  FiX,
  FiCheck,
  FiCopy,
  FiEye,
} from "react-icons/fi";

const SCOPES = [
  "users:read",
  "businesses:read",
  "jobs:read",
  "products:read",
  "orders:read",
  "analytics:read",
  "notifications:write",
];

const AdminApiKeyManagement = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [form, setForm] = useState({
    name: "",
    scopes: [],
    rateLimit: 1000,
    expiresAt: "",
  });
  const [viewingLogs, setViewingLogs] = useState(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getApiKeys();
      setKeys(res.data);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.createApiKey(form);
      setNewKeyData(res.data.apiKey);
      toast.success("API Key generated!");
      fetchKeys();
    } catch {
      toast.error("Failed to create key");
    }
  };

  const handleRevoke = async (id) => {
    if (
      !window.confirm(
        "Are you sure? This will instantly break all applications using this key.",
      )
    )
      return;
    try {
      await adminService.revokeApiKey(id);
      toast.success("API Key revoked");
      fetchKeys();
    } catch {
      toast.error("Failed to revoke");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent delete? Cannot be undone.")) return;
    try {
      await adminService.deleteApiKey(id);
      toast.success("API Key deleted");
      fetchKeys();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleViewLogs = async (id) => {
    try {
      const res = await adminService.getApiKeyLogs(id);
      setViewingLogs(res.data);
    } catch {
      toast.error("Failed to load logs");
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            API <span className="text-indigo-400">Keys & Webhooks</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage external access and programmatic integrations
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setNewKeyData(null);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20"
        >
          <FiPlus /> Generate Key
        </button>
      </header>

      {newKeyData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiShield className="text-emerald-400 text-3xl" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              New API Key Generated
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Copy this key now. For security, it will never be shown again.
            </p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 mb-6 flex items-center justify-between gap-3 group">
              <code className="text-emerald-400 text-xs font-mono break-all text-left">
                {newKeyData.key}
              </code>
              <button
                onClick={() => copyToClipboard(newKeyData.key)}
                className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <FiCopy />
              </button>
            </div>
            <button
              onClick={() => {
                setNewKeyData(null);
                setShowCreate(false);
              }}
              className="w-full py-3 bg-slate-800 rounded-2xl text-sm font-black text-white hover:bg-slate-700 transition-all"
            >
              I've Saved the Key
            </button>
          </div>
        </div>
      )}

      {showCreate && !newKeyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-lg font-black text-white">Issue API Key</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Key Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Analytics Dashboard Integration"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Scopes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SCOPES.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 p-2 bg-slate-800/40 border border-white/5 rounded-lg cursor-pointer hover:bg-white/5 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={form.scopes.includes(s)}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            scopes: f.scopes.includes(s)
                              ? f.scopes.filter((x) => x !== s)
                              : [...f.scopes, s],
                          }))
                        }
                        className="accent-indigo-500"
                      />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Daily Rate Limit
                  </label>
                  <input
                    type="number"
                    value={form.rateLimit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rateLimit: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Expiry (Optional)
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiresAt: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none scheme-dark"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 bg-slate-800 border border-white/10 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black transition-all"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white">
                  Usage Logs: {viewingLogs.name}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Prefix: {viewingLogs.prefix} · Total Calls:{" "}
                  {viewingLogs.usageCount}
                </p>
              </div>
              <button
                onClick={() => setViewingLogs(null)}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {viewingLogs.usageLogs?.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs italic">
                  No activity logs recorded yet
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <tr>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Method</th>
                      <th className="pb-3">Endpoint</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {viewingLogs.usageLogs.map((log, i) => (
                      <tr key={i} className="text-xs">
                        <td className="py-3 text-slate-400 font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 font-black text-indigo-400">
                          {log.method}
                        </td>
                        <td className="py-3 text-slate-300 truncate max-w-50 font-mono">
                          {log.endpoint}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${log.statusCode >= 400 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}
                          >
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiKey className="text-slate-700 text-5xl mb-4" />
          <p className="text-white font-black text-lg">No API Keys Issued</p>
          <p className="text-slate-500 text-sm mt-1">
            External applications will need a key to access Lokonomy data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {keys.map((k) => (
            <div
              key={k._id}
              className={`bg-slate-900/60 border rounded-2xl p-5 transition-all group ${k.status === "revoked" ? "border-rose-500/20 opacity-60" : "border-white/5 hover:border-indigo-500/20"}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-black text-white">{k.name}</h3>
                    {k.status === "revoked" ? (
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[9px] font-black text-rose-400 uppercase tracking-widest">
                        Revoked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">
                    {k.prefix}************************
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewLogs(k._id)}
                    className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all"
                    title="View Logs"
                  >
                    <FiActivity size={14} />
                  </button>
                  {k.status !== "revoked" && (
                    <button
                      onClick={() => handleRevoke(k._id)}
                      className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition-all"
                      title="Revoke Key"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(k._id)}
                    className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                    title="Delete Key"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {k.scopes.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/10 rounded text-[9px] font-bold text-indigo-400 uppercase"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest pt-4 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <FiClock size={10} /> Last Used:{" "}
                  {k.lastUsed
                    ? new Date(k.lastUsed).toLocaleDateString()
                    : "Never"}
                </span>
                <span className="flex items-center gap-1">
                  <FiActivity size={10} /> {k.usageCount} Calls / {k.rateLimit}{" "}
                  Limit
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminApiKeyManagement;
