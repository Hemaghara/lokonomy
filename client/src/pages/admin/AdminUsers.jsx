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
  FiMapPin,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

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
      if (error.response?.status === 401) {
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminService.updateUserStatus(id, status);
      toast.success(`User status updated to ${status}`);
      fetchUsers();
    } catch (error) {
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
    } catch (error) {
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

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
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
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDistrict, selectedPlan, dateFilter]);

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
            User Management
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Monitor and manage registered users on the platform
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none justify-center bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-4 py-3 rounded-xl hover:bg-emerald-600/20 transition-all flex items-center gap-2 text-sm font-bold"
          >
            <FiDownload /> Export
          </button>
          <button
            onClick={() => navigate("/admin/register")}
            className="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-50 hover:bg-opacity-10 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 whitespace-nowrap text-sm font-bold"
          >
            <FiUserPlus /> Add Admin
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card-bg/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-slate-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold ${showFilters ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"}`}
          >
            <FiFilter /> Filters{" "}
            {(selectedDistrict !== "All" ||
              selectedPlan !== "All" ||
              dateFilter) && (
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 outline-none focus:border-indigo-500"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Member Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 outline-none focus:border-indigo-500"
              >
                {plans.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Join Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 outline-none focus:border-indigo-500 w-full"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                onClick={() => {
                  setSelectedDistrict("All");
                  setSelectedPlan("All");
                  setDateFilter("");
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium bg-rose-500/5 px-3 py-1.5 rounded-lg border border-rose-500/10"
              >
                <FiX /> Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="min-h-100 flex items-center justify-center text-indigo-400">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse text-lg">
              Fetching users...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View (Data-Dense & Efficient) */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUsers.map((user) => (
              <div key={user._id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-4 hover:border-indigo-500/30 transition-all">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-white/5">
                           {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-bold text-white text-sm truncate">{user.name}</h4>
                           <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        user.status === "banned" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                        user.status === "suspended" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                        {user.status || "Active"}
                    </span>
                 </div>

                 <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
                    <div className="flex flex-col">
                        <span className="text-slate-600 uppercase text-[8px] font-black tracking-widest">Plan</span>
                        <span className="text-slate-200">{user.subscription?.plan || "Free"}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-slate-600 uppercase text-[8px] font-black tracking-widest">District</span>
                        <span className="text-slate-200">{user.district || "N/A"}</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <p className="text-[9px] text-slate-500 font-bold">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/admin/user/${user._id}`)} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20">
                           <FiEye size={16} />
                        </button>
                        {user.status !== "active" ? (
                           <button onClick={() => handleUpdateStatus(user._id, "active")} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20">
                              <FiCheckCircle size={16} />
                           </button>
                        ) : (
                           <>
                              <button onClick={() => handleUpdateStatus(user._id, "suspended")} className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20">
                                 <FiSlash size={16} />
                              </button>
                              <button onClick={() => handleUpdateStatus(user._id, "banned")} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20">
                                 <FiX size={16} />
                              </button>
                           </>
                        )}
                        <button onClick={() => handleDelete(user._id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20">
                           <FiTrash2 size={16} />
                        </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Efficient & Data-Dense) */}
          <div className="hidden lg:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-275">
              <thead className="bg-slate-950/20 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-white/3">
                {currentUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-indigo-500/1 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-bold border border-white/5">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-sm group-hover:text-indigo-400 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-500 group-hover:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 w-fit border ${
                          user.status === "banned"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : user.status === "suspended"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full ${user.status === "banned" ? "bg-rose-500" : user.status === "suspended" ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                        {user.status || "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase w-fit border ${
                          user.subscription?.plan === "platinum" ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : 
                          user.subscription?.plan === "gold" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : 
                          "bg-slate-800 text-slate-500 border-slate-700/50"
                        }`}
                      >
                        {user.subscription?.plan || "free"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-300">
                        {user.district || "N/A"}
                      </p>
                      <p className="text-[10px] text-slate-500 opacity-60">
                        {user.locationName || "No Location"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs text-slate-400 font-bold">
                        {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => navigate(`/admin/user/${user._id}`)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
                          <FiEye size={17} />
                        </button>
                        {user.status !== "active" ? (
                          <button onClick={() => handleUpdateStatus(user._id, "active")} className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                            <FiCheckCircle size={17} />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => handleUpdateStatus(user._id, "suspended")} className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg">
                              <FiSlash size={17} />
                            </button>
                            <button onClick={() => handleUpdateStatus(user._id, "banned")} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                              <FiX size={17} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(user._id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                          <FiTrash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-8 py-20 text-center text-slate-500 italic"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <FiSearch size={40} className="text-slate-700" />
                        <p>No users found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > itemsPerPage && (
            <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-700/50 bg-slate-900/20">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-300">
                  {indexOfFirstUser + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-300">
                  {Math.min(indexOfLastUser, filteredUsers.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-300">
                  {filteredUsers.length}
                </span>{" "}
                users
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 sm:px-4 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
                    currentPage === 1
                      ? "opacity-30 cursor-not-allowed border-slate-700 text-slate-600"
                      : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                  aria-label="Previous Page"
                >
                  <FiChevronLeft className="text-lg" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    if (totalPages > 3) { // Lower threshold for mobile
                      if (
                        pageNum !== 1 &&
                        pageNum !== totalPages &&
                        (pageNum < currentPage - 1 || pageNum > currentPage + 1)
                      ) {
                        if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        )
                          return (
                            <span key={pageNum} className="px-0.5 text-slate-600 text-[10px]">
                              ..
                            </span>
                          );
                        return null;
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                          currentPage === pageNum
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 sm:px-4 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
                    currentPage === totalPages
                      ? "opacity-30 cursor-not-allowed border-slate-700 text-slate-600"
                      : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                  aria-label="Next Page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <FiChevronRight className="text-lg" />
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
