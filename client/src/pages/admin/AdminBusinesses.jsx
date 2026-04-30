import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { FiTrash2, FiSearch,  FiExternalLink,
  FiStar,
  FiFilter,
  FiPlus,
  FiBriefcase,
} from "react-icons/fi";
import useAdminFetch from "../../hooks/useAdminFetch";
import { useConfirm } from "../../context/ConfirmContext";
import { TableSkeleton } from "../../components/admin/Skeleton";
import { useUrlState } from "../../hooks/useUrlState";

const AdminBusinesses = () => {
  const { getParam, setParam } = useUrlState({ search: "" });
  const searchQuery = getParam("search", "");
  const navigate = useNavigate();
  const confirm = useConfirm();

  const fetchFn = useCallback(() => adminService.getBusinesses(), []);
  const { data, loading, refetch } = useAdminFetch(fetchFn);
  const businesses = data || [];

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Business",
      message: "Are you sure you want to delete this business? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
    });

    if (!isConfirmed) return;

    try {
      await adminService.deleteContent("business", id);
      toast.success("Business deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const filteredBusinesses = businesses.filter(
    (biz) =>
      biz.businessName?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      biz.mainCategory?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      biz.ownerName?.toLowerCase()?.includes(searchQuery.toLowerCase()),
  );


  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-white">
            Business Management
          </h2>
         
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search businesses..."
              defaultValue={searchQuery}
              onChange={(e) => setParam("search", e.target.value, { debounce: 500 })}
              className="w-full bg-card-bg/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-slate-200"
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
           <TableSkeleton rows={10} cols={5} />
        </div>
      ) : (
        <>
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBusinesses.map((biz) => (
              <div key={biz._id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-4 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold border border-orange-500/20">
                      {biz.logo ? <img src={biz.logo} alt="" className="w-full h-full object-cover rounded-lg" /> : biz.businessName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{biz.businessName}</h4>
                      <p className="text-[10px] text-indigo-400 font-medium">{biz.mainCategory}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded text-[10px] font-black">
                     <FiStar size={10} fill="currentColor" /> {biz.rating || "0.0"}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-medium border-y border-white/5 py-2 px-1">
                   <div className="flex flex-col">
                      <span className="text-slate-600 uppercase text-[8px] font-black tracking-widest">Owner</span>
                      <span className="text-slate-300 truncate max-w-20">{biz.ownerName}</span>
                   </div>
                   <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                         <span className="text-slate-200 font-bold">{biz.visits || 0}</span>
                         <span className="text-slate-600 uppercase text-[8px] font-black tracking-tighter">Visits</span>
                      </div>
                      <div className="flex flex-col items-center">
                         <span className="text-slate-200 font-bold">{biz.reviews?.length || 0}</span>
                         <span className="text-slate-600 uppercase text-[8px] font-black tracking-tighter">Reviews</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                   <button onClick={() => navigate(`/admin/business/${biz._id}`)} aria-label="View Business" className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <FiExternalLink size={16} />
                   </button>
                   <button onClick={() => handleDelete(biz._id)} aria-label="Delete Business" className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                      <FiTrash2 size={16} />
                   </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-225">
              <thead className="bg-slate-950/20 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4 text-center">Analytics</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBusinesses.map((biz) => (
                  <tr key={biz._id} className="hover:bg-indigo-500/1 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/5 flex items-center justify-center text-orange-400 font-bold border border-orange-500/10">
                          {biz.logo ? <img src={biz.logo} alt="" className="w-full h-full object-cover rounded-lg" /> : biz.businessName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-sm group-hover:text-amber-500 transition-colors">{biz.businessName}</p>
                          <p className="text-[10px] text-slate-500">ID: {biz._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {biz.mainCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                      {biz.ownerName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-4 text-[10px] font-bold">
                        <span className="text-slate-400">{biz.visits || 0} Visits</span>
                        <span className="text-slate-400">{biz.reviews?.length || 0} Reviews</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => navigate(`/admin/business/${biz._id}`)} aria-label="View Business" className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 rounded-lg">
                          <FiExternalLink size={17} />
                        </button>
                        <button onClick={() => handleDelete(biz._id)} aria-label="Delete Business" className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg">
                          <FiTrash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBusinesses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <FiBriefcase className="text-4xl mb-4 opacity-20" />
              <p className="text-sm font-medium">No businesses found matching your criteria</p>
            </div>
          )}
        </>

      )}
    </AdminLayout>
  );
};

export default AdminBusinesses;
