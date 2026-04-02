import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
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

const ActionBtn = ({ onClick, icon: Icon, color }) => {
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedPlan, setSelectedPlan] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminService.getUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch users");
      if (error.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

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
    if (
      !window.confirm("Are you sure you want to delete this user permanently?")
    )
      return;
    try {
      await adminService.deleteContent("user", id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch {
      toast.error("Deletion failed");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "District",
      "Plan",
      "Status",
      "Joined Date",
    ];
    const rows = filteredUsers.map((u) => [
      u._id,
      u.name,
      u.email,
      u.phoneNumber || "N/A",
      u.district || "N/A",
      u.subscription?.plan || "free",
      u.status || "active",
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `users_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const districts = [
    "All",
    ...new Set(users.map((u) => u.district).filter(Boolean)),
  ];
  const plans = ["All", "free", "silver", "gold", "platinum"];

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.phoneNumber?.includes(searchQuery) ||
      user._id?.includes(searchQuery);
    const matchesDistrict =
      selectedDistrict === "All" || user.district === selectedDistrict;
    const matchesPlan =
      selectedPlan === "All" || user.subscription?.plan === selectedPlan;
    let matchesDate = true;
    if (dateFilter) {
      const joinDate = new Date(user.createdAt).toISOString().split("T")[0];
      matchesDate = joinDate === dateFilter;
    }
    return matchesSearch && matchesDistrict && matchesPlan && matchesDate;
  });

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDistrict, selectedPlan, dateFilter]);

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
      <ActionBtn
        onClick={() => handleDelete(user._id)}
        icon={FiTrash2}
        color="rose"
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
          <p className="text-slate-500 text-sm pl-10.5">
            {loading
              ? "Loading…"
              : `${users.length} registered users on the platform`}
          </p>
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
          <button
            onClick={() => navigate("/admin/register")}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
              bg-indigo-600 text-white border border-indigo-500/50
              hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            <FiUserPlus size={14} /> Add Admin
          </button>
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
              placeholder="Search by name, email, phone or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                onChange: setSelectedDistrict,
                options: districts,
              },
              {
                label: "Plan",
                value: selectedPlan,
                onChange: setSelectedPlan,
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
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300
                  outline-none focus:border-indigo-500/60 transition-all"
              />
            </div>
            {hasActiveFilters && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedDistrict("All");
                    setSelectedPlan("All");
                    setDateFilter("");
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm font-medium animate-pulse">
            Fetching users…
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
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
            {currentUsers.map((user) => (
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
                  {[
                    "User",
                    "Status",
                    "Plan",
                    "Location",
                    "Joined",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 ${
                        i === 5 ? "text-right" : i === 4 ? "text-center" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, idx) => (
                  <tr
                    key={user._id}
                    className={`group border-b border-white/3 hover:bg-indigo-500/3 transition-colors ${
                      idx === currentUsers.length - 1 ? "border-b-0" : ""
                    }`}
                  >
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

          {filteredUsers.length > itemsPerPage && (
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700/40">
              <p className="text-xs text-slate-600 order-2 sm:order-1">
                Showing{" "}
                <span className="text-slate-300 font-bold">
                  {indexOfFirstUser + 1}
                </span>
                –
                <span className="text-slate-300 font-bold">
                  {Math.min(indexOfLastUser, filteredUsers.length)}
                </span>{" "}
                of{" "}
                <span className="text-slate-300 font-bold">
                  {filteredUsers.length}
                </span>{" "}
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

                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  const near =
                    Math.abs(p - currentPage) <= 1 ||
                    p === 1 ||
                    p === totalPages;
                  const isDot =
                    !near && (p === currentPage - 2 || p === currentPage + 2);
                  if (!near && !isDot) return null;
                  if (isDot)
                    return (
                      <span key={p} className="text-slate-700 text-xs px-0.5">
                        ···
                      </span>
                    );
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                        currentPage === p
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                          : "border-slate-700/50 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

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
