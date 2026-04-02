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

const StatCard = ({ icon: Icon, label, count, color }) => {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <div className="flex flex-col gap-3 bg-slate-800/40 border border-slate-700/40 p-5 rounded-2xl hover:border-slate-600/60 transition-all duration-200">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colors[color]}`}
      >
        <Icon size={16} />
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-none">{count}</p>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
          {label}
        </p>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, iconClass }) => (
  <div className="flex items-center gap-3 p-3.5 bg-slate-900/40 rounded-xl border border-slate-700/30">
    <div
      className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${iconClass}`}
    >
      <Icon size={15} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none mb-1">
        {label}
      </p>
      <p className="text-slate-200 text-sm truncate">{value}</p>
    </div>
  </div>
);

const SectionDot = ({ color }) => (
  <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} ml-1.5`} />
);

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
    } catch {
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
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-indigo-400">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="font-medium animate-pulse text-base">
            Loading profile...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!details) return null;

  const { user, businesses, products, jobs, orders } = details;

  const statusStyle =
    {
      banned: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
      suspended: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    }[user.status] ||
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 text-sm"
        >
          <FiArrowLeft
            size={15}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Users
        </button>
        <div className="flex flex-wrap gap-2">
          {user.status !== "active" ? (
            <button
              onClick={() => handleUpdateStatus("active")}
              className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl hover:bg-emerald-600/20 transition-all text-sm font-bold flex items-center gap-2"
            >
              <FiCheckCircle size={14} /> Activate
            </button>
          ) : (
            <>
              <button
                onClick={() => handleUpdateStatus("suspended")}
                className="bg-amber-600/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-600/20 transition-all text-sm font-bold flex items-center gap-2"
              >
                <FiSlash size={14} /> Suspend
              </button>
              <button
                onClick={() => handleUpdateStatus("banned")}
                className="bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-500 transition-all text-sm font-bold flex items-center gap-2"
              >
                <FiX size={14} /> Ban Account
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl text-white font-black shadow-lg border-2 border-slate-700">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white truncate">
                  {user.name}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusStyle}`}
                  >
                    {user.status || "active"}
                  </span>
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <FiAward size={10} /> {user.loyaltyPoints || 0} pts
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <InfoRow
                icon={FiMail}
                label="Email"
                value={user.email}
                iconClass="bg-indigo-500/10 text-indigo-400"
              />
              <InfoRow
                icon={FiPhone}
                label="Phone"
                value={user.phoneNumber || "N/A"}
                iconClass="bg-sky-500/10 text-sky-400"
              />
              <InfoRow
                icon={FiCalendar}
                label="Joined"
                value={new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                iconClass="bg-emerald-500/10 text-emerald-400"
              />
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiMapPin size={12} /> Location
            </h4>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] text-slate-500 mb-1">
                  District & Taluka
                </p>
                <p className="text-slate-200 font-bold text-sm">
                  {user.district || "Gujarat"}, {user.taluka || "India"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-1">Address</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {user.locationName || "No address provided"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-[11px]">
                Membership
              </h4>
              <span className="bg-indigo-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight">
                {user.subscription?.status || "Free"}
              </span>
            </div>
            <p className="text-3xl font-black text-white capitalize">
              {user.subscription?.plan || "Free"}
            </p>
            <p className="text-indigo-300/60 text-xs mt-1 font-medium italic">
              Plan
            </p>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Standard community access. Upgraded accounts get premium badges
              and priority listings.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <StatCard key={idx} {...item} />
            ))}
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
              <FiEye size={15} className="text-indigo-400" />
              <h4 className="font-bold text-white text-sm">Platform Assets</h4>
            </div>

            <div className="p-6 flex flex-col gap-8">
              <div>
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                  Businesses <SectionDot color="bg-indigo-500" />
                </h5>
                {businesses?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {businesses.map((b) => (
                      <div
                        key={b._id}
                        className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/30 hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="min-w-0 mr-2">
                          <p className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors text-sm truncate">
                            {b.businessName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {b.mainCategory} · {b.district}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/business/${b._id}`)}
                          className="shrink-0 p-2 text-slate-500 hover:text-white hover:bg-indigo-600 rounded-lg transition-all"
                        >
                          <FiEye size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm italic">
                    No businesses registered.
                  </p>
                )}
              </div>

              <div>
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                  Latest Jobs <SectionDot color="bg-amber-500" />
                </h5>
                {jobs?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {jobs.map((j) => (
                      <div
                        key={j._id}
                        className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/30"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <p className="font-bold text-slate-200 text-sm line-clamp-1">
                            {j.title}
                          </p>
                          <span className="shrink-0 text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold uppercase border border-amber-500/20">
                            {j.jobType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(j.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm italic">
                    No job postings found.
                  </p>
                )}
              </div>

              <div>
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                  Recent Purchases <SectionDot color="bg-purple-500" />
                </h5>
                {orders?.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {orders.map((o) => (
                      <div
                        key={o._id}
                        className="flex items-center gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/30"
                      >
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                          {o.product?.images?.[0] ? (
                            <img
                              src={o.product.images[0]}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <FiPackage size={16} className="text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-200 text-sm truncate">
                            {o.product?.name || "Product Item"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            #{o._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-emerald-400 font-black text-sm">
                            ₹{o.price || 0}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                            {o.paymentStatus || "Paid"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm italic">
                    No order history available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetails;
