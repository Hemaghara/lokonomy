import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { businessService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingStorefront,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineStar,
  HiOutlinePhoto,
  HiOutlineInformationCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckBadge,
  HiOutlineTag,
  HiOutlineCalendarDays,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import { HiStar } from "react-icons/hi2";
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import WishlistButton from "../components/WishlistButton";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBusinessDetails();
  }, [id]);

  const fetchBusinessDetails = async () => {
    try {
      const response = await businessService.getBusinessById(id);
      setBusiness(response.data);
    } catch (err) {
      console.error("Error fetching business:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to submit a review");

    if (user.id === business.ownerId) {
      return toast.error("Owners cannot review their own business");
    }

    if (business.reviews?.some((r) => r.userId === user.id)) {
      return toast.error("You have already reviewed this business");
    }

    try {
      await businessService.addReview(id, {
        ...newReview,
        userName: user.name,
      });
      setNewReview({ rating: 5, comment: "" });
      fetchBusinessDetails();
      toast.success("Review submitted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
          Loading…
        </p>
      </div>
    );
  if (!business)
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4 opacity-20">🏢</div>
        <h2 className="text-white font-semibold text-lg mb-2">
          Business Not Found
        </h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          This listing does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/services")}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          <HiOutlineArrowLeft /> Back to Services
        </button>
      </div>
    );

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600";

  const tabs = [
    { id: "info", label: "Details", icon: <HiOutlineInformationCircle /> },
    { id: "gallery", label: "Gallery", icon: <HiOutlinePhoto /> },
    { id: "reviews", label: "Reviews", icon: <HiOutlineStar /> },
  ];

  const format12h = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .bd * { font-family: 'DM Sans', sans-serif; }
        .no-sb::-webkit-scrollbar { display: none; }
        .bd select option { background: #111827; color: #e2e8f0; }
      `}</style>

      <div className="bd max-w-6xl mx-auto px-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-6"
        >
          <HiOutlineArrowLeft className="text-sm" /> Back to Results
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={card + " p-6 mb-5"}
        >
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0d1424] border border-[#1f2a3d] overflow-hidden shrink-0 flex items-center justify-center">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <HiOutlineBuildingStorefront className="text-4xl text-slate-700" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-white font-bold text-xl sm:text-2xl leading-snug">
                  {business.businessName}
                </h1>
                {business.verified && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold">
                    <HiOutlineCheckBadge className="text-sm" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <HiStar
                      key={i}
                      className={`text-sm ${i < Math.round(business.rating || 0) ? "text-amber-400" : "text-slate-700"}`}
                    />
                  ))}
                </div>
                <span className="text-amber-400 font-semibold text-sm">
                  {business.rating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-slate-600 text-xs">
                  ({business.reviews?.length || 0} reviews)
                </span>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-3 max-w-2xl line-clamp-2">
                {business.description ||
                  "Professional service provider dedicated to excellence in our community."}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-[11px] font-semibold">
                  <HiOutlineTag className="text-xs" />
                  {business.mainCategory}
                </span>
                <span className="px-3 py-1 bg-[#0d1424] border border-[#1f2a3d] text-slate-500 rounded-lg text-[11px] font-semibold">
                  {business.subCategory}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-[#0d1424] border border-[#1f2a3d] text-slate-500 rounded-lg text-[11px] font-semibold">
                  <HiOutlineMapPin className="text-rose-400 text-xs" />
                  {business.locationAddress ||
                    business.address ||
                    business.state ||
                    "India"}
                </span>
              </div>
            </div>
            <div className="flex sm:flex-col gap-3 w-full sm:w-auto sm:shrink-0">
              <a
                href={`tel:${business.contactNumber}`}
                className="flex-1 sm:w-44 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold px-4 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30"
              >
                <HiOutlinePhone className="text-sm" /> Call Now
              </a>
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:w-44 flex items-center justify-center gap-2 bg-[#0d1424] hover:bg-[#131d2e] border border-[#1f2a3d] hover:border-violet-500/30 hover:text-violet-400 text-slate-400 text-xs font-semibold px-4 py-3 rounded-xl transition-all"
                >
                  <HiOutlineGlobeAlt className="text-sm" /> Website
                  <HiOutlineArrowTopRightOnSquare className="text-xs" />
                </a>
              )}
              <WishlistButton
                type="business"
                id={business._id}
                className="flex-1 sm:w-44 flex items-center justify-center gap-2"
              />
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-1 bg-[#111827] border border-[#1f2a3d] rounded-2xl p-1 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all
                ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "info" && (
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <div className={card + " p-5"}>
                    <h3 className="flex items-center gap-2 text-slate-200 font-semibold text-sm mb-4 pb-4 border-b border-[#1f2a3d]">
                      <HiOutlineInformationCircle className="text-violet-400 text-base" />{" "}
                      Business Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        {
                          label: "Owner",
                          value: business.ownerName,
                          icon: (
                            <HiOutlineUser className="text-violet-400 text-sm" />
                          ),
                        },
                        {
                          label: "Email",
                          value: business.email || "N/A",
                          icon: (
                            <HiOutlineEnvelope className="text-violet-400 text-sm" />
                          ),
                        },
                        {
                          label: "Address",
                          value:
                            business.locationAddress ||
                            business.address ||
                            "Not specified",
                          icon: (
                            <HiOutlineMapPin className="text-rose-400 text-sm" />
                          ),
                        },
                        {
                          label: "State",
                          value: business.state || "India",
                          icon: (
                            <HiOutlineMapPin className="text-rose-400 text-sm" />
                          ),
                        },
                        {
                          label: "Pincode",
                          value: business.pincode || "N/A",
                          icon: (
                            <HiOutlineMapPin className="text-rose-400 text-sm" />
                          ),
                        },
                        {
                          label: "Total Visits",
                          value: `${business.visits ?? 0} visitors`,
                          icon: (
                            <HiOutlineArrowTopRightOnSquare className="text-violet-400 text-sm" />
                          ),
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="group bg-[#0d1424] border border-[#1f2a3d] rounded-xl p-3.5 hover:border-violet-500/30 hover:bg-[#0f1929] transition-all duration-300 relative overflow-hidden cursor-default"
                        >
                          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-400 group-hover:w-full transition-all duration-500 rounded-full" />
                          <p className="flex items-center gap-1.5 text-[10px] text-slate-600 group-hover:text-violet-500/60 font-semibold uppercase tracking-widest mb-1.5 transition-colors duration-300">
                            {item.icon}
                            {item.label}
                          </p>
                          <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300 truncate">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {(business.facebookLink ||
                      business.instagramLink ||
                      business.youtubeLink ||
                      business.twitterLink) && (
                      <div className="mt-5 pt-5 border-t border-[#1f2a3d]">
                        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-3">
                          Follow Us
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {business.facebookLink && (
                            <a
                              href={business.facebookLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            >
                              <FaFacebook className="text-sm" /> Facebook
                            </a>
                          )}
                          {business.instagramLink && (
                            <a
                              href={business.instagramLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            >
                              <FaInstagram className="text-sm" /> Instagram
                            </a>
                          )}
                          {business.youtubeLink && (
                            <a
                              href={business.youtubeLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            >
                              <FaYoutube className="text-sm" /> YouTube
                            </a>
                          )}
                          {business.twitterLink && (
                            <a
                              href={business.twitterLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            >
                              <FaTwitter className="text-sm" /> Twitter
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {business.photos?.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-[#1f2a3d]">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
                            Gallery Preview
                          </p>
                          <button
                            onClick={() => setActiveTab("gallery")}
                            className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="no-sb flex gap-2 overflow-x-auto pb-1">
                          {business.photos.slice(0, 6).map((img, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 rounded-xl border border-[#1f2a3d] overflow-hidden shrink-0"
                            >
                              <img
                                src={img}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {business.photos.length > 6 && (
                            <button
                              onClick={() => setActiveTab("gallery")}
                              className="w-16 h-16 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex flex-col items-center justify-center gap-0.5 shrink-0 hover:border-violet-500/30 transition-all"
                            >
                              <span className="text-slate-300 font-bold text-sm">
                                +{business.photos.length - 6}
                              </span>
                              <span className="text-violet-400 text-[9px] font-semibold">
                                More
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={card + " p-5"}>
                    <h3 className="flex items-center gap-2 text-slate-200 font-semibold text-sm mb-4 pb-4 border-b border-[#1f2a3d]">
                      <HiOutlineClock className="text-violet-400 text-base" />{" "}
                      Business Hours
                    </h3>
                    <div className="space-y-2">
                      {days.map((day) => {
                        const schedule = business.businessHours || {};
                        const hours = schedule[day] ||
                          (schedule.get && schedule.get(day)) || {
                            isOpen: false,
                          };
                        return (
                          <div
                            key={day}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                              ${
                                hours.isOpen
                                  ? "bg-[#0d1424] border-[#1f2a3d]"
                                  : "bg-[#0a0f1c] border-[#161f2e] opacity-40"
                              }`}
                          >
                            <span className="text-slate-300 font-semibold text-sm w-24">
                              {day}
                            </span>
                            {hours.isOpen ? (
                              <div className="flex items-center gap-2 text-xs font-semibold">
                                <span className="text-emerald-400">
                                  {format12h(hours.startTime)}
                                </span>
                                <span className="text-slate-700">→</span>
                                <span className="text-emerald-400">
                                  {format12h(hours.endTime)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                                Closed
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className={card + " p-5 sticky top-28"}>
                    <h4 className="flex items-center gap-2 text-slate-200 font-semibold text-sm mb-4 pb-4 border-b border-[#1f2a3d]">
                      <HiOutlineMapPin className="text-rose-400 text-base" />{" "}
                      Location
                    </h4>
                    <div className="space-y-2 text-sm mb-5">
                      {(business.locationAddress || business.address) && (
                        <p className="text-slate-400 leading-relaxed font-medium">
                          {business.locationAddress || business.address}
                        </p>
                      )}

                      {business.location?.coordinates?.length === 2 ? (
                        <div className="mt-4 rounded-xl overflow-hidden border border-[#1f2a3d] h-40 relative group">
                          <MapContainer
                            center={[
                              business.location.coordinates[1],
                              business.location.coordinates[0],
                            ]}
                            zoom={15}
                            scrollWheelZoom={false}
                            className="h-full w-full z-0"
                            zoomControl={false}
                            dragging={false}
                            touchZoom={false}
                            doubleClickZoom={false}
                          >
                            <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                              attribution="&copy; OpenStreetMap"
                            />
                            <Marker
                              position={[
                                business.location.coordinates[1],
                                business.location.coordinates[0],
                              ]}
                            />
                          </MapContainer>
                          <div className="absolute inset-0 bg-transparent z-10" />{" "}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic text-xs py-4 border border-dashed border-[#1f2a3d] rounded-xl text-center">
                          Map coordinates not available
                        </p>
                      )}

                      <p className="text-slate-500 mt-3 pt-3 border-t border-[#1f2a3d]/50">
                        {business.state}
                        {business.pincode ? ` – ${business.pincode}` : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const coords = business.location?.coordinates;
                        const query =
                          coords?.length === 2
                            ? `${coords[1]},${coords[0]}`
                            : encodeURIComponent(
                                (business.locationAddress ||
                                  business.address ||
                                  "") +
                                  (business.state ? " " + business.state : ""),
                              );
                        window.open(
                          coords?.length === 2
                            ? `https://www.google.com/maps?q=${query}`
                            : `https://www.google.com/maps/search/?api=1&query=${query}`,
                        );
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/20 py-3 rounded-xl transition-all font-bold"
                    >
                      <HiOutlineMapPin className="text-sm" /> Open in Google
                      Maps
                    </button>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="group bg-[#0d1424] border border-[#1f2a3d] rounded-xl p-3 text-center hover:border-amber-500/30 transition-all relative overflow-hidden cursor-default">
                        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-amber-400 group-hover:w-full transition-all duration-500 rounded-full" />
                        <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                          <HiStar className="text-amber-400 text-base" />
                        </div>
                        <p className="text-white font-bold text-base">
                          {business.rating?.toFixed(1) || "0.0"}
                        </p>
                        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wide">
                          Rating
                        </p>
                      </div>
                      <div className="group bg-[#0d1424] border border-[#1f2a3d] rounded-xl p-3 text-center hover:border-violet-500/30 transition-all relative overflow-hidden cursor-default">
                        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-400 group-hover:w-full transition-all duration-500 rounded-full" />
                        <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 group-hover:bg-violet-500/20 transition-all duration-300">
                          <HiOutlineChatBubbleLeftRight className="text-violet-400 text-base" />
                        </div>
                        <p className="text-white font-bold text-base">
                          {business.reviews?.length || 0}
                        </p>
                        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wide">
                          Reviews
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "gallery" && (
              <div>
                {business.photos?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {business.photos.map((img, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, delay: i * 0.03 }}
                        className="aspect-square bg-[#0d1424] border border-[#1f2a3d] rounded-2xl overflow-hidden group hover:border-violet-500/30 transition-all"
                      >
                        <img
                          src={img}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center">
                    <div className="text-5xl mb-4 opacity-20">📸</div>
                    <p className="text-slate-500 font-semibold text-sm">
                      No gallery images available
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                  {business.reviews?.length > 0 ? (
                    business.reviews.map((review, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={card + " p-5"}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
                              {review.userName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-slate-200 font-semibold text-sm">
                                {review.userName}
                              </p>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {[...Array(5)].map((_, idx) => (
                                  <HiStar
                                    key={idx}
                                    className={`text-xs ${idx < review.rating ? "text-amber-400" : "text-slate-700"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-slate-600">
                            <HiOutlineCalendarDays className="text-xs" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed pl-13 border-t border-[#1f2a3d] pt-3 mt-1">
                          {review.comment}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-20 text-center">
                      <div className="text-4xl mb-3 opacity-20">💬</div>
                      <p className="text-slate-500 text-sm font-semibold">
                        No reviews yet — be the first!
                      </p>
                    </div>
                  )}
                </div>

                <div className={card + " p-5 sticky top-28 h-fit"}>
                  <h3 className="flex items-center gap-2 text-slate-200 font-semibold text-sm mb-4 pb-4 border-b border-[#1f2a3d]">
                    <HiOutlineChatBubbleLeftRight className="text-violet-400 text-base" />{" "}
                    Write a Review
                  </h3>

                  {!user ? (
                    <div className="text-center py-6">
                      <p className="text-slate-500 text-xs mb-4">
                        Please login to share your experience with this
                        business.
                      </p>
                      <button
                        onClick={() => navigate("/login")}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Login to Review
                      </button>
                    </div>
                  ) : user.id === business.ownerId ? (
                    <div className="text-center py-6 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <p className="text-amber-400/80 text-[11px] font-medium px-4">
                        You are the owner of this business. Owners cannot leave
                        reviews on their own listings.
                      </p>
                    </div>
                  ) : business.reviews?.some((r) => r.userId === user.id) ? (
                    <div className="text-center py-6 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <p className="text-emerald-400/80 text-[11px] font-medium px-4">
                        Thank you for your feedback! You have already reviewed
                        this business.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <HiStar className="text-amber-400 text-sm" /> Rating
                        </label>
                        <select
                          className={inputCls}
                          value={newReview.rating}
                          onChange={(e) =>
                            setNewReview({
                              ...newReview,
                              rating: Number(e.target.value),
                            })
                          }
                        >
                          {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>
                              {r} Star{r > 1 ? "s" : ""} —{" "}
                              {r === 5
                                ? "Excellent"
                                : r === 4
                                  ? "Good"
                                  : r === 3
                                    ? "Average"
                                    : r === 2
                                      ? "Poor"
                                      : "Terrible"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <HiOutlineChatBubbleLeftRight className="text-violet-400 text-sm" />{" "}
                          Your Comment
                        </label>
                        <textarea
                          className={inputCls + " h-28 resize-none"}
                          placeholder="Share your experience with this business…"
                          value={newReview.comment}
                          onChange={(e) =>
                            setNewReview({
                              ...newReview,
                              comment: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30"
                      >
                        <HiOutlineStar className="text-sm" /> Submit Review
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BusinessDetails;
