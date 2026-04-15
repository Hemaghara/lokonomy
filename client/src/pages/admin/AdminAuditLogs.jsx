import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiActivity,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUser,
  FiClock,
  FiTerminal,
  FiDatabase,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [filter, setFilter] = useState({
    adminId: "all",
    action: "all",
    startDate: "",
    endDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [filter, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        ...filter,
        search: searchQuery,
        page: currentPage,
        limit: 15,
      };
      const response = await adminService.getAuditLogs(params);
      setLogs(response.data.logs);
      setAdmins(response.data.admins);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Timestamp",
      "Admin",
      "Role",
      "Action",
      "Details",
      "IP Address",
    ];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      l.admin?.name,
      l.admin?.role,
      l.action,
      l.details?.replace(/,/g, ";"),
      l.ipAddress,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `audit_log_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-slate-500/15 border border-slate-500/20 flex items-center justify-center">
              <FiActivity className="text-slate-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Audit Logs
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Track all administrative actions and system updates
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-lg"
        >
          <FiDownload size={14} /> Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            size={14}
          />
          <input
            type="text"
            placeholder="Search by action or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 text-sm outline-none focus:border-indigo-500/50"
          />
        </div>
        <select
          className="bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl px-4 py-2.5 outline-none cursor-pointer"
          value={filter.adminId}
          onChange={(e) => setFilter({ ...filter, adminId: e.target.value })}
        >
          <option value="all">All Admins</option>
          {admins.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} ({a.role})
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchLogs()}
          className="bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all"
        >
          Apply Filters
        </button>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-950/30 border-b border-white/5">
                {[
                  "Date & Time",
                  "Admin User",
                  "Action performed",
                  "IP Address",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-20 text-center text-slate-600 text-xs font-bold uppercase tracking-widest"
                  >
                    No logs recorded yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <FiClock size={12} />
                        <span className="text-xs font-bold">
                          {new Date(log.timestamp).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                          {log.admin?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            {log.admin?.name || "System"}
                          </p>
                          <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-tighter">
                            {log.admin?.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 max-w-xs truncate group-hover:whitespace-normal group-hover:wrap-break-word">
                          {log.details}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono text-slate-600">
                        {log.ipAddress || "0.0.0.0"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 disabled:opacity-20 transition-all hover:bg-slate-800"
          >
            <FiChevronLeft size={20} />
          </button>
          <div className="flex items-center px-4 text-xs font-black text-slate-500 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 disabled:opacity-20 transition-all hover:bg-slate-800"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAuditLogs;
