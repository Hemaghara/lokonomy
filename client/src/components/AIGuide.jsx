import React, { useState, useEffect, useRef } from "react";
import {
  Link,
  useNavigate,
  useLocation as useRouteLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,
  ShoppingBag,
  Newspaper,
  MapPin,
  Search,
  PlusCircle,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import { askLocalGuide } from "../services";
import { businessService } from "../services";
import { storyService } from "../services";
import { jobService } from "../services";
import { useUser } from "../context/UserContext";
import { useLocation } from "../context/LocationContext";
import { FaBullseye } from "react-icons/fa";

const QUICK_ACTIONS = [
  {
    label: "Nearby Plumbers",
    icon: <Search size={12} />,
    query: "Find me some reliable plumbers nearby",
  },
  {
    label: "Sell Product",
    icon: <PlusCircle size={12} />,
    query: "How do I sell a product on Lokonomy?",
    action: "/market/sell",
  },
  {
    label: "Local Jobs",
    icon: <ShoppingBag size={12} />,
    query: "Show me available job opportunities in my area",
  },
  {
    label: "Latest Stories",
    icon: <Newspaper size={12} />,
    query: "What's happening in my community? Show me recent stories.",
  },
];

const AIGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your Lokonomy Local Guide. I can help you find shops within 3km, latest stories, or specific services. How can I help you today?",
    },
  ]);
  const [coords, setCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { state, setState, district, setDistrict, taluka, setTaluka } =
    useLocation();
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();
  const scrollRef = useRef(null);

  // Hide AIGuide FAB when ChatBox is open (prevents overlap on mobile)
  useEffect(() => {
    const handleChatBoxVisibility = (e) => {
      setChatBoxOpen(e.detail.visible);
    };
    window.addEventListener("chatbox-visibility", handleChatBoxVisibility);
    return () => {
      window.removeEventListener("chatbox-visibility", handleChatBoxVisibility);
    };
  }, []);

  const handleAutoLocate = () => {
    if (!navigator.geolocation) return;
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          setCoords({ lat, lng });
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const newDist =
              addr.state_district || addr.city || addr.county || "";
            const newTal =
              addr.suburb ||
              addr.town ||
              addr.village ||
              addr.city_district ||
              "";
            const newState = addr.state || "Gujarat";

            setState(newState);
            setDistrict(newDist.replace(/ District/i, ""));
            setTaluka(newTal);
          }
        } catch (err) {
          console.error("Auto-locate failed", err);
        } finally {
          setIsLoading(false);
        }
      },
      () => setIsLoading(false),
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const locationString =
    [taluka, district, state].filter(Boolean).join(", ") || "India";

  const handleSend = async (customQuery) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim() || isLoading) return;

    const userMessage = { role: "user", content: finalQuery };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const searchTerm = finalQuery
        .toLowerCase()
        .replace(
          /\b(find|near|by|me|show|is|a|of|the|in|search|for|any|type|shop|give|suggestion|can|you|tell|about|what|where|website|platform|lokonomy|please|recommend|looking)\b/g,
          "",
        )
        .replace(/\s+/g, " ")
        .trim();

      let bizRes = await businessService.getBusinesses({
        search: searchTerm || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        radius: 3000,
        district: !coords ? district : undefined,
        limit: 20,
      });

      let businesses = Array.isArray(bizRes.data)
        ? bizRes.data
        : bizRes.data.businesses || [];
      if (businesses.length === 0) {
        bizRes = await businessService.getBusinesses({
          district: district || undefined,
          limit: 20,
        });
        businesses = Array.isArray(bizRes.data)
          ? bizRes.data
          : bizRes.data.businesses || [];
      }

      const contextBusinesses = businesses.map((b) => ({
        id: b._id,
        name: b.businessName,
        cat: b.mainCategory || b.category,
        sub: b.subCategory,
        loc: b.taluka || b.district,
        desc: b.description,
      }));
      const storyRes = await storyService.getStories({
        search: searchTerm || undefined,
        district: district || undefined,
        limit: 10,
      });

      const storyData =
        storyRes.data?.data ||
        storyRes.data?.stories ||
        (Array.isArray(storyRes.data) ? storyRes.data : []);
      const contextStories = storyData.map((s) => ({
        id: s._id,
        title: s.title,
        loc: s.taluka || s.district,
      }));

      const jobRes = await jobService.getJobs({
        search: searchTerm || undefined,
        district: district || undefined,
        limit: 10,
      });
      const jobData = Array.isArray(jobRes.data)
        ? jobRes.data
        : jobRes.data.jobs || [];
      const contextJobs = jobData.map((j) => ({
        id: j._id,
        title: j.position,
        loc: j.location || j.district,
        salary: j.salary,
      }));

      const context = {
        userName: user?.name,
        location: locationString,
        currentPath: routeLocation.pathname,
        coords: coords,
        businesses: contextBusinesses,
        stories: contextStories,
        jobs: contextJobs,
        isRadiusSearch: !!coords,
      };

      const response = await askLocalGuide(
        finalQuery,
        context,
        messages.slice(-10),
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("AI Guide Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I'm having trouble connecting to live data right now. Please check your internet or try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    if (action.action) {
      setIsOpen(false);
      navigate(action.action);
    } else {
      handleSend(action.query);
    }
  };

  if (chatBoxOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-9999 font-inter">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open chat"
            className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-secondary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
          >
            <Sparkles className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: 1,
              height: isMinimized ? "64px" : "550px",
              width: "380px",
            }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="bg-card-bg border border-border rounded-3xl shadow-2xl overflow-hidden glass flex flex-col"
          >
            <div className="p-4 bg-white/5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">
                    Local Guide
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">
                      {locationString}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoLocate}
                  title="Detect my location"
                  className="p-1.5 hover:bg-white/5 rounded-lg text-primary transition-colors"
                >
                  <FaBullseye size={14} />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-text-dim transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 size={16} />
                  ) : (
                    <Minimize2 size={16} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-text-dim transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                            msg.role === "user"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary/20 text-secondary"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <User size={14} />
                          ) : (
                            <Bot size={14} />
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-white/5 text-text-main border border-border rounded-tl-none shadow-lg"
                          }`}
                        >
                          {msg.content
                            .split(
                              /(\[\[(?:business:|story:|job:)?(?:[^|\]]+)\|(?:[^\]]+)\]\])/g,
                            )
                            .map((part, index) => {
                              const match = part.match(
                                /\[\[(?:(business|story|job):)?([^|\]]+)\|([^\]]+)\]\]/,
                              );
                              if (match) {
                                const type = match[1] ? match[1] : "business";
                                const id = match[2];
                                const title = match[3];
                                const isStory = type === "story";
                                const isJob = type === "job";

                                return (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setIsOpen(false);
                                      if (isStory) navigate(`/stories/${id}`);
                                      else if (isJob) navigate(`/jobs/${id}`);
                                      else navigate(`/business/${id}`);
                                    }}
                                    className={`mx-1 my-1 px-2.5 py-1.5 border rounded-lg font-bold items-center gap-2 transition-all active:scale-95 inline-flex ${
                                      isStory
                                        ? "bg-secondary/20 hover:bg-secondary/30 border-secondary/30 text-secondary"
                                        : isJob
                                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-400"
                                          : "bg-primary/20 hover:bg-primary/30 border-primary/30 text-primary"
                                    }`}
                                  >
                                    {isStory ? (
                                      <Newspaper size={12} />
                                    ) : isJob ? (
                                      <Briefcase
                                        size={12}
                                        className="text-emerald-400"
                                      />
                                    ) : (
                                      <ShoppingBag size={12} />
                                    )}
                                    {title}
                                  </button>
                                );
                              }
                              return part;
                            })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 max-w-[80%]">
                        <div className="w-7 h-7 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                          <Bot size={14} />
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 border border-border rounded-tl-none">
                          <Loader2
                            size={14}
                            className="animate-spin text-secondary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-border rounded-full text-[10px] font-bold text-text-dim hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-white/5">
                  <div className="relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask about businesses, jobs..."
                      className="w-full bg-dark-bg border border-border rounded-xl pl-4 pr-12 py-3 text-xs text-text-main focus:border-primary outline-none transition-all placeholder:text-text-dim/50"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!query.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 transition-all shadow-md"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-text-dim">
                    <Sparkles size={10} className="text-secondary" />
                    Powered by Lokonomy Intelligence
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIGuide;
