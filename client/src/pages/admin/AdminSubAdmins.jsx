import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiUsers,
  FiShield,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiActivity,
  FiLock,
  FiKey,
  FiMoreVertical,
  FiClock,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
} from "react-icons/fi";

const ROLES = [
  "Content Moderator",
  "Support Agent",
  "Finance Manager",
  "admin",
];

const PERMISSIONS = [
  "User Management",
  "Analytics & Reports",
  "Marketplace",
  "Finance",
  "Support System",
  "Content",
  "Reports",
  "Transactions",
];

const ROLE_PRESETS = {
  "Content Moderator": ["Content", "Reports", "Support System"],
  "Support Agent": ["Support System", "User Management"],
  "Finance Manager": ["Finance", "Transactions", "Analytics & Reports"],
  admin: PERMISSIONS,
};

const AdminSubAdmins = () => {
  const navigate = useNavigate();
  const [subAdmins, setSubAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [resetModal, setResetModal] = useState({
    show: false,
    adminId: null,
    newPassword: "",
  });

  const fetchSubAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getSubAdmins({
        search,
        role: roleFilter,
        status: statusFilter,
      });
      setSubAdmins(res.data.data);
    } catch (error) {
      toast.error("Failed to load sub-admins");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await adminService.getAdminActivityLogs();
      setLogs(res.data.data);
    } catch (error) {
      console.error("Failed to load logs");
    }
  }, []);

  useEffect(() => {
    fetchSubAdmins();
    fetchLogs();
  }, [fetchSubAdmins, fetchLogs]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sub-admin?")) {
      try {
        await adminService.deleteSubAdmin(id);
        toast.success("Sub-admin deleted");
        fetchSubAdmins();
        fetchLogs();
      } catch (error) {
        toast.error("Failed to delete sub-admin");
      }
    }
  };

  const handleStatusToggle = async (admin) => {
    const newStatus = admin.status === "Active" ? "Inactive" : "Active";
    try {
      await adminService.updateSubAdmin(admin._id, { status: newStatus });
      toast.success(
        `Account ${newStatus === "Active" ? "Enabled" : "Disabled"}`,
      );
      fetchSubAdmins();
      fetchLogs();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleResetPassword = async () => {
    if (!resetModal.newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    try {
      await adminService.resetSubAdminPassword(
        resetModal.adminId,
        resetModal.newPassword,
      );
      toast.success("Password reset successfully");
      setResetModal({ show: false, adminId: null, newPassword: "" });
      fetchLogs();
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/20">
                <FiShield className="text-indigo-400" />
              </div>
              Sub-Admin <span className="text-indigo-500">Management</span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm font-medium">
              Create, manage, and monitor access for administrative staff
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/sub-admins/create")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <FiPlus /> Add Sub-Admin
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/60 w-fit">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "list" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-white"}`}
          >
            <FiUsers /> Admin List
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "logs" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-white"}`}
          >
            <FiActivity /> Activity Logs
          </button>
        </div>

        {activeTab === "list" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="sm:col-span-2 relative group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 font-medium text-sm"
                />
              </div>
              <div className="relative group">
                <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm cursor-pointer"
                >
                  <option value="">All Roles</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative group">
                <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="hidden lg:block bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/60 bg-slate-800/20">
                      <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        Admin Info
                      </th>
                      <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        Role & Access
                      </th>
                      <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        Last Active
                      </th>
                      <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <FiRefreshCw className="text-3xl text-indigo-500 animate-spin" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                              Loading admin data...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : subAdmins.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-50">
                            <FiUsers className="text-4xl text-slate-700" />
                            <p className="text-slate-500 font-medium">
                              No sub-admins found matching your filters
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      subAdmins.map((admin) => (
                        <tr
                          key={admin._id}
                          className="hover:bg-slate-800/20 transition-colors group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner shrink-0">
                                {admin.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                                  {admin.name}
                                </p>
                                <p className="text-xs text-slate-500 font-medium truncate">
                                  {admin.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-2">
                              <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/20">
                                {admin.role}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {admin.permissions?.slice(0, 3).map((p, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] font-bold text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/30 whitespace-nowrap uppercase tracking-tighter"
                                  >
                                    {p}
                                  </span>
                                ))}
                                {admin.permissions?.length > 3 && (
                                  <span className="text-[9px] font-bold text-slate-600 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/30">
                                    +{admin.permissions.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${admin.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${admin.status === "Active" ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}
                              />
                              {admin.status}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-slate-400">
                              <FiClock className="text-xs" />
                              <span className="text-xs font-medium">
                                {admin.lastActive
                                  ? new Date(
                                      admin.lastActive,
                                    ).toLocaleDateString()
                                  : "Never"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/sub-admins/edit/${admin._id}`,
                                  )
                                }
                                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700/40"
                                title="Edit Admin"
                              >
                                <FiEdit2 className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleStatusToggle(admin)}
                                className={`p-2.5 rounded-xl transition-all border ${admin.status === "Active" ? "bg-slate-800 text-amber-500 hover:bg-amber-500/10 border-slate-700/40" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}
                                title={
                                  admin.status === "Active"
                                    ? "Disable Account"
                                    : "Enable Account"
                                }
                              >
                                {admin.status === "Active" ? (
                                  <FiUserX className="text-sm" />
                                ) : (
                                  <FiUserCheck className="text-sm" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  setResetModal({
                                    show: true,
                                    adminId: admin._id,
                                    newPassword: "",
                                  })
                                }
                                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl transition-all border border-slate-700/40"
                                title="Reset Password"
                              >
                                <FiKey className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDelete(admin._id)}
                                className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20"
                                title="Delete Admin"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:hidden space-y-4">
              {loading ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-12 text-center">
                  <FiRefreshCw className="text-3xl text-indigo-500 animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Loading admins...
                  </p>
                </div>
              ) : subAdmins.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-12 text-center opacity-50">
                  <FiUsers className="text-4xl text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No results found</p>
                </div>
              ) : (
                subAdmins.map((admin) => (
                  <div
                    key={admin._id}
                    className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 font-bold">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          {admin.name.charAt(0)}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-white truncate">{admin.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold truncate">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${admin.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${admin.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        {admin.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold uppercase tracking-widest">
                          Role
                        </span>
                        <span className="text-indigo-400 font-black uppercase tracking-widest border border-indigo-500/20 px-2 py-0.5 rounded-lg bg-indigo-500/5">
                          {admin.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold uppercase tracking-widest">
                          Permissions
                        </span>
                        <span className="font-medium text-slate-300">
                          {admin.permissions?.length || 0} Modules
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <FiClock className="text-xs" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {admin.lastActive
                            ? new Date(admin.lastActive).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/sub-admins/edit/${admin._id}`)
                          }
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg border border-slate-700/40"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(admin)}
                          className={`p-2 rounded-lg border ${admin.status === "Active" ? "bg-slate-800 text-amber-500 border-slate-700/40" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}
                        >
                          {admin.status === "Active" ? (
                            <FiUserX size={14} />
                          ) : (
                            <FiUserCheck size={14} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setResetModal({
                              show: true,
                              adminId: admin._id,
                              newPassword: "",
                            })
                          }
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg border border-slate-700/40"
                          title="Reset Password"
                        >
                          <FiKey size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(admin._id)}
                          className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="p-6 border-b border-slate-800/60 bg-slate-800/20 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <FiActivity className="text-indigo-400" /> Recent Administrative
                Activity
              </h3>
              <button
                onClick={fetchLogs}
                className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
              >
                <FiRefreshCw className="text-xs" /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-800/10">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Admin
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Action
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-20 text-center text-slate-600 font-medium"
                      >
                        No activity logs recorded yet
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log._id}
                        className="hover:bg-slate-800/10 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 text-xs font-bold border border-slate-700/40">
                              {log.admin?.name?.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                              {log.admin?.name || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-500">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-400 font-medium max-w-md truncate">
                            {log.details}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-medium text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {resetModal.show && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-3xl shadow-indigo-500/10 animate-scale-in">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                  <FiKey className="text-indigo-500" />
                  Reset <span className="text-indigo-500">Password</span>
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Secure authentication update
                </p>
              </div>
              <button
                onClick={() =>
                  setResetModal({ ...resetModal, show: false, adminId: null })
                }
                className="p-2.5 bg-slate-800/50 hover:bg-slate-800 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-800/60 active:scale-95"
              >
                <FiXCircle size={18} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={resetModal.newPassword}
                    onChange={(e) =>
                      setResetModal({
                        ...resetModal,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-slate-700 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium px-2 italic">
                  * Ensure the password is strong and contains at least 8
                  characters.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() =>
                    setResetModal({ ...resetModal, show: false, adminId: null })
                  }
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold transition-all active:scale-95 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                >
                  Update Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSubAdmins;
