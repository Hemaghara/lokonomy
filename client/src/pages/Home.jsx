import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { categories } from "../data/categories";
import SmartSearch from "../components/SmartSearch";
import recommendationService from "../services/recommendationService";
import { feedService } from "../services/feedService";
import {
  Store,
  ShoppingBag,
  Briefcase,
  Sparkles,
  ArrowRight,
  Users,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe,
  MapPin,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";

const Pill = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] text-blue-300 bg-[rgba(79,110,247,0.18)] border border-[rgba(79,110,247,0.27)]">
    {children}
  </span>
);

const Counter = ({ value }) => (
  <motion.span
    initial={{ opacity: 0, y: 8 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    {value}
  </motion.span>
);
const Home = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState({
    businesses: [],
    products: [],
    jobs: [],
  });
  const [isRecLoading, setIsRecLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const data = await recommendationService.getRecommendations();
        setRecommendations(data);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setIsRecLoading(false);
      }
    };
    fetchRecs();

    const fetchEvents = async () => {
      try {
        const res = await feedService.getFeeds({ type: "Event" });
        if (res.data.success) {
          setEvents(res.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setIsEventsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const displayedCategories = categories.slice(0, 8);

  const hasRecommendations =
    recommendations.businesses.length > 0 ||
    recommendations.products.length > 0 ||
    recommendations.jobs.length > 0;

  const stats = [
    {
      label: "Active Users",
      value: "2k+",
      icon: <Users size={18} />,
      iconWrap:
        "bg-[rgba(79,110,247,0.09)] border-[rgba(79,110,247,0.19)] text-[#4f6ef7]",
    },
    {
      label: "Local Businesses",
      value: "450+",
      icon: <Store size={18} />,
      iconWrap:
        "bg-[rgba(16,185,129,0.09)] border-[rgba(16,185,129,0.19)] text-[#10b981]",
    },
    {
      label: "Daily Trades",
      value: "150+",
      icon: <TrendingUp size={18} />,
      iconWrap:
        "bg-[rgba(244,114,182,0.09)] border-[rgba(244,114,182,0.19)] text-[#f472b6]",
    },
    {
      label: "Safe & Secure",
      value: "100%",
      icon: <ShieldCheck size={18} />,
      iconWrap:
        "bg-[rgba(251,191,36,0.09)] border-[rgba(251,191,36,0.19)] text-[#fbbf24]",
    },
  ];

  const steps = [
    {
      title: "Discover",
      desc: "Find verified local services, businesses and job opportunities in your area.",
      icon: <Globe size={22} />,
      num: "01",
      iconWrap:
        "bg-[rgba(79,110,247,0.09)] border-[rgba(79,110,247,0.19)] text-[#4f6ef7]",
      numColor: "text-[#4f6ef7] border-[rgba(79,110,247,0.19)]",
    },
    {
      title: "Connect",
      desc: "Chat directly with sellers or business owners to get more details.",
      icon: <Zap size={22} />,
      num: "02",
      iconWrap:
        "bg-[rgba(16,185,129,0.09)] border-[rgba(16,185,129,0.19)] text-[#10b981]",
      numColor: "text-[#10b981] border-[rgba(16,185,129,0.19)]",
    },
    {
      title: "Transact",
      desc: "Securely trade goods, book services, or apply for jobs with confidence.",
      icon: <Users size={22} />,
      num: "03",
      iconWrap:
        "bg-[rgba(244,114,182,0.09)] border-[rgba(244,114,182,0.19)] text-[#f472b6]",
      numColor: "text-[#f472b6] border-[rgba(244,114,182,0.19)]",
    },
  ];
  const recCards = [
    {
      items: recommendations.businesses.slice(0, 1),
      label: "Business",
      accentText: "text-[#4f6ef7]",
      iconWrap:
        "bg-[rgba(79,110,247,0.09)] border-[rgba(79,110,247,0.19)] text-[#4f6ef7]",
      tagWrap:
        "bg-[rgba(79,110,247,0.09)] border-[rgba(79,110,247,0.15)] text-[#4f6ef7]",
      bar: "from-[#4f6ef7] to-[rgba(79,110,247,0.53)]",
      Icon: Store,
      getTitle: (x) => x.businessName,
      getSub: (x) => x.district || "Local Area",
      getDesc: (x) =>
        x.description ||
        "Expert services and local excellence in your neighborhood.",
      getNav: (x) => `/business/${x._id}`,
      trackType: "business",
    },
    {
      items: recommendations.products.slice(0, 1),
      label: "Product",
      accentText: "text-[#f472b6]",
      iconWrap:
        "bg-[rgba(244,114,182,0.09)] border-[rgba(244,114,182,0.19)] text-[#f472b6]",
      tagWrap:
        "bg-[rgba(244,114,182,0.09)] border-[rgba(244,114,182,0.15)] text-[#f472b6]",
      bar: "from-[#f472b6] to-[rgba(244,114,182,0.53)]",
      Icon: ShoppingBag,
      getTitle: (x) => x.productName,
      getSub: (x) => `₹${x.price.toLocaleString()}`,
      getDesc: (x) =>
        x.description || "High-quality products available for you right now.",
      getNav: (x) => `/market/product/${x._id}`,
      trackType: "product",
    },
    {
      items: recommendations.jobs.slice(0, 1),
      label: "Career",
      accentText: "text-[#10b981]",
      iconWrap:
        "bg-[rgba(16,185,129,0.09)] border-[rgba(16,185,129,0.19)] text-[#10b981]",
      tagWrap:
        "bg-[rgba(16,185,129,0.09)] border-[rgba(16,185,129,0.15)] text-[#10b981]",
      bar: "from-[#10b981] to-[rgba(16,185,129,0.53)]",
      Icon: Briefcase,
      getTitle: (x) => x.position,
      getSub: (x) => x.district,
      getDesc: (x) => x.salary,
      getNav: (x) => `/jobs/${x._id}`,
      trackType: "job",
    },
  ];
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#07090f]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Helmet>
        <title>Lokonomy | Your Local Economy Connected</title>
        <meta name="description" content="Lokonomy is the all-in-one platform to discover, connect, and grow with the businesses and people right in your neighborhood." />
      </Helmet>
      <style>{`
        /* Grid background — multi-layer gradient, not doable in Tailwind */
        .lk-grid-bg {
          background-image:
            linear-gradient(rgba(79,110,247,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,110,247,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Noise texture — SVG data-URI, not doable in Tailwind */
        .lk-noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px;
        }

        /* Orb — filter:blur large values, not safely in Tailwind */
        .lk-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }

        /* Step connector line — ::after pseudo element */
        .lk-step-line::after {
          content: '';
          position: absolute;
          top: 28px;
          left: calc(100% + 16px);
          width: calc(100% - 32px);
          height: 1px;
          background: linear-gradient(90deg, rgba(79,110,247,0.4), transparent);
        }

        /* Webkit gradient text */
        .lk-accent-text {
          background: linear-gradient(135deg, #4f6ef7, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (max-width: 640px) {
          .lk-hero-title { font-size: clamp(2.4rem, 10vw, 4rem) !important; }
          .lk-step-line::after { display: none; }
        }
      `}</style>
      <div className="lk-noise" />
      <div
        className="lk-orb"
        style={{
          width: 600,
          height: 600,
          top: "-15%",
          left: "-15%",
          background: "rgba(79,110,247,0.07)",
        }}
      />
      <div
        className="lk-orb"
        style={{
          width: 500,
          height: 500,
          bottom: "-10%",
          right: "-10%",
          background: "rgba(124,58,237,0.07)",
        }}
      />

      <main className="relative z-10">
        <section className="lk-grid-bg min-h-screen flex flex-col justify-center items-center px-4 pt-28 pb-20 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-linear-to-r from-transparent via-[rgba(79,110,247,0.12)] to-transparent pointer-events-none" />

          <div className="max-w-5xl w-full mx-auto flex flex-col items-center text-center gap-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Pill>
                <Sparkles size={12} /> Re-imagining Local Economy
              </Pill>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="lk-hero-title text-white font-black leading-[1.08] tracking-[-0.03em]"
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
            >
              Empowering Your <br />
              <span className="lk-accent-text">Local Community.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-white/50 text-[1.1rem] max-w-130 leading-[1.7]"
            >
              Lokonomy is the all-in-one platform to discover, connect, and grow
              with the businesses and people right in your neighborhood.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="w-full max-w-2xl"
            >
              <div className="bg-[#0d1120] border border-[rgba(79,110,247,0.3)] rounded-[18px] shadow-[0_0_0_6px_rgba(79,110,247,0.06),0_24px_64px_rgba(0,0,0,0.4)] p-2">
                <SmartSearch />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-3 justify-center"
            >
              <Link
                to="/explore"
                className="bg-linear-to-br from-[#4f6ef7] to-[#7c3aed] text-white py-3.5 px-8 rounded-[14px] font-extrabold text-[13px] tracking-[0.05em] uppercase inline-flex items-center gap-2 shadow-[0_8px_32px_rgba(79,110,247,0.3)] hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(79,110,247,0.4)] transition-all duration-200"
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <Link
                to="/market"
                className="bg-white/4 text-white/75 py-3.5 px-8 rounded-[14px] font-bold text-[13px] tracking-[0.05em] uppercase border border-white/9 inline-flex items-center gap-2 hover:bg-white/8 hover:text-white transition-all duration-200"
              >
                View Marketplace
              </Link>
            </motion.div>
          </div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          >
            <div className="w-px h-10 bg-linear-to-b from-[rgba(79,110,247,0.6)] to-transparent" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/25">
              Scroll
            </span>
          </motion.div>
        </section>
        <section className="px-4 py-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-[#0d1120] border border-white/[0.07] rounded-[20px] hover:border-[rgba(79,110,247,0.35)] hover:shadow-[0_0_32px_rgba(79,110,247,0.12)] transition-all duration-200 p-7 text-center"
              >
                <div
                  className={`w-11 h-11 rounded-[14px] border flex items-center justify-center mx-auto mb-3.5 ${stat.iconWrap}`}
                >
                  {stat.icon}
                </div>

                <div className="text-[2rem] font-black text-white leading-none">
                  <Counter value={stat.value} />
                </div>

                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/35 mt-1.5">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        {hasRecommendations && (
          <section className="px-4 py-20 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <Pill>
                  <Sparkles size={11} /> Personalised
                </Pill>
                <h2
                  className="text-white font-black tracking-[-0.02em] mt-2.5"
                  style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
                >
                  Curated for you
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Smart suggestions based on your interests and location.
                </p>
              </div>
              <button
                onClick={() => navigate("/explore")}
                className="text-[#4f6ef7] font-bold text-[13px] flex items-center gap-1.5 bg-transparent border-none cursor-pointer whitespace-nowrap hover:text-[#7c9fff] transition-colors duration-200"
              >
                See all <ArrowRight size={15} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recCards.map(
                ({
                  items,
                  label,
                  accentText,
                  iconWrap,
                  tagWrap,
                  bar,
                  Icon,
                  getTitle,
                  getSub,
                  getDesc,
                  getNav,
                  trackType,
                }) =>
                  items.map((item) => (
                    <motion.div
                      key={item._id}
                      whileHover={{ y: -6 }}
                      onClick={() => {
                        recommendationService.trackInteraction(
                          "click",
                          trackType,
                          item._id,
                        );
                        navigate(getNav(item));
                      }}
                      className="bg-[#0d1120] border border-white/[0.07] rounded-[20px] hover:border-[rgba(79,110,247,0.35)] hover:shadow-[0_0_32px_rgba(79,110,247,0.12)] transition-all duration-200 cursor-pointer overflow-hidden"
                    >
                      <div className={`h-1.5 bg-linear-to-r ${bar}`} />

                      <div className="p-6 pb-7">
                        <div className="flex items-center gap-3.5 mb-4">
                          <div
                            className={`w-11 h-11 rounded-[14px] border flex items-center justify-center shrink-0 ${iconWrap}`}
                          >
                            <Icon size={20} />
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-[0.12em] uppercase border mb-1 ${tagWrap}`}
                            >
                              {label}
                            </span>
                            <h3 className="font-extrabold text-[0.95rem] text-white overflow-hidden text-ellipsis whitespace-nowrap">
                              {getTitle(item)}
                            </h3>
                          </div>
                        </div>

                        <p className="text-[0.8rem] text-white/45 leading-[1.6] mb-4 line-clamp-2">
                          {getDesc(item)}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-[0.78rem] font-semibold text-white/40 flex items-center gap-1">
                            <MapPin size={11} /> {getSub(item)}
                          </span>
                          <span
                            className={`text-[11px] font-extrabold tracking-[0.08em] uppercase flex items-center gap-1 ${accentText}`}
                          >
                            View <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )),
              )}
            </div>
          </section>
        )}

        <section className="px-4 py-20 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <Pill>
                <Calendar size={11} /> Events
              </Pill>
              <h2
                className="text-white font-black tracking-[-0.02em] mt-2.5"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
              >
                Events Near You
              </h2>
              <p className="text-white/40 text-sm mt-1">
                Don't miss out on what's happening in your neighborhood.
              </p>
            </div>
            <button
              onClick={() => navigate("/events-map")}
              className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              Open Events Map <MapPin size={14} />
            </button>
          </div>

          {isEventsLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/5 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map((event, idx) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(`/feed/${event._id}`)}
                  className="bg-[#0d1120] border border-white/[0.07] rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer overflow-hidden group"
                >
                  <div className="relative h-40 overflow-hidden">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-500/5 flex items-center justify-center">
                        <Calendar className="text-purple-500/20" size={40} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-[#0d1120]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                        Event
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-white font-bold text-sm mb-3 line-clamp-1 group-hover:text-purple-400 transition-colors">
                      {event.title}
                    </h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-[11px] text-white/40">
                        <Calendar size={12} className="text-purple-500" />
                        {event.eventDate}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/40">
                        <Clock size={12} className="text-purple-500" />
                        {event.eventTime}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/40">
                        <MapPin size={12} className="text-rose-500" />
                        <span className="truncate">{event.locationAddress || "Local Area"}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-white/25">By {event.author}</span>
                      <ChevronRight size={14} className="text-purple-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/2 border border-white/5 rounded-3xl">
              <Calendar className="mx-auto text-white/10 mb-4" size={48} />
              <p className="text-white/30 text-sm font-medium">No events scheduled recently near you.</p>
              <button 
                onClick={() => navigate("/feed/post")}
                className="mt-4 text-purple-400 font-bold text-xs hover:text-purple-300 transition-colors"
              >
                + Create First Event
              </button>
            </div>
          )}
        </section>
        <section className="px-4 py-20 max-w-6xl mx-auto">
          <div className="bg-linear-to-br from-[rgba(79,110,247,0.06)] to-[rgba(124,58,237,0.06)] border border-[rgba(79,110,247,0.15)] rounded-[28px] p-[clamp(32px,6vw,72px)]">
            <div className="text-center mb-14">
              <Pill>Simple process</Pill>
              <h2
                className="text-white font-black tracking-[-0.02em] mt-3"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
              >
                How it Works
              </h2>
              <p className="text-white/40 text-[0.9rem] max-w-105 mx-auto mt-2.5">
                Get started in three simple steps and unlock the full potential
                of your local economy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`text-center relative ${i < 2 ? "lk-step-line" : ""}`}
                >
                  <div className="relative inline-block mb-5">
                    <div
                      className={`w-15 h-15 rounded-[20px] border flex items-center justify-center mx-auto ${step.iconWrap}`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`absolute -top-2 -right-2.5 font-mono text-[10px] font-bold bg-[#07090f] px-1.25 py-0.5 rounded-md border ${step.numColor}`}
                    >
                      {step.num}
                    </span>
                  </div>

                  <h3 className="font-black text-[1.1rem] text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[0.82rem] text-white/40 leading-[1.65] max-w-60 mx-auto">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-4 py-20 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <Pill>Explore</Pill>
              <h2
                className="text-white font-black tracking-[-0.02em] mt-2.5"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
              >
                Browse Categories
              </h2>
              <p className="text-white/40 text-sm mt-1">
                Explore our wide range of services and industries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {displayedCategories.map((cat, idx) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => navigate(`/category/${cat.name}`)}
                  className="bg-[#0d1120] border border-white/[0.07] rounded-[20px] hover:border-[rgba(79,110,247,0.35)] hover:shadow-[0_0_32px_rgba(79,110,247,0.12)] transition-all duration-200 p-7 text-center cursor-pointer flex flex-col items-center gap-3.5"
                >
                  <div className="w-14 h-14 rounded-[18px] bg-[rgba(79,110,247,0.1)] border border-[rgba(79,110,247,0.15)] flex items-center justify-center text-[26px]">
                    {cat.icon}
                  </div>
                  <span className="font-extrabold text-[0.8rem] text-white/75 tracking-[0.02em] overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                    {cat.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-9 flex justify-center">
            <Link
              to="/explore/all"
              className="bg-white/4 text-white/75 py-3.5 px-8 rounded-[14px] font-bold text-[13px] tracking-[0.05em] uppercase border border-white/9 inline-flex items-center gap-2 hover:bg-white/8 hover:text-white transition-all duration-200"
            >
              Explore All Categories <ArrowRight size={15} />
            </Link>
          </div>
        </section>
        <section className="px-4 py-10 pb-28 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-4xl overflow-hidden bg-linear-to-br from-[#1a1f3d] via-[#111827] to-[#1a0a2e] border border-[rgba(79,110,247,0.2)] text-center relative"
            style={{ padding: "clamp(40px,8vw,80px) clamp(24px,6vw,72px)" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(79,110,247,0.12) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(79,110,247,0.12), transparent 70%)",
              }}
            />

            <div className="relative z-1">
              <Pill>
                <Zap size={11} /> Join the Movement
              </Pill>
              <h2
                className="text-white font-black leading-[1.1] tracking-[-0.03em] mt-5 mb-4"
                style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)" }}
              >
                Ready to Boost Your <br className="hidden sm:block" />
                <span className="lk-accent-text">Local Business?</span>
              </h2>
              <p className="text-white/50 text-[1rem] max-w-120 mx-auto mb-9 leading-[1.7]">
                Join thousands of local members trading, connecting, and
                building a stronger economy together. It only takes 2 minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/register"
                  className="bg-linear-to-br from-[#4f6ef7] to-[#7c3aed] text-white py-3.5 px-8 rounded-[14px] font-extrabold text-[13px] tracking-[0.05em] uppercase inline-flex items-center gap-2 shadow-[0_8px_32px_rgba(79,110,247,0.3)] hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(79,110,247,0.4)] transition-all duration-200"
                >
                  Register Now <ArrowRight size={15} />
                </Link>
                <Link
                  to="/login"
                  className="bg-white/4 text-white/75 py-3.5 px-8 rounded-[14px] font-bold text-[13px] tracking-[0.05em] uppercase border border-white/9 inline-flex items-center gap-2 hover:bg-white/8 hover:text-white transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      <footer className="bg-[#060810] border-t border-white/5 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-linear-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center font-black text-white text-[18px]">
                  L
                </div>
                <span className="font-black text-[1.1rem] text-white">
                  Lokonomy
                </span>
              </div>
              <p className="text-[0.82rem] text-white/35 leading-[1.7] max-w-55">
                Connecting people and local businesses for a sustainable and
                thriving community economy.
              </p>
            </div>

            {[
              {
                title: "Platform",
                links: ["Marketplace", "Services", "Job Board", "Feed"],
              },
              {
                title: "Company",
                links: ["About Us", "Contact", "FAQ", "Blog"],
              },
            ].map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h4 className="text-[10px] font-extrabold tracking-[0.14em] uppercase text-white/50">
                  {col.title}
                </h4>
                {col.links.map((l) => (
                  <span
                    key={l}
                    className="text-[0.82rem] text-white/35 cursor-pointer hover:text-white transition-colors duration-200"
                  >
                    {l}
                  </span>
                ))}
              </div>
            ))}

            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-extrabold tracking-[0.14em] uppercase text-white/50">
                Stay Connected
              </h4>
              <div className="flex gap-2.5 mt-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-white/4 border border-white/8 flex items-center justify-center cursor-pointer hover:bg-[#4f6ef7] transition-colors duration-200"
                  >
                    <Globe size={15} className="text-white/50" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex flex-row flex-wrap justify-between items-center gap-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/20">
              © 2024 Lokonomy Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              {["Privacy Policy", "Terms of Service"].map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-bold tracking-widest uppercase text-white/20 cursor-pointer hover:text-white/60 transition-colors duration-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
