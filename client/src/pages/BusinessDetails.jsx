import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { businessService, influencerService } from "../services";
import { getSocket } from "../services/socket";
import recommendationService from "../services/recommendationService";
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
  HiOutlineChartBar,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import BusinessAnalytics from "../components/growth/BusinessAnalytics";
import CouponManager from "../components/growth/CouponManager";
import BookingSystem from "../components/growth/BookingSystem";
import BusinessQA from "../components/BusinessQA";
import ChatBox from "../components/ChatBox";
import { HiStar } from "react-icons/hi2";
// useComparison import removed
import { FaChartBar, FaCheck, FaPlus } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import WishlistButton from "../components/WishlistButton";
import ReportModal from "../components/ReportModal";
import { FiFlag } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Highlights from "../components/Highlights";
import { BusinessDetailsSkeleton } from "../components/Skeleton";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  // useComparison variables removed as they are unused
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [liveStatus, setLiveStatus] = useState({
    isOwnerOnline: false,
    activeVisitors: 0,
  });


  useEffect(() => {
    if (business) {
      setLiveStatus({
        isOwnerOnline: business.isOwnerOnline || false,
        activeVisitors: business.activeVisitors || 0,
      });
    }
  }, [business]);

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinBusinessPage", { businessId: id });

    const handleStatusUpdate = (data) => {
      if (data.businessId === id) {
        setLiveStatus({
          isOwnerOnline: data.isOwnerOnline,
          activeVisitors: data.activeVisitors,
        });
      }
    };

    socket.on("businessStatusUpdate", handleStatusUpdate);

    return () => {
      socket.emit("leaveBusinessPage", { businessId: id });
      socket.off("businessStatusUpdate", handleStatusUpdate);
    };
  }, [id]);

  const incrementVisits = useCallback(async (businessData) => {
    try {
      if (user?.id === businessData?.ownerId) return;

      const storageKey = `loko_v_${id}`;
      const lastVisit = localStorage.getItem(storageKey);
      const today = new Date().toDateString();

      if (lastVisit === today) return;

      await businessService.incrementVisits(id);
      localStorage.setItem(storageKey, today);
    } catch (err) {
      console.error("Error incrementing visits:", err);
    }
  }, [id, user]);

  const fetchBusinessDetails = useCallback(async () => {
    try {
      const response = await businessService.getBusinessById(id);
      setBusiness(response.data);
      incrementVisits(response.data);
      if (user) {
        recommendationService.trackInteraction("view", "business", id);
      }
    } catch (err) {
      console.error("Error fetching business:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user, incrementVisits]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBusinessDetails();
  }, [id, fetchBusinessDetails]);

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

  const handleHelpfulVote = async (reviewerId, reviewId) => {
    if (!user) {
      return toast.error("Please login to vote a review as helpful");
    }
    if (reviewerId === user.id) {
      return toast.error("You cannot vote your own review as helpful");
    }
    try {
      await influencerService.voteHelpful(reviewerId, business._id, reviewId);
      toast.success("Review voted helpful!");
      fetchBusinessDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit helpful vote");
    }
  };

  if (loading) return <BusinessDetailsSkeleton />;
  if (!business)
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center text-center px-6">
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
    { id: "booking", label: "Appointments", icon: <HiOutlineCalendarDays /> },
    { id: "qa", label: "Q&A", icon: <HiOutlineChatBubbleLeftRight /> },
  ];

  if (user?.id === business?.ownerId) {
    tabs.push({
      id: "growth",
      label: "Growth Tools",
      icon: <HiOutlineChartBar />,
    });
  }

  const format12h = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  return (
    <div className="min-h-screen bg-[#080e1a] pt-32 md:pt-40 pb-10 sm:pb-20">
      <style>{`
        .bd * { font-family: 'DM Sans', sans-serif; }
        .no-sb::-webkit-scrollbar { display: none; }
        .bd select option { background: #111827; color: #e2e8f0; }
      `}</style>

      <div className="bd w-[96%] max-w-none mx-auto px-2 sm:px-4 lg:px-6">
        <Link to="/explore" className="inline-block">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white hover:text-slate-300 text-xs font-medium transition-colors">
              <HiOutlineArrowLeft className="text-sm" /> Back to Results
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowReport(true);
              }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#1f2a3d] text-white hover:text-rose-400 hover:border-rose-900/40 hover:bg-rose-950/20 transition-all"
            >
              <FiFlag className="text-xs" /> Report Business
            </button>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-[#0f141e]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 overflow-hidden shadow-2xl shadow-primary/5"
        >
          {/* Subtle Banner Background Gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-r from-primary/10 via-violet-500/10 to-transparent pointer-events-none border-b border-white/5" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start lg:items-center">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.5rem] bg-[#0a0f1a] border-4 border-[#0f141e] shadow-xl overflow-hidden shrink-0 flex items-center justify-center -mt-2 sm:-mt-4 lg:mt-0 lg:-ml-2 z-20">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.businessName}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
              ) : (
                <HiOutlineBuildingStorefront className="text-5xl sm:text-6xl text-slate-700" />
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-center lg:mt-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-white font-black text-3xl sm:text-4xl tracking-tight leading-snug truncate max-w-full">
                  {business.businessName}
                </h1>
                {business.verified && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold shadow-inner shrink-0">
                    <HiOutlineCheckBadge className="text-sm" /> Verified
                  </span>
                )}
                {business.ownerPlan === "platinum" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded-lg text-xs font-bold shadow-inner shrink-0">
                    💎 Lokonomy Guarantee
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-inner transition-colors ${
                  business.isOpenNow 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${business.isOpenNow ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`} />
                  {business.isOpenNow ? "Open Now" : "Closed"}
                </span>
                
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-[11px] font-bold shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                  {liveStatus.activeVisitors} online
                </span>

                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-inner transition-colors ${
                  liveStatus.isOwnerOnline 
                    ? "bg-sky-500/10 border-sky-500/20 text-sky-400" 
                    : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.isOwnerOnline ? "bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" : "bg-slate-500"}`} />
                  {liveStatus.isOwnerOnline ? "Owner Online" : "Owner Offline"}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 shadow-sm">
                  {[...Array(5)].map((_, i) => (
                    <HiStar
                      key={i}
                      className={`text-sm ${i < Math.round(business.rating || 0) ? "text-amber-400" : "text-slate-700"}`}
                    />
                  ))}
                  <span className="text-amber-400 font-bold text-sm ml-1">
                    {business.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  ({business.reviews?.length || 0} reviews)
                </span>
              </div>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-4xl line-clamp-3 lg:line-clamp-none">
                {business.description ||
                  "Professional service provider dedicated to excellence in our community."}
              </p>

              <div className="flex flex-wrap gap-2 lg:gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/5 border border-violet-500/20 text-violet-300 rounded-xl text-xs font-bold backdrop-blur-sm">
                  <HiOutlineTag className="text-sm" />
                  {business.mainCategory}
                </span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold backdrop-blur-sm hover:bg-white/10 transition-colors">
                  {business.subCategory}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <HiOutlineMapPin className="text-rose-400 text-sm" />
                  <span className="truncate max-w-[200px] sm:max-w-none">
                    {business.locationAddress ||
                      business.address ||
                      business.state ||
                      "India"}
                  </span>
                </span>
              </div>
            </div>

            {/* Actions / CTA Section */}
            <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 w-full lg:w-48 shrink-0 lg:mt-8 relative z-20">
              <a
                href={`tel:+91${business?.contactNumber || ""}`}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] w-full"
              >
                <HiOutlinePhone className="text-lg" /> Call Now
              </a>
              {user?.id !== business.ownerId && (
                <button
                  onClick={() => {
                    if (!user) return navigate("/login");
                    setShowChat(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-3.5 rounded-xl transition-all shadow-lg w-full"
                >
                  <HiOutlineChatBubbleLeftRight className="text-lg" /> Message
                </button>
              )}
              {business.website && (
                <a
                  href={formatUrl(business.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm font-bold px-4 py-3.5 rounded-xl transition-all active:scale-95 w-full"
                >
                  <HiOutlineGlobeAlt className="text-lg" /> Website
                </a>
              )}
              <WishlistButton
                type="business"
                id={business._id}
                className="flex items-center justify-center gap-2 px-4 py-3.5 w-full active:scale-95 border border-white/10"
                aria-label="Add to wishlist"
              >
                Wishlist
              </WishlistButton>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Highlights ownerId={business.ownerId} />
        </motion.div>

        <div className="flex items-center gap-2 bg-[#0f141e]/90 border border-white/10 rounded-[1.5rem] p-2 mb-6 sm:mb-8 overflow-x-auto no-sb sticky top-20 z-10 backdrop-blur-2xl shadow-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-none sm:flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-300 whitespace-nowrap outline-none
                ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <span className={`text-[17px] transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : ""}`}>{tab.icon}</span>
              <span className="tracking-wide">{tab.label}</span>
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
              <div className="grid lg:grid-cols-3 min-[2560px]:grid-cols-4 min-[3840px]:grid-cols-5 min-[5120px]:grid-cols-6 min-[7680px]:grid-cols-8 gap-5 xl:gap-8">
                <div className="lg:col-span-2 min-[2560px]:col-span-3 min-[3840px]:col-span-4 min-[5120px]:col-span-5 min-[7680px]:col-span-7 space-y-6">
                  <div className="bg-[#0f141e]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl">
                    <h3 className="flex items-center gap-3 text-white font-bold text-lg mb-6 pb-5 border-b border-white/10">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <HiOutlineInformationCircle className="text-primary text-xl" />
                      </div>
                      Business Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          label: "Owner",
                          value: business.ownerName,
                          icon: <HiOutlineUser className="text-lg transition-colors" />,
                        },
                        {
                          label: "Email",
                          value: business.email || "N/A",
                          icon: <HiOutlineEnvelope className="text-lg transition-colors" />,
                        },
                        {
                          label: "Address",
                          value:
                            business.locationAddress ||
                            business.address ||
                            "Not specified",
                          icon: <HiOutlineMapPin className="text-lg transition-colors" />,
                        },
                        {
                          label: "State",
                          value: business.state || "India",
                          icon: <HiOutlineMapPin className="text-lg transition-colors" />,
                        },
                        {
                          label: "Pincode",
                          value: business.pincode || "N/A",
                          icon: <HiOutlineMapPin className="text-lg transition-colors" />,
                        },
                        {
                          label: "Total Visits",
                          value: `${business.visits ?? 0} visitors`,
                          icon: <HiOutlineArrowTopRightOnSquare className="text-lg transition-colors" />,
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="group bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-primary/40 hover:bg-white/10 transition-all duration-500 relative overflow-hidden cursor-default flex flex-col justify-center"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          <div className="flex items-center gap-3.5 relative z-10">
                            <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 shadow-inner text-slate-400 group-hover:text-primary group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-500">
                              {item.icon}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mb-0.5 group-hover:text-primary/80 transition-colors duration-500">
                                {item.label}
                              </span>
                              <span
                                className="text-slate-200 font-semibold text-sm truncate group-hover:text-white transition-colors duration-500"
                                title={item.value}
                              >
                                {item.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>



                    {(business.facebookLink ||
                      business.instagramLink ||
                      business.youtubeLink ||
                      business.twitterLink) && (
                      <div className="mt-5 pt-5 border-t border-[#1f2a3d]">
                        <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest mb-3">
                          Follow Us
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {business.facebookLink && (
                            <a
                              href={formatUrl(business.facebookLink)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            >
                              <FaFacebook className="text-sm" /> Facebook
                            </a>
                          )}
                          {business.instagramLink && (
                            <a
                              href={formatUrl(business.instagramLink)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            >
                              <FaInstagram className="text-sm" /> Instagram
                            </a>
                          )}
                          {business.youtubeLink && (
                            <a
                              href={formatUrl(business.youtubeLink)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                            >
                              <FaYoutube className="text-sm" /> YouTube
                            </a>
                          )}
                          {business.twitterLink && (
                            <a
                              href={formatUrl(business.twitterLink)}
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
                          <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest">
                            Gallery Preview
                          </p>
                          <button
                            onClick={() => setActiveTab("gallery")}
                            className="group flex items-center cursor-pointer gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                          >
                            View All <HiOutlineArrowRight className="text-[13px] opacity-80 group-hover:translate-x-0.5 transition-transform" />
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
                            <span className="text-slate-300 font-semibold text-sm w-20 sm:w-24">
                              {day.slice(0, 3)}
                              <span className="hidden sm:inline">
                                {day.slice(3)}
                              </span>
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
                        <p className="text-slate-300 leading-relaxed font-medium">
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

                      <p className="text-slate-300 mt-3 pt-3 border-t border-[#1f2a3d]/50">
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-slate-200 font-semibold text-sm">
                                  {review.userName}
                                </p>
                                {review.influencerBadge && review.influencerBadge !== "none" && (
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border
                                    ${review.influencerBadge === "ambassador" 
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                      : review.influencerBadge === "influencer" 
                                        ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" 
                                        : "bg-sky-500/10 text-sky-400 border-sky-500/20"}`}
                                  >
                                    ✨ {review.influencerBadge.replace("_", " ")}
                                  </span>
                                )}
                              </div>
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
                        {review.userId && review.userId !== user?.id && (
                          <div className="flex justify-end mt-3 pt-2 border-t border-[#1f2a3d]/20">
                            <button
                              type="button"
                              onClick={() => !review.helpfulVotes?.includes(user?.id) && handleHelpfulVote(review.userId, review._id)}
                              disabled={review.helpfulVotes?.includes(user?.id)}
                              className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                                review.helpfulVotes?.includes(user?.id)
                                  ? "text-violet-400 bg-violet-500/10 border border-violet-500/30 cursor-default"
                                  : "text-slate-400 hover:text-violet-400 bg-[#0d1424] hover:bg-[#131d2e] border border-[#1f2a3d] hover:border-violet-500/30"
                              }`}
                            >
                              👍 {review.helpfulVotes?.includes(user?.id) ? "Helpful" : "Helpful"} {review.helpfulVotes?.length > 0 && `(${review.helpfulVotes.length})`}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-20 text-center">
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
            {activeTab === "booking" && (
              <div className="max-w-2xl mx-auto">
                <BookingSystem
                  businessId={id}
                  isOwner={user?.id === business.ownerId}
                  ownerId={business.ownerId}
                />
              </div>
            )}

            {activeTab === "qa" && (
              <BusinessQA
                businessId={id}
                isOwner={user?.id === business.ownerId}
              />
            )}

            {activeTab === "growth" && user?.id === business.ownerId && (
              <div className="space-y-6">
                <BusinessAnalytics
                  businessId={id}
                  plan={user.subscription?.plan}
                />
                <CouponManager businessId={id} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="business"
        targetId={business._id}
      />

      <AnimatePresence>
        {showChat && (
          <ChatBox
            chatType="business_inquiry"
            businessId={business._id}
            businessName={business.businessName}
            ownerId={business.ownerId}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessDetails;
