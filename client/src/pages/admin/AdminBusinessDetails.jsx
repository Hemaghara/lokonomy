import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiStar,
  FiEye,
  FiMessageSquare,
  FiPackage,
  FiGlobe,
  FiTrash2,
  FiShield,
  FiExternalLink,
  FiActivity,
  FiGrid,
  FiImage,
  FiCheckCircle,
} from "react-icons/fi";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/70 border border-slate-800/70 rounded-2xl backdrop-blur-sm overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const SectionHeading = ({ icon: Icon, label, accent = "text-indigo-400" }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div
      className={`w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center ${accent} border border-slate-700/50 shrink-0`}
    >
      <Icon size={15} />
    </div>
    <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
      {label}
    </h3>
  </div>
);

const InfoItem = ({ icon: Icon, label, value, href }) => {
  const content = (
    <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/2 hover:bg-white/5 hover:border-white/6 transition-all">
      <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 mb-0.5">
          {label}
        </p>
        <p className="text-xs font-medium text-slate-200 truncate">
          {value || "Not provided"}
        </p>
      </div>
      {href && (
        <FiExternalLink
          size={13}
          className="text-slate-700 group-hover:text-indigo-400 transition-colors shrink-0"
        />
      )}
    </div>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block outline-none"
    >
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, color = "indigo" }) => {
  const map = {
    indigo:
      "from-indigo-500/15 to-indigo-500/5 text-indigo-400 border-indigo-500/20",
    amber:
      "from-amber-500/15 to-amber-500/5 text-amber-400 border-amber-500/20",
    emerald:
      "from-emerald-500/15 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-400 border-rose-500/20",
    violet:
      "from-violet-500/15 to-violet-500/5 text-violet-400 border-violet-500/20",
  };
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-linear-to-br border ${map[color]} relative overflow-hidden group`}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 rounded-lg bg-slate-900/50 border border-current opacity-60">
            <Icon size={16} />
          </div>
          {trend && (
            <span className="text-[9px] font-black px-1.5 py-0.5 bg-white/5 rounded-full uppercase">
              {trend}
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-slate-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-current opacity-[0.04] blur-2xl rounded-full transition-transform group-hover:scale-150 duration-700" />
    </div>
  );
};

const AdminBusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    fetchDetails();
    fetchHealthScore();
  }, [id]);

  const fetchHealthScore = async () => {
    try {
      const res = await adminService.getBusinessScore(id);
      setHealthData(res.data);
    } catch (_) {}
  };

  const fetchDetails = async () => {
    try {
      const response = await adminService.getBusinessDetails(id);
      setBusiness(response.data);
    } catch {
      toast.error("Failed to load business details");
      navigate("/admin/businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "CRITICAL: Delete this business permanently? This cannot be undone.",
      )
    )
      return;
    try {
      await adminService.deleteContent("business", id);
      toast.success("Business expunged successfully");
      navigate("/admin/businesses");
    } catch {
      toast.error("Deletion failed");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-[80vh] flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse rounded-full" />
            <div className="relative w-14 h-14 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!business) return null;

  const tabs = ["overview", "gallery", "products"];

  return (
    <AdminLayout>
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95 shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {business?.businessName || "Business"}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                  business?.status === "active"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                }`}
              >
                {business?.status || "Active"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-rose-500/30 text-rose-400 text-[11px] font-medium uppercase tracking-widest hover:bg-rose-500/10 active:scale-[0.97] transition-all"
        >
          <FiTrash2 size={14} /> Delete business
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
        <div className="lg:col-span-4 space-y-5">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <Card>
              <div className="relative h-24 sm:h-28 bg-linear-to-br from-indigo-600/25 via-violet-600/10 to-transparent">
                <div className="absolute -bottom-10 left-5 p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt={business.businessName}
                      className="w-20 h-20 sm:w-20 sm:h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl font-black text-indigo-400">
                      {business.businessName?.charAt(0) || "B"}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-14 px-5 pb-5">
                <div className="mb-5">
                  <h2 className="text-lg font-black text-white leading-tight mb-0.5">
                    {business.businessName}
                  </h2>
                  <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    {business.mainCategory}
                  </p>
                </div>
                <div className="space-y-2">
                  <InfoItem
                    icon={FiGlobe}
                    label="Website"
                    value={business.website}
                    href={business.website}
                  />
                  <InfoItem
                    icon={FiMail}
                    label="Contact Email"
                    value={business.email}
                    href={`mailto:${business.email}`}
                  />
                  <InfoItem
                    icon={FiPhone}
                    label="Contact Phone"
                    value={business.phone}
                    href={`tel:${business.phone}`}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <Card className="p-5">
              <SectionHeading
                icon={FiUser}
                label="Business Owner"
                accent="text-amber-400"
              />
              {business.ownerId ? (
                <Link
                  to={`/admin/user/${business.ownerId._id}`}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-all border border-slate-700/30 hover:border-amber-500/30"
                >
                  <img
                    src={
                      business.ownerId.profilePic ||
                      `https://ui-avatars.com/api/?name=${business.ownerId.name}`
                    }
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-white group-hover:text-amber-400 transition-colors truncate">
                      {business.ownerId.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {business.ownerId.email}
                    </p>
                  </div>
                  <FiArrowLeft
                    className="ml-auto text-slate-600 rotate-180 group-hover:text-amber-400 transition-all shrink-0"
                    size={14}
                  />
                </Link>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Owner information unavailable
                </p>
              )}
            </Card>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <Card className="p-5">
              <SectionHeading
                icon={FiMapPin}
                label="Location Analytics"
                accent="text-emerald-400"
              />
              <div className="space-y-0 divide-y divide-white/4">
                {[
                  { k: "District", v: business.district },
                  { k: "Taluka", v: business.taluka },
                  {
                    k: "Coordinates",
                    v: business.location?.coordinates?.join(", ") || "Not set",
                    mono: true,
                  },
                ].map(({ k, v, mono }) => (
                  <div
                    key={k}
                    className="flex justify-between items-center py-2.5 gap-3"
                  >
                    <span className="text-[9px] uppercase font-black text-slate-600 tracking-tight shrink-0">
                      {k}
                    </span>
                    <span
                      className={`text-xs font-bold text-slate-300 truncate text-right ${
                        mono ? "font-mono text-indigo-400/80 text-[10px]" : ""
                      }`}
                    >
                      {v || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {healthData && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <Card className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <SectionHeading
                    icon={FiActivity}
                    label="Health Scorecard"
                    accent="text-emerald-400"
                  />
                  <span
                    className={`text-2xl font-black ${healthData.score > 70 ? "text-emerald-400" : healthData.score > 40 ? "text-amber-400" : "text-rose-400"}`}
                  >
                    {healthData.score}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-5">
                  <div
                    className={`h-full transition-all duration-1000 ${healthData.score > 70 ? "bg-emerald-500" : healthData.score > 40 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${healthData.score}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {healthData.signals?.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/2 border border-white/2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1 h-1 rounded-full ${s.type === "positive" ? "bg-emerald-400" : s.type === "negative" ? "bg-rose-400" : "bg-slate-400"}`}
                        />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                          {s.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-black ${s.points > 0 ? "text-emerald-400" : s.points < 0 ? "text-rose-400" : "text-slate-500"}`}
                      >
                        {s.points > 0 ? "+" : ""}
                        {s.points}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Total Visits",
                value: business.visits || 0,
                icon: FiEye,
                color: "indigo",
              },
              {
                label: "Rating",
                value: business.rating?.toFixed(1) || "0.0",
                icon: FiStar,
                color: "amber",
                trend: "★ Top",
              },
              {
                label: "Reviews",
                value: business.reviews?.length || 0,
                icon: FiMessageSquare,
                color: "emerald",
              },
              {
                label: "Products",
                value: business.products?.length || 0,
                icon: FiPackage,
                color: "violet",
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <StatCard {...s} />
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "text-indigo-400"
                    : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <Card className="p-5">
                    <SectionHeading
                      icon={FiActivity}
                      label="Business Bio & Description"
                    />
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                      {business.description ||
                        "No description provided for this business."}
                    </p>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Card className="p-5">
                      <SectionHeading
                        icon={FiGrid}
                        label="Additional Attributes"
                      />
                      <div className="space-y-2.5">
                        {[
                          {
                            label: "Sub-Categories",
                            value: business.subCategory || "None",
                          },
                          {
                            label: "Registered Date",
                            value: new Date(
                              business.createdAt,
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }),
                          },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="flex flex-col gap-0.5 p-3 rounded-xl bg-white/2 border border-white/2"
                          >
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">
                              {label}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-5">
                      <SectionHeading
                        icon={FiShield}
                        label="Verification Status"
                        accent="text-emerald-400"
                      />
                      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <FiCheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">
                            Identity Verified
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Business license and owner ID verified.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "gallery" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {business.photos && business.photos.length > 0 ? (
                    business.photos.map((photo, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        key={i}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 bg-slate-900"
                      >
                        <img
                          src={photo}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          alt={`Media ${i + 1}`}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">
                            Media #{i + 1}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700">
                      <FiImage size={36} className="text-slate-700 mb-3" />
                      <p className="text-slate-400 font-bold text-sm">
                        No gallery images uploaded
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "products" && (
                <div className="space-y-3">
                  {business.products && business.products.length > 0 ? (
                    business.products.map((product) => (
                      <Link
                        to={`/admin/marketplace/product/${product._id}`}
                        key={product._id}
                        className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 hover:border-indigo-500/30 transition-all"
                      >
                        <img
                          src={product.productImages?.[0]}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover shrink-0"
                          alt={product.productName || product.name}
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white mb-0.5 group-hover:text-indigo-400 transition-colors truncate">
                            {product.productName || product.name}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-indigo-400 text-xs font-black">
                              ₹{product.price}
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase font-black">
                              {product.mainCategory || product.category}
                            </span>
                          </div>
                        </div>
                        <FiArrowLeft
                          className="text-slate-700 group-hover:text-indigo-400 rotate-180 transition-all shrink-0"
                          size={16}
                        />
                      </Link>
                    ))
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700">
                      <FiPackage size={36} className="text-slate-700 mb-3" />
                      <p className="text-slate-400 font-bold text-sm">
                        No products listed by this business
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBusinessDetails;
