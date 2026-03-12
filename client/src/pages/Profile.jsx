import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useLocation } from "../context/LocationContext";
import { authService, businessService, jobService } from "../services";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

import {
  HiOutlineArrowUpRight,
  HiOutlineTrash,
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineArrowRightOnRectangle,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineShoppingBag,
  HiOutlineCurrencyRupee,
  HiOutlineCreditCard,
  HiOutlineArrowUpTray,
  HiOutlineUserGroup,
  HiOutlineBookmark,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FiUser, FiMapPin, FiBriefcase, FiPlus } from "react-icons/fi";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, login } = useUser();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    upiId: user?.upiId || "",
    phoneNumber: user?.phoneNumber || "",
    paymentQrCode: user?.paymentQrCode || null,
    bankName: user?.bankName || "",
    ifscCode: user?.ifscCode || "",
    branch: user?.branch || "",
    accountNumber: user?.accountNumber || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        upiId: user.upiId || "",
        phoneNumber: user.phoneNumber || "",
        paymentQrCode: user.paymentQrCode || null,
        bankName: user.bankName || "",
        ifscCode: user.ifscCode || "",
        branch: user.branch || "",
        accountNumber: user.accountNumber || "",
      });
      fetchMyBusinesses();
      fetchAppliedJobs();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "businesses" && user) fetchMyBusinesses();
    if (activeTab === "applications" && user) fetchAppliedJobs();
  }, [activeTab, user]);

  const fetchMyBusinesses = async () => {
    try {
      const response = await businessService.getMyBusinesses();
      setMyBusinesses(response.data);
    } catch (err) {
      console.error("Error fetching businesses:", err);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const response = await jobService.getAppliedJobs();
      setAppliedJobs(response.data);
    } catch (err) {
      console.error("Error fetching applied jobs:", err);
    }
  };


  const handleDeleteBusiness = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this business? This action cannot be undone.",
      )
    )
      return;
    try {
      const response = await businessService.deleteBusiness(id);
      if (response.data.success) {
        toast.success("Business deleted successfully");
        fetchMyBusinesses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete business");
    }
  };

  const handleUpdate = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await authService.updateProfile({
        name: formData.name,
        upiId: formData.upiId,
        phoneNumber: formData.phoneNumber,
        paymentQrCode: formData.paymentQrCode,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode,
        branch: formData.branch,
        accountNumber: formData.accountNumber,
      });
      if (response.data.success) {
        login({ ...user, ...response.data.user });
        toast.success("Profile updated successfully");
      }
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser");
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          const locationName = data.display_name;
          const addr = data.address || {};
          const rawDistrict =
            addr.state_district || addr.county || addr.city || "";
          const district = rawDistrict.replace(/ District/i, "").trim();
          const taluka = (
            addr.suburb ||
            addr.town ||
            addr.village ||
            addr.city_district ||
            ""
          ).trim();

          const updateResponse = await authService.updateProfile({
            latitude,
            longitude,
            locationName,
            district,
            taluka,
            locationPermission: "granted",
          });

          if (updateResponse.data.success) {
            login({ ...user, ...updateResponse.data.user });

            if (district) localStorage.setItem("lokonomy_district", district);
            if (taluka) localStorage.setItem("lokonomy_taluka", taluka);

            toast.success("Location updated successfully");
          }
        } catch (err) {
          toast.error("Failed to update location");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error("Location permission denied");
      },
    );
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <FiUser /> },
    { id: "location", label: "Location", icon: <FiMapPin /> },
    { id: "payments", label: "Payments", icon: <HiOutlineCreditCard /> },
    {
      id: "businesses",
      label: "Businesses",
      icon: <HiOutlineBuildingOffice2 />,
    },
    { id: "jobs", label: "Jobs", icon: <FiBriefcase /> },
    {
      id: "applications",
      label: "My Applications",
      icon: <HiOutlineUserGroup />,
    },
    { id: "orders", label: "Orders", icon: <HiOutlineShoppingBag /> },
    { id: "sales", label: "Sales", icon: <HiOutlineCurrencyRupee /> },
    { id: "membership", label: "Membership", icon: <HiOutlineSparkles /> },
  ];

  const avatarLetter = user?.name?.[0]?.toUpperCase();
  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const label =
    "block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600";
  const btnPrimary =
    "inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all";
  const btnOutline =
    "inline-flex items-center gap-2 bg-[#1a2540] hover:bg-[#1f2d4d] active:scale-[.98] text-slate-300 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all border border-[#1f2a3d]";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        .pr * { font-family: 'DM Sans', sans-serif; }
        .pr select option { background: #111827; color: #e2e8f0; }
        .no-sb::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="pr max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${card} p-5 mb-4`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold select-none shadow-lg shadow-violet-900/40">
                {avatarLetter}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#111827] rounded-full" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-white font-semibold text-lg leading-snug truncate">
                {user?.name}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5 truncate">
                <HiOutlineEnvelope className="shrink-0" />
                {user?.email}
              </p>
              {user?.locationName && (
                <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5 leading-tight">
                  <FiMapPin className="shrink-0 text-violet-400" />
                  <span className="line-clamp-1">{user.locationName}</span>
                </p>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-5 ml-auto">
              <div className="text-center">
                <p className="text-white font-bold text-xl leading-none">
                  {myBusinesses.length}
                </p>
                <p className="text-slate-600 text-[10px] uppercase tracking-wider mt-1">
                  Business
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-[#1f2a3d]"
            >
              <HiOutlineArrowRightOnRectangle className="text-lg" />
            </button>
          </div>
        </motion.div>
        <div className="no-sb flex gap-1 bg-[#111827] border border-[#1f2a3d] rounded-2xl p-1 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className={`${card} p-6`}
            >
              <h2 className="text-white font-semibold text-base mb-1">
                Personal Information
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Update your display name and account details.
              </p>

              <form onSubmit={handleUpdate} className="space-y-4 max-w-sm">
                <div>
                  <label className={label}>Full Name</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className={label}>Email</label>
                  <input
                    type="text"
                    className="w-full bg-[#0d1424]/50 border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-600 cursor-not-allowed outline-none"
                    value={user?.email}
                    disabled
                  />
                </div>
                <button disabled={loading} className={btnPrimary}>
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === "location" && (
            <motion.div
              key="location"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className={`${card} p-6`}
            >
              <h2 className="text-white font-semibold text-base mb-1">
                GPS Location
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Manage your current position for accurate nearby services.
              </p>

              <div className="space-y-6">
                <div className="bg-[#0d1424] border border-[#1f2a3d] rounded-2xl p-4">
                  <p className={label}>Current Saved Location</p>
                  <div className="flex items-start gap-3 mt-1">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                      <FiMapPin className="text-lg" />
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-semibold leading-relaxed">
                        {user?.locationName || "No location saved"}
                      </p>
                      {user?.latitude && (
                        <p className="text-slate-500 text-[11px] font-mono mt-1">
                          {user.latitude.toFixed(6)},{" "}
                          {user.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={refreshLocation}
                    disabled={loading}
                    className={`${btnPrimary} w-full justify-center py-3 text-sm`}
                  >
                    <HiOutlineClock className={loading ? "animate-spin" : ""} />
                    {loading ? "Updating GPS…" : "Update to Current Location"}
                  </button>
                  <p className="text-center text-slate-600 text-[10px] font-medium uppercase tracking-wider">
                    Powered by Browser Geolocation
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className={`${card} p-6`}
            >
              <h2 className="text-white font-semibold text-base mb-1">
                Seller Payment Settings
              </h2>
              <p className="text-slate-500 text-xs mb-6">
                Configure how you want to receive payments from buyers.
              </p>

              <form onSubmit={handleUpdate} className="space-y-4 max-w-sm">
                <div>
                  <label className={label}>UPI ID</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.upiId}
                    onChange={(e) =>
                      setFormData({ ...formData, upiId: e.target.value })
                    }
                    placeholder="e.g. name@upi"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 ml-1">
                    Correct UPI ID is required for direct transfers.
                  </p>
                </div>

                <div>
                  <label className={label}>Phone Number (For Contact)</label>
                  <input
                    type="tel"
                    className={inputCls}
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="e.g. +91 9876543210"
                  />
                </div>

                <div className="pt-4 pb-2 border-t border-slate-800">
                  <h3 className="text-white font-semibold text-sm mb-4">
                    Bank Account Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className={label}>Bank Name</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={formData.bankName}
                        onChange={(e) =>
                          setFormData({ ...formData, bankName: e.target.value })
                        }
                        placeholder="e.g. State Bank of India"
                      />
                    </div>

                    <div>
                      <label className={label}>Account Number</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. 1234567890"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={label}>IFSC Code</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={formData.ifscCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ifscCode: e.target.value,
                            })
                          }
                          placeholder="SBIN0001234"
                        />
                      </div>
                      <div>
                        <label className={label}>Branch Name</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={formData.branch}
                          onChange={(e) =>
                            setFormData({ ...formData, branch: e.target.value })
                          }
                          placeholder="Main Branch"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={label}>Payment QR Code</label>
                  <div className="space-y-3">
                    {formData.paymentQrCode && (
                      <div className="w-32 h-32 bg-white p-1 rounded-xl relative group">
                        <img
                          src={formData.paymentQrCode}
                          className="w-full h-full object-contain"
                          alt="QR Preview"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, paymentQrCode: null })
                          }
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 w-full bg-[#0d1424] border border-dashed border-[#1f2a3d] hover:border-violet-500/50 rounded-xl py-4 cursor-pointer transition-all">
                      <HiOutlineArrowUpTray className="text-slate-500" />
                      <span className="text-xs text-slate-500 font-medium">
                        {formData.paymentQrCode
                          ? "Change QR Code"
                          : "Upload QR Code Image"}
                      </span>
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({
                                ...formData,
                                paymentQrCode: reader.result,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button disabled={loading} className={btnPrimary}>
                    {loading ? "Saving…" : "Save Payment Details"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === "businesses" && (
            <motion.div
              key="businesses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-semibold text-base">
                    My Businesses
                  </h2>
                  <p className="text-slate-500 text-xs">
                    {myBusinesses.length} registered
                  </p>
                </div>
                <button
                  onClick={() => navigate("/add-business")}
                  className={btnPrimary}
                >
                  <FiPlus /> Add
                </button>
              </div>

              <div className="space-y-2">
                {myBusinesses.map((biz) => (
                  <div
                    key={biz._id}
                    className={`${card} p-4 flex items-center justify-between hover:border-violet-500/30 hover:bg-[#131d2e] transition-all`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center overflow-hidden shrink-0">
                        {biz.logo ? (
                          <img
                            src={biz.logo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <HiOutlineBuildingOffice2 className="text-slate-600 text-lg" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-semibold text-sm">
                          {biz.businessName}
                        </h4>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {biz.mainCategory} · {biz.district}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => navigate(`/edit-business/${biz._id}`)}
                        title="Edit Business"
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        onClick={() => handleDeleteBusiness(biz._id)}
                        title="Delete Business"
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <HiOutlineTrash />
                      </button>
                      <button
                        onClick={() => navigate(`/business/${biz._id}`)}
                        title="View Business"
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                      >
                        <HiOutlineArrowUpRight />
                      </button>
                    </div>
                  </div>
                ))}

                {myBusinesses.length === 0 && (
                  <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-16 text-center">
                    <div className="text-4xl mb-3 opacity-20">🏢</div>
                    <p className="text-slate-600 text-xs mb-4">
                      No businesses added yet
                    </p>
                    <button
                      onClick={() => navigate("/add-business")}
                      className={btnOutline}
                    >
                      <FiPlus /> Add your first business
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "jobs" && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${card} p-8 text-center`}
            >
              <div className="text-4xl mb-4 opacity-20">💼</div>
              <h3 className="text-white font-bold text-lg mb-2">
                Job Dashboard
              </h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                Manage your job listings, track applicants, and review
                candidates.
              </p>
              <button
                onClick={() => navigate("/job-dashboard")}
                className={btnPrimary}
              >
                Open Job Dashboard <HiOutlineArrowUpRight />
              </button>
            </motion.div>
          )}

          {activeTab === "applications" && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className={`${card} p-6`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl">
                    📝
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      My Applications
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Track the status of your current job applications
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {appliedJobs.length > 0 ? (
                    appliedJobs.map((app) => (
                      <div
                        key={app.jobId}
                        className="bg-[#0d1424] border border-[#1f2a3d] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-violet-500/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
                            💼
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-sm">
                              {app.position}
                            </h4>
                            <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <FiMapPin className="text-xs" /> {app.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-left sm:text-right">
                            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-wider mb-1">
                              Status
                            </p>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold
                              ${
                                app.status === "Selected"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : app.status === "Rejected"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : app.status === "Interview"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  app.status === "Selected"
                                    ? "bg-emerald-400"
                                    : app.status === "Rejected"
                                      ? "bg-red-400"
                                      : "bg-violet-400 animate-pulse"
                                }`}
                              />
                              {app.status}
                            </span>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-wider mb-1">
                              Job Status
                            </p>
                            <span
                              className={`text-[10px] font-semibold ${app.jobStatus === "Open" ? "text-emerald-500" : "text-slate-500"}`}
                            >
                              {app.jobStatus === "Open"
                                ? "Active"
                                : "Expired/Closed"}
                            </span>
                          </div>

                          <button
                            onClick={() => navigate(`/jobs/${app.jobId}`)}
                            className="p-2 bg-[#1a2540] border border-[#1f2a3d] rounded-lg text-slate-400 hover:text-white transition-all ml-auto sm:ml-0"
                          >
                            <HiOutlineArrowUpRight />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <div className="text-4xl mb-4 opacity-10">📄</div>
                      <p className="text-slate-500 text-sm">
                        You haven't applied for any jobs yet
                      </p>
                      <button
                        onClick={() => navigate("/jobs")}
                        className="mt-4 text-violet-400 text-xs font-semibold hover:underline"
                      >
                        Browse available jobs
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${card} p-8 text-center`}
            >
              <div className="text-4xl mb-4 opacity-20">🛒</div>
              <h3 className="text-white font-bold text-lg mb-2">My Orders</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                Track your purchases, view delivery status, and contact sellers.
              </p>
              <button
                onClick={() => navigate("/my-orders")}
                className={btnPrimary}
              >
                Go to Orders Panel <HiOutlineArrowUpRight />
              </button>
            </motion.div>
          )}


          {activeTab === "membership" && (
            <motion.div
              key="membership"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${card} p-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-bold text-lg">
                    My Membership
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Manage your subscription and features
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${
                    user?.subscription?.plan === "platinum"
                      ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                      : user?.subscription?.plan === "gold"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : user?.subscription?.plan === "silver"
                          ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          : "bg-slate-700/30 text-slate-500 border border-slate-700/50"
                  }`}
                >
                  {user?.subscription?.plan || "Free"} Plan
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-[#0d1424] border border-[#1f2a3d] rounded-2xl p-4">
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-1">
                    Upload Limits
                  </p>
                  <div className="space-y-3 mt-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-slate-400">Products</span>
                        <span className="text-white font-bold">
                          {user?.usage?.productsUploaded || 0} used
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500"
                          style={{
                            width: `${Math.min(((user?.usage?.productsUploaded || 0) / (user?.subscription?.plan === "platinum" ? 1000 : user?.subscription?.plan === "gold" ? 100 : user?.subscription?.plan === "silver" ? 20 : 3)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-slate-400">Stories</span>
                        <span className="text-white font-bold">
                          {user?.usage?.storiesPosted || 0} used
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: `${Math.min(((user?.usage?.storiesPosted || 0) / (user?.subscription?.plan === "platinum" ? 1000 : user?.subscription?.plan === "gold" ? 200 : user?.subscription?.plan === "silver" ? 50 : 5)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-slate-400">Jobs Posted</span>
                        <span className="text-white font-bold">
                          {user?.usage?.jobsPosted || 0} used
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{
                            width: `${Math.min(((user?.usage?.jobsPosted || 0) / (user?.subscription?.plan === "platinum" ? 1000 : user?.subscription?.plan === "gold" ? 50 : user?.subscription?.plan === "silver" ? 10 : 2)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d1424] border border-[#1f2a3d] rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <HiOutlineShieldCheck className="text-xl" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">
                        {user?.subscription?.status === "active"
                          ? "Connected"
                          : "Not Active"}
                      </p>
                      {user?.subscription?.expiryDate && (
                        <p className="text-[10px] text-slate-500">
                          Expires:{" "}
                          {new Date(
                            user.subscription.expiryDate,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {user?.subscription?.plan === "platinum" && (
                    <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                        <HiOutlineSparkles className="text-lg animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">
                          Priority Support
                        </p>
                        <p className="text-[9px] text-slate-500">
                          Your queries are moved to the top of the queue
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/upgrade-plan")}
                  className={`${btnPrimary} flex-1 justify-center py-3`}
                >
                  <HiOutlineSparkles /> Upgrade Membership
                </button>
                <button
                  onClick={() => navigate("/market/sell")}
                  className={`${btnOutline} flex-1 justify-center py-3`}
                >
                  Sell Product
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "sales" && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${card} p-8 text-center`}
            >
              <div className="text-4xl mb-4 opacity-20">💰</div>
              <h3 className="text-white font-bold text-lg mb-2">Seller Hub</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                Manage your product listings and process incoming buyer orders.
              </p>
              <button
                onClick={() => navigate("/sales-management")}
                className={btnPrimary}
              >
                Open Seller Dashboard <HiOutlineArrowUpRight />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
