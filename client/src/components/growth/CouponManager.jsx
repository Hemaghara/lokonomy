import React, { useState, useEffect } from "react";
import { growthService } from "../../services";
import { QRCodeSVG } from "qrcode.react";
import {
  Ticket,
  Plus,
  Trash2,
  CheckCircle,
  Edit3,
  X,
  Clock,
  Users,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const emptyForm = {
  code: "",
  discount: "",
  discountType: "percentage",
  expiryDate: "",
  usageLimit: 100,
  status: "active",
};

const CouponManager = ({ businessId }) => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, [businessId]);

  const fetchCoupons = async () => {
    try {
      const res = await growthService.getCoupons(businessId);
      setCoupons(res.data);
    } catch (err) {
      console.error("Error fetching coupons:", err);
    }
  };

  const openCreate = () => {
    setEditingCoupon(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discount,
      discountType: coupon.discountType,
      expiryDate: new Date(coupon.expiryDate).toISOString().split("T")[0],
      usageLimit: coupon.usageLimit,
      status: coupon.status,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCoupon(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCoupon) {
        await growthService.updateCoupon(editingCoupon._id, formData);
        toast.success("Coupon updated successfully!");
      } else {
        await growthService.createCoupon({ ...formData, businessId });
        toast.success("Coupon created successfully!");
      }
      closeForm();
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (couponId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-red-400">
              <Trash2 size={16} />
            </span>
            <p className="text-sm font-semibold text-white">
              Delete this coupon?
            </p>
          </div>
          <p className="text-xs text-gray-400">
            The coupon will be permanently removed.
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setDeletingId(couponId);
                try {
                  await growthService.deleteCoupon(couponId);
                  toast.success("Coupon deleted successfully");
                  fetchCoupons();
                } catch (err) {
                  toast.error(err.response?.data?.message || "Delete failed");
                } finally {
                  setDeletingId(null);
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        style: {
          background: "#1f2937",
          border: "1px solid #374151",
          padding: "16px",
          color: "#fff",
          minWidth: "280px",
        },
      },
    );
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await growthService.redeemCoupon({
        code: verifyCode,
        businessId,
      });
      toast.success(res.data.message);
      setVerifyCode("");
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const isExpired = (coupon) => new Date(coupon.expiryDate) < new Date();

  const getStatusColor = (coupon) => {
    if (isExpired(coupon) || coupon.status === "expired")
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (coupon.status === "disabled")
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    return "bg-green-500/10 text-green-400 border border-green-500/20";
  };

  const getStatusLabel = (coupon) => {
    if (isExpired(coupon)) return "Expired";
    if (coupon.status === "disabled") return "Limit Reached";
    return "Active";
  };

  const activeCoupons = coupons.filter(
    (c) => c.status === "active" && !isExpired(c),
  );
  const inactiveCoupons = coupons.filter(
    (c) => c.status !== "active" || isExpired(c),
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="text-yellow-500" size={22} /> Merchant Coupons
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Create &amp; manage discount coupons for customers
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all active:scale-95"
          >
            <Plus size={16} /> New Coupon
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            key="coupon-inline-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-gray-800/70 border border-yellow-500/25 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <Tag size={15} className="text-yellow-400" />
                    {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {editingCoupon
                      ? `Editing: ${editingCoupon.code}`
                      : "Fill in the details below to set up a new discount coupon"}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="p-1.5 rounded-lg bg-gray-700/60 hover:bg-gray-600 text-gray-400 hover:text-white transition-all"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE20"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono tracking-widest uppercase focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-gray-600"
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
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="20"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all placeholder:text-gray-600"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                      Discount Type
                    </label>
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value,
                        })
                      }
                    >
                      <option value="percentage">% Percentage Off</option>
                      <option value="fixed">₹ Flat Amount Off</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expiryDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, usageLimit: e.target.value })
                      }
                    />
                  </div>
                </div>

                {editingCoupon && (
                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-all active:scale-95"
                  >
                    {loading
                      ? "Saving..."
                      : editingCoupon
                        ? "Update Coupon"
                        : "Create Coupon"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {coupons.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Total", value: coupons.length, color: "text-white" },
            {
              label: "Active",
              value: activeCoupons.length,
              color: "text-green-400",
            },
            {
              label: "Expired / Used",
              value: inactiveCoupons.length,
              color: "text-red-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
          <CheckCircle size={14} className="text-green-400" /> Verify / Redeem
          Coupon
        </h3>
        <form onSubmit={handleVerify} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Coupon Code"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white uppercase placeholder:normal-case placeholder:text-gray-600 focus:border-yellow-500/50 outline-none transition-all"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={verifying || !verifyCode}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-500 transition-all disabled:opacity-50 active:scale-95"
          >
            {verifying ? "..." : "Redeem"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {coupons.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Ticket size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No coupons yet. Create one to attract customers!
            </p>
          </div>
        )}

        {activeCoupons.map((coupon) => (
          <CouponCard
            key={coupon._id}
            coupon={coupon}
            businessId={businessId}
            onEdit={() => openEdit(coupon)}
            onDelete={() => handleDelete(coupon._id)}
            isDeleting={deletingId === coupon._id}
            statusClass={getStatusColor(coupon)}
            statusLabel={getStatusLabel(coupon)}
          />
        ))}

        {inactiveCoupons.length > 0 && (
          <>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold pt-2">
              Expired / Disabled
            </p>
            {inactiveCoupons.map((coupon) => (
              <CouponCard
                key={coupon._id}
                coupon={coupon}
                businessId={businessId}
                onEdit={() => openEdit(coupon)}
                onDelete={() => handleDelete(coupon._id)}
                isDeleting={deletingId === coupon._id}
                statusClass={getStatusColor(coupon)}
                statusLabel={getStatusLabel(coupon)}
                dimmed
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const CouponCard = ({
  coupon,
  businessId,
  onEdit,
  onDelete,
  isDeleting,
  statusClass,
  statusLabel,
  dimmed,
}) => {
  const usagePercent = Math.min(
    (coupon.usedCount / coupon.usageLimit) * 100,
    100,
  );
  const isWarn = usagePercent >= 80;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
      className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex gap-4 items-start hover:border-gray-600/60 transition-all group"
    >
      <div className="bg-white p-1.5 rounded-lg shrink-0">
        <QRCodeSVG
          value={JSON.stringify({ code: coupon.code, businessId })}
          size={52}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-white font-bold font-mono tracking-widest text-sm">
            {coupon.code}
          </h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>

        <p className="text-yellow-400 font-semibold text-sm mt-0.5">
          {coupon.discountType === "percentage"
            ? `${coupon.discount}% Off`
            : `₹${coupon.discount} Off`}
        </p>

        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Users size={9} /> {coupon.usedCount}/{coupon.usageLimit} used
            </span>
            <span className="flex items-center gap-1">
              <Clock size={9} /> Exp:{" "}
              {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isWarn ? "bg-orange-400" : "bg-yellow-500"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg bg-gray-700 hover:bg-blue-600 text-gray-400 hover:text-white transition-all"
          title="Edit Coupon"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 rounded-lg bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white transition-all disabled:opacity-40"
          title="Delete Coupon"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default CouponManager;
