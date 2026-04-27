import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import useAdminFetch from "../../hooks/useAdminFetch";
import { useConfirm } from "../../context/ConfirmContext";
import { useUrlState } from "../../hooks/useUrlState";
import { TableSkeleton } from "../../components/admin/Skeleton";
import useAdminPermission from "../../hooks/useAdminPermission";
import {
  FiTrash2,
  FiSearch,
  FiUserPlus,
  FiFilter,
  FiDownload,
  FiEye,
  FiSlash,
  FiCheckCircle,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiUserCheck,
} from "react-icons/fi";

const statusConfig = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    badge:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/10",
  },
  suspended: {
    label: "Suspended",
    dot: "bg-amber-400",
    badge:
      "bg-amber-500/10   text-amber-400   border-amber-500/20   ring-amber-500/10",
  },
  banned: {
    label: "Banned",
    dot: "bg-rose-400",
    badge:
      "bg-rose-500/10    text-rose-400    border-rose-500/20    ring-rose-500/10",
  },
};

const planConfig = {
  platinum: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  gold: "bg-amber-500/15  text-amber-300  border-amber-500/25",
  silver: "bg-slate-500/20  text-slate-300  border-slate-500/30",
  free: "bg-slate-800/60  text-slate-500  border-slate-700/50",
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PlanBadge = ({ plan }) => {
  const p = plan || "free";
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${planConfig[p] || planConfig.free}`}
    >
      {p}
    </span>
  );
};

const Avatar = ({ name, size = "md" }) => {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };
  return (
    <div
      className={`${sizes[size]} rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-500/20 border border-white/8 flex items-center justify-center text-indigo-300 font-black shrink-0`}
    >
      {name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
};

const ActionBtn = ({ onClick, icon: _Icon, color }) => {
  const Icon = _Icon;
  const colors = {
    indigo: "text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10",
    emerald: "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10",
    amber: "text-slate-500 hover:text-amber-400  hover:bg-amber-500/10",
    rose: "text-slate-500 hover:text-rose-400   hover:bg-rose-500/10",
  };
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all ${colors[color]}`}
    >
      <Icon size={15} />
    </button>
  );
};

const districts = [
  "All",
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Bhavnagar",
  "Jamnagar",
  "Junagadh",
  "Gandhinagar",
  "Anand",
  "Bharuch",
  "Navsari",
  "Valsad",
  "Morbi",
  "Mehsana",
  "Patan",
  "Amreli",
  "Porbandar",
];
const plans = ["All", "free", "silver", "gold", "platinum"];

const AdminUsers = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { canManageUsers } = useAdminPermission();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { getParam, setParam, setParams } = useUrlState({
    page: "1",
    search: "",
    district: "All",
    plan: "All",
    date: "",
  });

  const currentPage = parseInt(getParam("page", "1"));
  const searchQuery = getParam("search", "");
  const selectedDistrict = getParam("district", "All");
  const selectedPlan = getParam("plan", "All");
  const dateFilter = getParam("date", "");

  const itemsPerPage = 10;

  const {
    data,
    loading,
    refetch: fetchUsers,
  } = useAdminFetch(
    () =>
      adminService.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        district: selectedDistrict !== "All" ? selectedDistrict : undefined,
        plan: selectedPlan !== "All" ? selectedPlan : undefined,
        date: dateFilter || undefined,
      }),
    [currentPage, searchQuery, selectedDistrict, selectedPlan, dateFilter],
  );

  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminService.updateUserStatus(id, status);
      toast.success(`User status updated to ${status}`);
      fetchUsers();
    } catch {
      toast.error("Status update failed");
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete User",
      description:
        "Are you sure you want to delete this user permanently? This action cannot be undone.",
      confirmLabel: "Delete Permanently",
      isDanger: true,
    });

    if (!isConfirmed) return;

    try {
      await adminService.deleteContent("user", id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch {
      toast.error("Deletion failed");
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      toast.loading("Starting impersonation...", { id: "impersonate" });
      const res = await adminService.impersonateUser(userId);

      // Store the impersonation token and info
      localStorage.setItem("impersonationToken", res.data.token);
      localStorage.setItem("impersonatedUser", JSON.stringify(res.data.user));

      toast.success(res.data.message, { id: "impersonate" });

      // Redirect to home page in "impersonation mode"
      window.location.href = "/";
    } catch (err) {
      toast.error(err.response?.data?.message || "Impersonation failed", {
        id: "impersonate",
      });
    }
  };

  const exportToCSV = async () => {
    try {
      toast.loading("Generating export...", { id: "export" });
      const res = await adminService.exportUsersCSV({
        search: searchQuery || undefined,
        status: undefined,
        plan: selectedPlan !== "All" ? selectedPlan : undefined,
        district: selectedDistrict !== "All" ? selectedDistrict : undefined,
        date: dateFilter || undefined,
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `users_export_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded!", { id: "export" });
    } catch {
      toast.error("Export failed", { id: "export" });
    }
  };

  const handlePageChange = (page) => {
    setParam("page", page.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (val) => {
    setParam("search", val, { debounce: 300 });
    setParam("page", "1");
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedUsers.length === 0) return;
    const isConfirmed = await confirm({
      title: `Bulk ${status} Users`,
      description: `Are you sure you want to ${status} ${selectedUsers.length} selected users?`,
      confirmLabel: `${status.charAt(0).toUpperCase() + status.slice(1)} All`,
      isDanger: status === "banned",
    });
    if (!isConfirmed) return;

    setBulkLoading(true);
    try {
      const res = await adminService.bulkUpdateUserStatus(
        selectedUsers,
        status,
      );
      toast.success(res.data.message);
      setSelectedUsers([]);
      fetchUsers();
    } catch {
      toast.error("Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const hasActiveFilters =
    selectedDistrict !== "All" || selectedPlan !== "All" || dateFilter;

  const renderActions = (user) => (
    <div className="flex items-center gap-0.5">
      <ActionBtn
        onClick={() => navigate(`/admin/user/${user._id}`)}
        icon={FiEye}
        color="indigo"
      />
      {user.status !== "active" ? (
        <ActionBtn
          onClick={() => handleUpdateStatus(user._id, "active")}
          icon={FiCheckCircle}
          color="emerald"
        />
      ) : (
        <>
          <ActionBtn
            onClick={() => handleUpdateStatus(user._id, "suspended")}
            icon={FiSlash}
            color="amber"
          />
          <ActionBtn
            onClick={() => handleUpdateStatus(user._id, "banned")}
            icon={FiX}
            color="rose"
          />
        </>
      )}
      {canManageUsers && (
        <ActionBtn
          onClick={() => handleDelete(user._id)}
          icon={FiTrash2}
          color="rose"
        />
      )}
      <ActionBtn
        onClick={() => handleImpersonate(user._id)}
        icon={FiUserCheck}
        color="indigo"
      />
    </div>
  );

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FiUsers className="text-indigo-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              User Management
            </h2>
          </div>
         
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
              bg-slate-800/60 border border-slate-700/50 text-slate-400
              hover:bg-slate-700/60 hover:text-slate-200 hover:border-slate-600/60 transition-all"
          >
            <FiDownload size={14} /> Export CSV
          </button>
          {canManageUsers && (
            <button
              onClick={() => navigate("/admin/register")}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                bg-indigo-600 text-white border border-indigo-500/50
                hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              <FiUserPlus size={14} /> Add Admin
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by name, email, phone or ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4
                text-slate-200 text-sm placeholder:text-slate-600
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              showFilters
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
            }`}
          >
            <FiFilter size={14} />
            <span className="hidden xs:inline">Filters</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full ring-2 ring-slate-900" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900/40 border border-slate-700/40 rounded-2xl">
            {[
              {
                label: "District",
                value: selectedDistrict,
                onChange: (val) => setParams({ district: val, page: "1" }),
                options: districts,
              },
              {
                label: "Plan",
                value: selectedPlan,
                onChange: (val) => setParams({ plan: val, page: "1" }),
                options: plans,
                cap: true,
              },
            ].map(({ label, value, onChange, options, cap }) => (
              <div key={label}>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  {label}
                </label>
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300
                    outline-none focus:border-indigo-500/60 transition-all appearance-none cursor-pointer"
                >
                  {options.map((o) => (
                    <option key={o} value={o}>
                      {cap ? o.charAt(0).toUpperCase() + o.slice(1) : o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Join Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setParams({ date: e.target.value, page: "1" })}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300
                  outline-none focus:border-indigo-500/60 transition-all"
              />
            </div>
            {hasActiveFilters && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={() => {
                    setParams({
                      district: "All",
                      plan: "All",
                      date: "",
                      page: "1",
                    });
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-bold
                    bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/10 transition-all"
                >
                  <FiX size={12} /> Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-in fade-in">
          <span className="text-xs font-bold text-indigo-300 px-2">
            {selectedUsers.length} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction("active")}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            >
              <FiCheckCircle className="inline mr-1" size={11} /> Activate
            </button>
            <button
              onClick={() => handleBulkAction("suspended")}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-all disabled:opacity-50"
            >
              <FiSlash className="inline mr-1" size={11} /> Suspend
            </button>
            <button
              onClick={() => handleBulkAction("banned")}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-all disabled:opacity-50"
            >
              <FiX className="inline mr-1" size={11} /> Ban
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-1">
            <FiSearch size={22} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-bold">No users found</p>
          <p className="text-slate-600 text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((user) => (
              <div
                key={user._id}
                className="group bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/25 hover:bg-slate-800/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={user.name} />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-100 text-sm truncate leading-tight">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email}
                      </p>
                      {user.phoneNumber && (
                        <p className="text-[10px] text-slate-600 truncate">
                          {user.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={user.status || "active"} />
                </div>

                <div className="flex items-center justify-between mb-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={user.subscription?.plan} />
                    {user.district && (
                      <span className="text-slate-500 font-medium">
                        {user.district}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-600 font-medium">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3 text-[10px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    Last Login:{" "}
                    {user.lastLoginDate
                      ? new Date(user.lastLoginDate).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-white/4">
                  {renderActions(user)}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block rounded-2xl border border-slate-700/40 overflow-hidden bg-slate-900/30">
            <table className="w-full text-left min-w-180">
              <thead>
                <tr className="border-b border-slate-700/40 bg-slate-950/30">
                  <th className="px-3 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === users.length &&
                        users.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30 cursor-pointer"
                    />
                  </th>
                  {[
                    "User",
                    "Status",
                    "Plan",
                    "Location",
                    "Joined",
                    "Last Login",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 ${
                        i === 6
                          ? "text-right"
                          : i === 4 || i === 5
                            ? "text-center"
                            : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr
                    key={user._id}
                    className={`group border-b border-white/3 hover:bg-indigo-500/3 transition-colors ${
                      idx === users.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-3 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleSelectUser(user._id)}
                        className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 text-sm truncate group-hover:text-indigo-300 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status || "active"} />
                    </td>

                    <td className="px-5 py-3.5">
                      <PlanBadge plan={user.subscription?.plan} />
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-300">
                        {user.district || "—"}
                      </p>
                      {user.locationName && (
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate max-w-32.5">
                          {user.locationName}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <p className="text-xs font-bold text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {new Date(user.createdAt).getFullYear()}
                      </p>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <p className="text-xs font-bold text-slate-400">
                        {user.lastLoginDate
                          ? new Date(user.lastLoginDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                      {user.lastLoginDate && (
                        <p className="text-[10px] text-slate-600">
                          {new Date(user.lastLoginDate).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {renderActions(user)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalUsers > itemsPerPage && (
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700/40">
              <p className="text-xs text-slate-600 order-2 sm:order-1">
                Showing{" "}
                <span className="text-slate-300 font-bold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                –
                <span className="text-slate-300 font-bold">
                  {Math.min(currentPage * itemsPerPage, totalUsers)}
                </span>{" "}
                of{" "}
                <span className="text-slate-300 font-bold">{totalUsers}</span>{" "}
                users
              </p>

              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700/50
                    text-slate-500 hover:text-white hover:bg-slate-800 hover:border-slate-600
                    disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft size={15} />
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let num;
                    if (totalPages <= 5) {
                      num = i + 1;
                    } else if (currentPage <= 3) {
                      num = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      num = totalPages - 4 + i;
                    } else {
                      num = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={num}
                        onClick={() => handlePageChange(num)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                          currentPage === num
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                            : "border-slate-700/50 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700/50
                    text-slate-500 hover:text-white hover:bg-slate-800 hover:border-slate-600
                    disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
