import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiMessageCircle,
  FiActivity,
  FiAlertCircle,
  FiSearch,
  FiEye,
  FiTrendingUp,
  FiUser,
  FiBriefcase,
} from "react-icons/fi";

const AdminChats = () => {
  const [stats, setStats] = useState(null);
  const [reportedChats, setReportedChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportedRes] = await Promise.all([
        adminService.getChatStats(),
        adminService.getReportedChats(),
      ]);
      setStats(statsRes.data);
      setReportedChats(reportedRes.data);
    } catch (error) {
      toast.error("Failed to fetch chat data");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FiMessageCircle className="text-indigo-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Chat Monitoring
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Analyze platform conversation volumes and manage reports
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Messages",
            value: stats?.totalMessages,
            color: "indigo",
            icon: FiMessageCircle,
          },
          {
            label: "Messages Today",
            value: stats?.messagesToday,
            color: "emerald",
            icon: FiTrendingUp,
          },
          {
            label: "Active Rooms",
            value: stats?.activeRooms,
            color: "blue",
            icon: FiActivity,
          },
          {
            label: "Reported Chats",
            value: reportedChats.length,
            color: "rose",
            icon: FiAlertCircle,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-white/5 rounded-2xl p-5"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-2xl font-black text-white">
                {s.value || 0}
              </span>
              <s.icon className={`text-${s.color}-400`} size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden p-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
            <FiAlertCircle className="text-rose-400" /> Reported Conversations
          </h3>
          <div className="space-y-4">
            {reportedChats.length === 0 ? (
              <p className="text-center py-10 text-slate-600 font-bold text-xs uppercase tracking-widest">
                No chat reports
              </p>
            ) : (
              reportedChats.map((r) => (
                <div
                  key={r._id}
                  className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 hover:border-rose-500/30 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                        Flagged
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors">
                      <FiEye size={16} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-200 mb-1">
                    Reason: {r.reason}
                  </p>
                  <p className="text-xs text-slate-500">
                    Reported by: {r.reportedBy?.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">
            Chat Distribution
          </h3>
          <div className="space-y-6">
            {stats?.chatTypeStats?.map((type, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {type._id || "Other"}
                  </span>
                  <span className="text-xs font-black text-white">
                    {type.count} msgs
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${(type.count / stats.totalMessages) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!stats?.chatTypeStats || stats.chatTypeStats.length === 0) && (
              <p className="text-center py-10 text-slate-600 font-bold text-xs uppercase tracking-widest">
                No volume data
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChats;
