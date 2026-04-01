import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiAward,
  FiCalendar,
  FiBriefcase,
  FiShoppingBag,
  FiPackage,
  FiClipboard,
  FiEye,
  FiCheckCircle,
  FiSlash,
  FiX,
} from "react-icons/fi";

const AdminUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUserDetails(id);
      setDetails(response.data);
    } catch (error) {
      toast.error("Failed to fetch user details");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await adminService.updateUserStatus(id, status);
      toast.success(`User is now ${status}`);
      fetchUserDetails();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-indigo-400">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="font-medium animate-pulse text-lg">
            Loading complete profile...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!details) return null;

  const { user, businesses, products, jobs, orders } = details;

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Users
        </button>
        <div className="flex flex-wrap gap-3">
          {user.status !== "active" ? (
            <button
              onClick={() => handleUpdateStatus("active")}
              className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all font-bold flex items-center gap-2"
            >
              <FiCheckCircle /> Activate User
            </button>
          ) : (
            <>
              <button
                onClick={() => handleUpdateStatus("suspended")}
                className="bg-amber-600/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-600/20 transition-all font-bold flex items-center gap-2"
              >
                <FiSlash /> Suspend
              </button>
              <button
                onClick={() => handleUpdateStatus("banned")}
                className="bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-500 transition-all font-bold shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                <FiX /> Ban Account
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-card-bg/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl text-white font-bold shadow-2xl shadow-indigo-500/20 border-4 border-slate-800 mb-6 transition-transform hover:scale-105 duration-300">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {user.name}
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    user.status === "banned"
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      : user.status === "suspended"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }`}
                >
                  {user.status || "active"}
                </span>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <FiAward /> {user.loyaltyPoints || 0} Pts
                </span>
              </div>

              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FiMail />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Email
                    </p>
                    <p className="text-slate-200 text-sm truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <FiPhone />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Phone
                    </p>
                    <p className="text-slate-200 text-sm">
                      {user.phoneNumber || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <FiCalendar />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Joined On
                    </p>
                    <p className="text-slate-200 text-sm">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card-bg/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-xl">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FiMapPin /> Location Base
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">State & District</p>
                <p className="text-slate-200 font-bold">
                  {user.district || "Gujarat"}, {user.taluka || "India"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Detailed Address</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {user.locationName || "No specific address provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-xs">
                  Membership Tier
                </h4>
                <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-indigo-500/30">
                  {user.subscription?.status || "Free"}
                </span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-black text-white capitalize">
                  {user.subscription?.plan || "Free"}
                </span>
                <span className="text-indigo-400/60 mb-1 font-medium italic">
                  Plan
                </span>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Standard community access. Upgraded accounts have premium badges
                and priority listings.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Businesses",
                count: businesses?.length || 0,
                icon: FiBriefcase,
                color: "indigo",
              },
              {
                label: "Products",
                count: products?.length || 0,
                icon: FiPackage,
                color: "emerald",
              },
              {
                label: "Jobs",
                count: jobs?.length || 0,
                icon: FiClipboard,
                color: "amber",
              },
              {
                label: "Orders",
                count: orders?.length || 0,
                icon: FiShoppingBag,
                color: "purple",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-card-bg/40 border border-slate-700/50 p-6 rounded-3xl hover:border-indigo-500/30 transition-all hover:-translate-y-1 shadow-lg"
              >
                <item.icon className={`text-${item.color}-400 text-xl mb-4`} />
                <p className="text-3xl font-black text-white">{item.count}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-card-bg/40 border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2">
                <FiEye className="text-indigo-400" /> Platform Assets
              </h4>
            </div>

            <div className="p-8 space-y-10">
              <div>
                <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Businesses{" "}
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {businesses?.length > 0 ? (
                    businesses.map((b) => (
                      <div
                        key={b._id}
                        className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30 hover:border-indigo-500/30 transition-all group"
                      >
                        <div>
                          <p className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                            {b.businessName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {b.mainCategory} • {b.district}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/business/${b._id}`)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-indigo-600 rounded-lg transition-all"
                        >
                          <FiEye />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 text-sm italic py-4">
                      No businesses registered by this user.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Latest Jobs{" "}
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jobs?.length > 0 ? (
                    jobs.map((j) => (
                      <div
                        key={j._id}
                        className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-slate-200 line-clamp-1">
                            {j.title}
                          </p>
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase">
                            {j.jobType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Posted on {new Date(j.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 text-sm italic py-4">
                      No job postings found.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Recent Purchases{" "}
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                </h5>
                <div className="space-y-3">
                  {orders?.length > 0 ? (
                    orders.map((o) => (
                      <div
                        key={o._id}
                        className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-700">
                          {o.product?.images?.[0] ? (
                            <img
                              src={o.product.images[0]}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FiPackage className="text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-200 text-sm">
                            {o.product?.name || "Product Item"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Order ID: {o._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-black">
                            ₹{o.price || 0}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">
                            {o.paymentStatus || "Paid"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 text-sm italic py-4">
                      No order history available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetails;
