import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { FiTrash2, FiSearch, FiExternalLink, FiStar } from "react-icons/fi";

const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await adminService.getBusinesses();
      setBusinesses(response.data);
    } catch (error) {
      toast.error("Failed to fetch businesses");
      if (error.response?.status === 401) {
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this business?"))
      return;

    try {
      await adminService.deleteContent("business", id);
      toast.success("Business deleted successfully");
      fetchBusinesses();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const filteredBusinesses = businesses.filter(
    (biz) =>
      biz.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.mainCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
            Business Management
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Review and moderate registered businesses on Lokonomy
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card-bg/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-slate-200"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="min-h-100 flex items-center justify-center text-indigo-400">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse text-lg">
              Scanning platform businesses...
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card-bg/50 border border-slate-700/50 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-225">
              <thead className="bg-dark-bg/80 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-5 font-semibold">Business</th>
                  <th className="px-8 py-5 font-semibold">Category</th>
                  <th className="px-8 py-5 font-semibold">Owner Info</th>
                  <th className="px-8 py-5 font-semibold">Stats</th>
                  <th className="px-8 py-5 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredBusinesses.map((biz) => (
                  <tr
                    key={biz._id}
                    className="hover:bg-slate-800/20 transition-all group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold border border-orange-500/20 group-hover:scale-110 transition-transform overflow-hidden">
                          {biz.logo ? (
                            <img
                              src={biz.logo}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            biz.businessName?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">
                            {biz.businessName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="flex items-center gap-0.5 text-xs text-yellow-500/80 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                              <FiStar size={10} fill="currentColor" />{" "}
                              {biz.rating || "0.0"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {biz._id.slice(-8)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase w-fit tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {biz.mainCategory}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {biz.subCategory}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-semibold text-slate-300">
                        {biz.ownerName}
                      </p>
                      <p className="text-xs text-indigo-400/60">
                        {biz.contactNumber}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          {biz.visits || 0} Visits
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          {biz.reviews?.length || 0} Reviews
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/business/${biz._id}`)}
                          className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                          title="View Live"
                        >
                          <FiExternalLink size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(biz._id)}
                          className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete Business"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBusinesses.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-8 py-20 text-center text-slate-500 italic"
                    >
                      No businesses found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBusinesses;
