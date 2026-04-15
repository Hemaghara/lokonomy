import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiLifeBuoy,
  FiSearch,
  FiFilter,
  FiMessageSquare,
  FiUser,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiSend,
  FiUserCheck,
} from "react-icons/fi";

const priorityConfig = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
};

const statusConfig = {
  open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  in_progress: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  resolved: "bg-slate-800 text-slate-500 border-slate-700",
  closed: "bg-slate-900 text-slate-600 border-slate-800",
};

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState({ status: "all", priority: "all" });
  const [subAdmins, setSubAdmins] = useState([]);

  useEffect(() => {
    fetchTickets();
    fetchSubAdmins();
  }, [filter]);

  const fetchSubAdmins = async () => {
    try {
      const response = await adminService.getSubAdmins();
      setSubAdmins(response.data.subAdmins || []);
    } catch (error) {}
  };

  const handleAssign = async (adminId) => {
    try {
      await adminService.assignTicket(selectedTicket._id, adminId);
      toast.success("Ticket assigned");
      const response = await adminService.getTicketById(selectedTicket._id);
      setSelectedTicket(response.data);
      fetchTickets();
    } catch (error) {
      toast.error("Assignment failed");
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSupportTickets(filter);
      setTickets(response.data.tickets);
      setStats(response.data.stats);
    } catch (error) {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      await adminService.replyToTicket(selectedTicket._id, reply);
      toast.success("Reply sent");
      setReply("");
      const response = await adminService.getTicketById(selectedTicket._id);
      setSelectedTicket(response.data);
      fetchTickets();
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminService.updateTicketStatus(id, status);
      toast.success("Status updated");
      if (selectedTicket?._id === id) {
        const response = await adminService.getTicketById(id);
        setSelectedTicket(response.data);
      }
      fetchTickets();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FiLifeBuoy className="text-indigo-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Support Center
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Manage user inquiries and technical issues
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Open Tickets",
            value: stats.open,
            color: "emerald",
            icon: FiMessageSquare,
          },
          {
            label: "In Progress",
            value: stats.in_progress,
            color: "indigo",
            icon: FiClock,
          },
          {
            label: "Urgent",
            value: stats.urgent,
            color: "rose",
            icon: FiAlertCircle,
          },
          {
            label: "Resolved",
            value: stats.resolved,
            color: "slate",
            icon: FiCheckCircle,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-white/5 rounded-2xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <s.icon className={`text-${s.color}-400`} size={16} />
              <span className="text-2xl font-black text-white">
                {s.value || 0}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-150">
        <div className="lg:col-span-4 bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={14}
              />
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none"
                placeholder="Search tickets..."
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-10 text-center text-slate-600 text-xs">
                No tickets found
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${selectedTicket?._id === t._id ? "bg-indigo-500/10 border-l-4 border-l-indigo-500" : ""}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-indigo-400 font-mono tracking-tighter uppercase">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${priorityConfig[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1 truncate">
                    {t.subject}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiUser size={10} /> {t.userName}
                    </span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col relative">
          {selectedTicket ? (
            <>
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${statusConfig[selectedTicket.status]}`}
                    >
                      {selectedTicket.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status !== "resolved" && (
                    <button
                      onClick={() =>
                        updateStatus(selectedTicket._id, "resolved")
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
                    >
                      Resolve
                    </button>
                  )}
                  {selectedTicket.status !== "closed" && (
                    <button
                      onClick={() => updateStatus(selectedTicket._id, "closed")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-700 transition-all"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 mb-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Original Request
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FiUserCheck size={12} /> Assigned To
                    </p>
                    <select
                      value={selectedTicket.assignedTo?._id || ""}
                      onChange={(e) => handleAssign(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="">Unassigned</option>
                      {subAdmins.map((admin) => (
                        <option key={admin._id} value={admin._id}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FiClock size={12} /> Priority Level
                    </p>
                    <div
                      className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${priorityConfig[selectedTicket.priority]}`}
                    >
                      {selectedTicket.priority}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedTicket.replies?.map((r, i) => (
                    <div
                      key={i}
                      className={`flex ${r.sender === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 ${r.sender === "admin" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"}`}
                      >
                        <div className="flex justify-between items-center gap-10 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                            {r.sender === "admin" ? (
                              <FiUserCheck className="inline mr-1" />
                            ) : (
                              <FiUser className="inline mr-1" />
                            )}
                            {r.senderName}
                          </span>
                          <span className="text-[9px] opacity-50">
                            {new Date(r.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm leading-snug">{r.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-md">
                  <div className="flex gap-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply here..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white resize-none h-12 outline-none focus:border-indigo-500 transition-all"
                    />
                    <button
                      onClick={handleReply}
                      className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <FiSend size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
              <FiLifeBuoy size={48} className="mb-4 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-30">
                Select a ticket to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
