import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiTag,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiPercent,
  FiClock,
  FiBarChart2,
} from "react-icons/fi";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalActive: 0, totalUsed: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discount: 0,
    discountType: "percentage",
    expiryDate: "",
    usageLimit: 100,
    businessId: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCoupons();
      setCoupons(response.data.coupons);
      setStats(response.data.stats);
    } catch (error) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminService.toggleCouponStatus(id);
      toast.success("Status updated");
      fetchCoupons();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await adminService.deleteCoupon(id);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await adminService.updateCoupon(editingCoupon._id, formData);
        toast.success("Coupon updated");
      } else {
        await adminService.createCoupon(formData);
        toast.success("Coupon created");
      }
      setIsModalOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FiTag className="text-indigo-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Coupon Management
            </h2>
          </div>
         
        </div>

        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData({
              code: "",
              discount: 0,
              discountType: "percentage",
              expiryDate: "",
              usageLimit: 100,
              businessId: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
        >
          <FiPlus size={16} /> Create Coupon
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Active Coupons",
            value: stats.totalActive,
            icon: FiCheckCircle,
            color: "emerald",
          },
          {
            label: "Total Usage",
            value: stats.totalUsed,
            icon: FiBarChart2,
            color: "blue",
          },
          {
            label: "Expired",
            value: stats.totalExpired,
            icon: FiClock,
            color: "rose",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-400`}
            >
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-xl font-black text-white">{s.value || 0}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-500">No coupons active</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon._id}
              className="group bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 bg-${coupon.status === "active" ? "emerald" : "rose"}-500`}
              />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
                    {coupon.code}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {coupon.businessId?.businessName || "Global"}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                    coupon.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {coupon.status}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold flex items-center gap-2">
                    <FiPercent size={14} /> Discount
                  </span>
                  <span className="text-white font-black">
                    {coupon.discount}
                    {coupon.discountType === "percentage" ? "%" : "₹"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold flex items-center gap-2">
                    <FiBarChart2 size={14} /> Usage
                  </span>
                  <span className="text-white font-black">
                    {coupon.usedCount} / {coupon.usageLimit}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold flex items-center gap-2">
                    <FiClock size={14} /> Expires
                  </span>
                  <span className="text-slate-200 font-bold">
                    {new Date(coupon.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleToggleStatus(coupon._id)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    coupon.status === "active"
                      ? "bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                      : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  {coupon.status === "active" ? "Disable" : "Enable"}
                </button>
                <button
                  aria-label="Edit"
                  onClick={() => {
                    setEditingCoupon(coupon);
                    setFormData({
                      code: coupon.code,
                      discount: coupon.discount,
                      discountType: coupon.discountType,
                      expiryDate: coupon.expiryDate.split("T")[0],
                      usageLimit: coupon.usageLimit,
                      businessId: coupon.businessId?._id || "",
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => handleDelete(coupon._id)}
                  className="p-2 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/10 transition-all"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="coupon-code" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Code
                </label>
                <input
                  id="coupon-code"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="coupon-discount" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Discount
                  </label>
                  <input
                    id="coupon-discount"
                    type="number"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label htmlFor="coupon-type" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Type
                  </label>
                  <select
                    id="coupon-type"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none cursor-pointer"
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="coupon-expiry" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Expiry Date
                  </label>
                  <input
                    id="coupon-expiry"
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label htmlFor="coupon-limit" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Usage Limit
                  </label>
                  <input
                    id="coupon-limit"
                    type="number"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="coupon-submit-btn"
                  className="flex-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {editingCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCoupons;
