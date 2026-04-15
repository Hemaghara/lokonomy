import { useState } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiDownload,
  FiFileText,
  FiUsers,
  FiShoppingBag,
  FiBriefcase,
  FiPieChart,
} from "react-icons/fi";

const AdminReports = () => {
  const [downloading, setDownloading] = useState(null);

  const handleExport = async (type) => {
    try {
      setDownloading(type);
      const response = await adminService.exportExcel(type);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `lokonomy_${type}_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();

      toast.success(`${type} report exported`);
    } catch (error) {
      toast.error(`Failed to export ${type} report`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <FiPieChart className="text-emerald-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Reporting Center
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Generate and download comprehensive Excel reports
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            id: "users",
            label: "User Directory",
            desc: "Full list of registered users with contact info and registration dates.",
            icon: FiUsers,
            color: "blue",
          },
          {
            id: "orders",
            label: "Sales & Orders",
            desc: "Detailed transaction history including buyer/seller info and status.",
            icon: FiShoppingBag,
            color: "indigo",
          },
          {
            id: "businesses",
            label: "Business Registry",
            desc: "Catalog of all registered businesses with verification status.",
            icon: FiBriefcase,
            color: "emerald",
          },
        ].map((report) => (
          <div
            key={report.id}
            className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 hover:bg-slate-800/40 transition-all group"
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-${report.color}-500/10 flex items-center justify-center text-${report.color}-400 mb-6 group-hover:scale-110 transition-transform`}
            >
              <report.icon size={28} />
            </div>
            <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">
              {report.label}
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              {report.desc}
            </p>

            <button
              onClick={() => handleExport(report.id)}
              disabled={!!downloading}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all ${
                downloading === report.id
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : `bg-${report.color}-600 text-white hover:bg-${report.color}-500 shadow-lg shadow-${report.color}-600/10`
              }`}
            >
              {downloading === report.id ? (
                <div className="w-5 h-5 border-2 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiDownload size={18} /> Download Excel
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <FiFileText size={32} />
        </div>
        <div>
          <h4 className="text-xl font-black text-white mb-1 uppercase tracking-tight">
            Custom Date Range?
          </h4>
          <p className="text-sm text-slate-400">
            By default, these reports export the entire dataset. If you need
            filtered reports (e.g. last 30 days), please use the individual page
            filters.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
