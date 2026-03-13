import React, { useState, useEffect } from "react";
import { growthService } from "../../services";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, Plus, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const CouponManager = ({ businessId }) => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount: "",
    discountType: "percentage",
    expiryDate: "",
    usageLimit: 100,
  });
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await growthService.createCoupon({ ...formData, businessId });
      toast.success("Coupon created successfully!");
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await growthService.redeemCoupon({ code: verifyCode, businessId });
      toast.success(res.data.message);
      setVerifyCode("");
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="text-yellow-500" /> Merchant Coupons
          </h2>
          <p className="text-gray-400 text-sm">
            Boost sales with local discounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-400"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus size={18} /> New Coupon
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-4 rounded-xl mb-6 grid grid-cols-2 gap-4"
        >
          <div className="col-span-2 md:col-span-1">
            <label className="block text-gray-400 text-sm mb-1">
              Coupon Code (e.g., LOKO20)
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white uppercase"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="col-span-1">
            <label className="block text-gray-400 text-sm mb-1">
              Discount Value
            </label>
            <input
              type="number"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
              value={formData.discount}
              onChange={(e) =>
                setFormData({ ...formData, discount: e.target.value })
              }
            />
          </div>
          <div className="col-span-1">
            <label className="block text-gray-400 text-sm mb-1">Type</label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
              value={formData.discountType}
              onChange={(e) =>
                setFormData({ ...formData, discountType: e.target.value })
              }
            >
              <option value="percentage">% Off</option>
              <option value="fixed">Flat Amount</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-gray-400 text-sm mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
          </div>
          <div className="col-span-1">
            <label className="block text-gray-400 text-sm mb-1">
              Usage Limit
            </label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
              value={formData.usageLimit}
              onChange={(e) =>
                setFormData({ ...formData, usageLimit: e.target.value })
              }
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="col-span-2 bg-white text-black py-2 rounded-lg font-bold hover:bg-gray-200"
          >
            {loading ? "Creating..." : "Save Coupon"}
          </button>
        </form>
      )}

      <div className="bg-gray-800 p-4 rounded-xl mb-6">
        <h3 className="text-white font-bold mb-3 text-sm">Verify / Redeem Coupon</h3>
        <form onSubmit={handleVerify} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Coupon Code"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white uppercase"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={verifying}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-500 transition-all disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "Redeem"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon._id}
            className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center group relative overflow-hidden"
          >
            <div className="flex gap-4 items-center">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG
                  value={JSON.stringify({ code: coupon.code, businessId })}
                  size={60}
                />
              </div>
              <div>
                <h3 className="text-white font-bold">{coupon.code}</h3>
                <p className="text-sm text-yellow-500 font-medium">
                  {coupon.discountType === "percentage"
                    ? `${coupon.discount}% Off`
                    : `₹${coupon.discount} Off`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Used: {coupon.usedCount}/{coupon.usageLimit}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  coupon.status === "active"
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {coupon.status}
              </span>
              <p className="text-[10px] text-gray-400">
                Exp: {new Date(coupon.expiryDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {coupons.length === 0 && !showForm && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No active coupons. Create one to start attracting customers!
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponManager;
