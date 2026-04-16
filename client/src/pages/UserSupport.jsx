import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import {
  FiLifeBuoy,
  FiSend,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import Navbar from "../components/Navbar";

const UserSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "general",
    description: "",
    priority: "low",
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      const res = await api.get("/support/my-tickets");
      setTickets(res.data.tickets);
    } catch (error) {
      console.error("Error fetching tickets");
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/support/create", newTicket);
      toast.success("Ticket raised successfully!");
      setNewTicket({
        subject: "",
        category: "general",
        description: "",
        priority: "low",
      });
      setShowForm(false);
      fetchMyTickets();
    } catch (error) {
      toast.error("Failed to raise ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Support Center
            </h1>
            <p className="text-slate-500">
              Need help? Raise a ticket and our team will get back to you.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            {showForm ? "View My Tickets" : "Raise a Ticket"}
          </button>
        </header>

        {showForm ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-5">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                    Subject
                  </label>
                  <input
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 transition-all"
                    placeholder="Briefly describe the issue"
                    value={newTicket.subject}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, subject: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 transition-all appearance-none"
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, category: e.target.value })
                    }
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing & Payment</option>
                    <option value="marketplace">Marketplace Issue</option>
                    <option value="account">Account Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  Priority
                </label>
                <div className="flex gap-3">
                  {["low", "medium", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setNewTicket({ ...newTicket, priority: p })
                      }
                      className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        newTicket.priority === p
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 transition-all resize-none"
                  placeholder="Tell us more about the problem..."
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? "Raising Ticket..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <FiLifeBuoy className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  You haven't raised any tickets yet
                </p>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t._id}
                  className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          t.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-indigo-500/10 text-indigo-600"
                        }`}
                      >
                        {t.status === "resolved" ? (
                          <FiCheckCircle size={20} />
                        ) : (
                          <FiClock size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {t.subject}
                        </h3>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">
                          #{t.ticketNumber}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        t.status === "open"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : t.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <FiMessageSquare /> {t.category}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <FiAlertCircle /> Priority: {t.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSupport;
