import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMapPin,
  HiOutlineXMark,
  HiOutlineBuildingStorefront,
  HiOutlineArrowRight,
  HiOutlinePhone,
  HiStar,
  HiPlus,
  HiMinus,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineMap,
} from "react-icons/hi2";
import { businessService, feedService } from "../services";
import { useLocation } from "../context/LocationContext";

const DEFAULT_CENTER = [22.3, 72.6];

const makePinIcon = (rating, selected = false) => {
  const color = rating >= 4 ? "#10b981" : rating >= 2 ? "#f59e0b" : "#ef4444";
  const size = selected ? 38 : 30;
  const halfH = selected ? 56 : 44;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${halfH}" width="${size}" height="${halfH}">
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
    </filter>
    <path filter="url(#s)" fill="${color}" stroke="#fff" stroke-width="${selected ? 2.5 : 2}"
      d="M${size / 2} 1C${size * 0.26} 1 1 ${size * 0.43} 1 ${size * 0.43}c0 ${size * 0.69} ${size / 2 - 1} ${halfH - size * 0.43 - 1} ${size / 2 - 1} ${halfH - size * 0.43 - 1}S${size - 1} ${size * 1.12} ${size - 1} ${size * 0.43}C${size - 1} ${size * 0.43} ${size * 0.74} 1 ${size / 2} 1z"/>
    <circle fill="#fff" cx="${size / 2}" cy="${size * 0.43}" r="${selected ? 7 : 5.5}"/>
  </svg>`;
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [size, halfH],
    iconAnchor: [size / 2, halfH],
    popupAnchor: [0, -halfH],
  });
};

const makeEventPinIcon = (selected = false) => {
  const color = "#a855f7";
  const size = selected ? 38 : 30;
  const halfH = selected ? 56 : 44;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${halfH}" width="${size}" height="${halfH}">
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
    </filter>
    <path filter="url(#s)" fill="${color}" stroke="#fff" stroke-width="${selected ? 2.5 : 2}"
      d="M${size / 2} 1C${size * 0.26} 1 1 ${size * 0.43} 1 ${size * 0.43}c0 ${size * 0.69} ${size / 2 - 1} ${halfH - size * 0.43 - 1} ${size / 2 - 1} ${halfH - size * 0.43 - 1}S${size - 1} ${size * 1.12} ${size - 1} ${size * 0.43}C${size - 1} ${size * 0.43} ${size * 0.74} 1 ${size / 2} 1z"/>
    <circle fill="#fff" cx="${size / 2}" cy="${size * 0.43}" r="${selected ? 7 : 5.5}"/>
  </svg>`;
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [size, halfH],
    iconAnchor: [size / 2, halfH],
    popupAnchor: [0, -halfH],
  });
};

const userPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
  <circle cx="18" cy="18" r="16" fill="#7c3aed" fill-opacity="0.18"/>
  <circle cx="18" cy="18" r="9" fill="#7c3aed" stroke="#fff" stroke-width="2.5"/>
</svg>`;
const userPinIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(userPinSvg),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const CustomMapControls = ({ userCoords }) => {
  const map = useMap();
  const handleRecenter = () => {
    if (userCoords) {
      map.setView([userCoords.lat, userCoords.lng], 14, { animate: true });
    }
  };
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 shadow-xl transition-all"
      >
        <HiPlus className="text-lg" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 shadow-xl transition-all"
      >
        <HiMinus className="text-lg" />
      </button>
      {userCoords && (
        <button
          type="button"
          onClick={handleRecenter}
          className="w-10 h-10 mt-2 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-violet-400 hover:bg-white/10 shadow-xl transition-all"
        >
          <HiOutlineMapPin className="text-lg" />
        </button>
      )}
    </div>
  );
};

const MapController = ({ items, userCoords }) => {
  const map = useMap();
  useEffect(() => {
    const pts = items.filter((b) => b.location?.coordinates?.length === 2);
    if (pts.length > 0) {
      const bounds = L.latLngBounds(
        pts.map((b) => [b.location.coordinates[1], b.location.coordinates[0]]),
      );
      if (userCoords) bounds.extend([userCoords.lat, userCoords.lng]);
      map.fitBounds(bounds.pad(0.18), { maxZoom: 15, animate: true });
    } else if (userCoords) {
      map.setView([userCoords.lat, userCoords.lng], 13, { animate: true });
    }
  }, [items, userCoords, map]);
  return null;
};

const Stars = ({ rating, size = "text-xs" }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <HiStar
        key={i}
        className={`${size} ${i < Math.round(rating || 0) ? "text-amber-400" : "text-slate-700"}`}
      />
    ))}
  </div>
);

const EventsMap = () => {
  const navigate = useNavigate();
  const { coords } = useLocation();
  const [businesses, setBusinesses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showBusinesses, setShowBusinesses] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bizRes, eventRes] = await Promise.all([
          businessService.getBusinesses(),
          feedService.getFeeds({ type: "Event" }),
        ]);

        if (!isMounted) return;

        if (bizRes.data.success) {
          setBusinesses(
            bizRes.data.data.filter(
              (b) => b.location?.coordinates?.length === 2,
            ),
          );
        }
        if (eventRes.data.success) {
          setEvents(
            eventRes.data.data.filter(
              (e) => e.location?.coordinates?.length === 2,
            ),
          );
        }
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const center = coords ? [coords.lat, coords.lng] : DEFAULT_CENTER;

  const getDirections = (item) => {
    const [lng, lat] = item.location.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank",
    );
  };

  const visibleItems = [
    ...(showBusinesses
      ? businesses.map((b) => ({ ...b, itemType: "business" }))
      : []),
    ...(showEvents ? events.map((e) => ({ ...e, itemType: "event" })) : []),
  ];

  return (
    <div className="min-h-screen bg-[#080e1a] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nearby Map</h1>
            <p className="text-white/40 flex items-center gap-2">
              <HiOutlineMapPin className="text-emerald-500" />
              Discover businesses and events around you
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBusinesses(!showBusinesses)}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                showBusinesses
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-white/40"
              }`}
            >
              Businesses ({businesses.length})
            </button>
            <button
              onClick={() => setShowEvents(!showEvents)}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                showEvents
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  : "bg-white/5 border-white/10 text-white/40"
              }`}
            >
              Events ({events.length})
            </button>
          </div>
        </header>

        <div className="relative h-[70vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 bg-[#0d1117]">
          {loading && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-white/60 font-medium">Loading Map Data...</p>
              </div>
            </div>
          )}

          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-full px-4 flex justify-center pointer-events-none">
            <div className="flex items-center gap-3 bg-[#0d1117]/85 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-xl overflow-hidden">
              {showBusinesses && (
                <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 mr-3 last:border-0 last:pr-0 last:mr-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold text-xs">
                    {businesses.length}
                  </span>
                  <span className="text-slate-500 text-[10px]">businesses</span>
                </div>
              )}
              {showEvents && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-white font-bold text-xs">
                    {events.length}
                  </span>
                  <span className="text-slate-500 text-[10px]">events</span>
                </div>
              )}
            </div>
          </div>

          <MapContainer
            center={center}
            zoom={coords ? 13 : 7}
            className="h-full w-full"
            scrollWheelZoom
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <MapController items={visibleItems} userCoords={coords} />
            <CustomMapControls userCoords={coords} />

            {coords && (
              <Marker position={[coords.lat, coords.lng]} icon={userPinIcon} />
            )}

            {showBusinesses &&
              businesses.map((b) => (
                <Marker
                  key={b._id}
                  position={[
                    b.location.coordinates[1],
                    b.location.coordinates[0],
                  ]}
                  icon={makePinIcon(b.rating || 0, selected?._id === b._id)}
                  eventHandlers={{
                    click: () => setSelected({ ...b, itemType: "business" }),
                  }}
                />
              ))}

            {showEvents &&
              events.map((e) => (
                <Marker
                  key={e._id}
                  position={[
                    e.location.coordinates[1],
                    e.location.coordinates[0],
                  ]}
                  icon={makeEventPinIcon(selected?._id === e._id)}
                  eventHandlers={{
                    click: () => setSelected({ ...e, itemType: "event" }),
                  }}
                />
              ))}
          </MapContainer>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="absolute top-4 right-4 z-[1000] w-full max-w-sm"
              >
                <div className="bg-[#131929]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative">
                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                  >
                    <HiOutlineXMark className="text-xl" />
                  </button>

                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {selected.itemType === "business" ? (
                        selected.logo ? (
                          <img
                            src={selected.logo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <HiOutlineBuildingStorefront className="text-2xl text-white/20" />
                        )
                      ) : selected.image ? (
                        <img
                          src={selected.image}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiOutlineCalendar className="text-2xl text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight mb-1">
                        {selected.itemType === "business"
                          ? selected.businessName
                          : selected.title}
                      </h3>
                      {selected.itemType === "business" ? (
                        <div className="flex items-center gap-2">
                          <Stars rating={selected.rating} />
                          <span className="text-xs text-white/40">
                            ({selected.reviews?.length || 0})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold uppercase tracking-wider">
                          <HiOutlineUser className="text-sm" />
                          {selected.author}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <HiOutlineMapPin className="text-rose-500 shrink-0" />
                      <span className="truncate">
                        {selected.locationAddress ||
                          selected.address ||
                          "No address provided"}
                      </span>
                    </div>

                    {selected.itemType === "event" && (
                      <>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          <HiOutlineCalendar className="text-purple-500 shrink-0" />
                          <span>{selected.eventDate}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          <HiOutlineClock className="text-purple-500 shrink-0" />
                          <span>{selected.eventTime}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {selected.itemType === "business" ? (
                      <>
                        {selected.contactNumber && (
                          <a
                            href={`tel:${selected.contactNumber}`}
                            className="flex-1 h-11 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all"
                          >
                            <HiOutlinePhone />
                            <span className="text-xs font-bold">Call</span>
                          </a>
                        )}
                        <button
                          onClick={() => navigate(`/business/${selected._id}`)}
                          className="flex-2 h-11 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/40"
                        >
                          View Details
                          <HiOutlineArrowRight />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => getDirections(selected)}
                        className="w-full h-11 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-900/40"
                      >
                        <HiOutlineMap className="text-lg" />
                        Get Directions
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EventsMap;
