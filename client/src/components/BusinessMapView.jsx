import { useEffect, useState } from "react";
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
} from "react-icons/hi2";

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
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-1000 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 shadow-xl transition-all"
        title="Zoom In"
      >
        <HiPlus className="text-lg" />
      </button>

      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 shadow-xl transition-all"
        title="Zoom Out"
      >
        <HiMinus className="text-lg" />
      </button>

      {userCoords && (
        <button
          type="button"
          onClick={handleRecenter}
          className="w-10 h-10 mt-2 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-violet-400 hover:bg-white/10 shadow-xl transition-all"
          title="Recenter Map"
        >
          <HiOutlineMapPin className="text-lg" />
        </button>
      )}
    </div>
  );
};

const MapController = ({ businesses, userCoords }) => {
  const map = useMap();
  useEffect(() => {
    const pts = businesses.filter((b) => b.location?.coordinates?.length === 2);
    if (pts.length > 0) {
      const bounds = L.latLngBounds(
        pts.map((b) => [b.location.coordinates[1], b.location.coordinates[0]]),
      );
      if (userCoords) bounds.extend([userCoords.lat, userCoords.lng]);
      map.fitBounds(bounds.pad(0.18), { maxZoom: 15, animate: true });
    } else if (userCoords) {
      map.setView([userCoords.lat, userCoords.lng], 13, { animate: true });
    }
  }, [businesses, userCoords, map]);
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

const RatingDot = ({ color, label }) => (
  <div className="flex items-center gap-1.5 whitespace-nowrap">
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
    <span className="text-[10px] text-slate-500 font-medium">{label}</span>
  </div>
);

const BusinessMapView = ({ businesses, userCoords, radius }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const center = userCoords ? [userCoords.lat, userCoords.lng] : DEFAULT_CENTER;
  const validBiz = businesses.filter(
    (b) => b.location?.coordinates?.length === 2,
  );
  const unmapped = businesses.length - validBiz.length;

  const ratingColor = (r) =>
    r >= 4 ? "text-emerald-400" : r >= 2 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#1f2a3d] shadow-2xl shadow-black/40">
      <MapContainer
        center={center}
        zoom={userCoords ? 13 : 7}
        className="h-112.5 md:h-155 w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapController businesses={validBiz} userCoords={userCoords} />

        <CustomMapControls userCoords={userCoords} />

        {userCoords && (
          <>
            <Marker
              position={[userCoords.lat, userCoords.lng]}
              icon={userPinIcon}
            />
            <Circle
              center={[userCoords.lat, userCoords.lng]}
              radius={radius}
              pathOptions={{
                color: "#7c3aed",
                fillColor: "#7c3aed",
                fillOpacity: 0.06,
                weight: 1,
                dashArray: "5 4",
              }}
            />
          </>
        )}

        {validBiz.map((b) => (
          <Marker
            key={b._id}
            position={[b.location.coordinates[1], b.location.coordinates[0]]}
            icon={makePinIcon(b.rating || 0, selected?._id === b._id)}
            eventHandlers={{
              click: () =>
                setSelected((prev) => (prev?._id === b._id ? null : b)),
            }}
          />
        ))}
      </MapContainer>
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 w-full px-4 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 md:gap-3 bg-[#0d1117]/85 backdrop-blur-md border border-white/10 rounded-full px-3 md:px-4 py-2 shadow-xl overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-white font-bold text-[10px] md:text-xs">
              {validBiz.length}
            </span>
            <span className="text-slate-500 text-[10px] md:text-xs">
              businesses
            </span>
          </div>
          {unmapped > 0 && (
            <>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-amber-400 text-[9px] md:text-[10px] font-medium whitespace-nowrap">
                {unmapped} no pin
              </span>
            </>
          )}
          {userCoords && (
            <>
              <span className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-slate-400 text-[9px] md:text-[10px]">
                  You
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-3 md:left-auto md:right-3 z-1000 bg-[#0d1117]/85 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-2 shadow-xl">
        <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
          Rating Legend
        </p>
        <div className="flex flex-row md:flex-col gap-2 md:gap-1.5">
          <RatingDot color="#10b981" label="4+ ★" />
          <RatingDot color="#f59e0b" label="2–4 ★" />
          <RatingDot color="#ef4444" label="< 2 ★" />
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected._id}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="absolute bottom-0 left-0 right-0 z-1000 p-2 md:p-0"
          >
            <div className="hidden md:block absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />

            <div className="relative bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 md:border-none md:border-t rounded-2xl md:rounded-none px-4 pt-3 pb-4 md:pb-5 shadow-2xl">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-slate-400 hover:text-white transition-all shadow-md"
              >
                <HiOutlineXMark className="text-lg" />
              </button>

              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4 md:mb-5 lg:hidden" />

              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#1a2133] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                  {selected.logo ? (
                    <img
                      src={selected.logo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HiOutlineBuildingStorefront className="text-2xl md:text-3xl text-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-white font-bold text-sm md:text-base leading-tight truncate mb-0.5">
                    {selected.businessName}
                  </p>
                  <p className="text-violet-400 text-[10px] md:text-[11px] font-bold uppercase tracking-wider mb-2">
                    {selected.subCategory}
                  </p>

                  <div className="flex items-center gap-2 mb-2">
                    <Stars rating={selected.rating} size="text-[10px]" />
                    <span
                      className={`font-black text-[11px] ${ratingColor(selected.rating)}`}
                    >
                      {(selected.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      ({selected.reviews?.length || 0})
                    </span>
                  </div>

                  <p className="text-slate-400 text-[10px] md:text-[11px] truncate flex items-center gap-1">
                    <HiOutlineMapPin className="text-rose-500 shrink-0" />
                    {selected.locationAddress ||
                      selected.address ||
                      "No address provided"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                {selected.contactNumber && (
                  <a
                    href={`tel:${selected.contactNumber}`}
                    className="flex items-center justify-center h-11 w-11 md:w-auto md:px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all shrink-0"
                    title="Call Business"
                  >
                    <HiOutlinePhone className="text-lg" />
                    <span className="hidden md:inline ml-2 text-xs font-bold">
                      Call
                    </span>
                  </a>
                )}
                <button
                  onClick={() => navigate(`/business/${selected._id}`)}
                  className="flex-1 h-11 flex items-center justify-center gap-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[.98] text-white text-xs md:text-sm font-black rounded-xl transition-all shadow-lg shadow-violet-900/30"
                >
                  Explore Details
                  <HiOutlineArrowRight className="text-lg" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {validBiz.length === 0 && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center px-6">
          <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <HiOutlineMapPin className="text-3xl text-slate-600" />
            </div>
            <p className="text-white font-black text-lg mb-2">No Pins Found</p>
            <p className="text-slate-500 text-sm leading-relaxed">
              {businesses.length > 0
                ? "The businesses in this area don't have GPS coordinates attached to them yet."
                : "No businesses match your current filters in this map view."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessMapView;
