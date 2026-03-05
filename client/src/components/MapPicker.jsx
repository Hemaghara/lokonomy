import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">
      <path fill="#7c3aed" stroke="#fff" stroke-width="2"
        d="M15 0C7.8 0 2 5.8 2 13c0 9.3 13 29 13 29S28 22.3 28 13C28 5.8 22.2 0 15 0z"/>
      <circle fill="#fff" cx="15" cy="13" r="5"/>
    </svg>`),
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const ClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
    );
    const data = await res.json();
    if (data && data.display_name) {
      const parts = data.display_name.split(",");
      const addr = data.address || {};

      // Attempt to find district and taluka
      const district = addr.state_district || addr.county || addr.city || "";
      const taluka =
        addr.suburb || addr.town || addr.village || addr.city_district || "";

      return {
        displayAddress: parts.slice(0, 4).join(",").trim(),
        pincode: addr.postcode || "",
        state: addr.state || "Gujarat",
        district: district.replace(/ District/i, "").trim(),
        taluka: taluka.trim(),
      };
    }
  } catch {}
  return {
    displayAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    pincode: "",
    state: "Gujarat",
    district: "",
    taluka: "",
  };
};

const MapPicker = ({
  value,
  onChange,
  defaultCenter = [22.3, 72.6],
  height = "360px",
}) => {
  const [geocoding, setGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const mapRef = useRef(null);

  const markerPos = value?.lat ? [value.lat, value.lng] : null;

  const handleMapClick = async (lat, lng) => {
    setGeocoding(true);
    const { displayAddress, pincode, state, district, taluka } =
      await reverseGeocode(lat, lng);
    onChange({
      lat,
      lng,
      address: displayAddress,
      pincode,
      state,
      district,
      taluka,
    });
    setGeocoding(false);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const { displayAddress, pincode, state, district, taluka } =
          await reverseGeocode(lat, lng);
        onChange({
          lat,
          lng,
          address: displayAddress,
          pincode,
          state,
          district,
          taluka,
        });
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
        }
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-slate-500 font-medium">
          {value?.lat
            ? `📍 ${value.address || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}`
            : "Click on the map to pin your shop location"}
        </p>
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          {gpsLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              Locating…
            </>
          ) : (
            <>
              <span>🎯</span> Use My GPS
            </>
          )}
        </button>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-[#1f2a3d] relative"
        style={{ height }}
      >
        {geocoding && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-9999 bg-[#111827]/90 backdrop-blur border border-[#1f2a3d] text-violet-400 text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
            Getting address…
          </div>
        )}
        <MapContainer
          center={markerPos || defaultCenter}
          zoom={markerPos ? 16 : 10}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {markerPos && <Marker position={markerPos} icon={shopIcon} />}
        </MapContainer>
      </div>
      {value?.lat && (
        <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono">
          <span>LAT {value.lat.toFixed(6)}</span>
          <span>·</span>
          <span>LNG {value.lng.toFixed(6)}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-auto text-red-400/70 hover:text-red-400 transition-colors text-[10px] font-sans font-semibold"
          >
            ✕ Clear pin
          </button>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
