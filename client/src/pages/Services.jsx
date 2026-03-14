import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { businessService } from "../services";
import { toast } from "react-hot-toast";
import WishlistButton from "../components/WishlistButton";
import { FaSearch } from "react-icons/fa";
const useUserLocation = () => {
  const [coords, setCoords] = useState(() => {
    const cached = sessionStorage.getItem("lokonomy_user_coords");
    if (cached) return JSON.parse(cached);
    return null;
  });
  const [geoStatus, setGeoStatus] = useState("idle");

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        sessionStorage.setItem("lokonomy_user_coords", JSON.stringify(c));
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  return { coords, geoStatus, requestGPS };
};

const Services = () => {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const { coords, geoStatus, requestGPS } = useUserLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(5000); 

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const params = {};
        if (coords) {
          params.lat = coords.lat;
          params.lng = coords.lng;
          params.radius = radius;
        }
        if (category) params.category = category;
        if (subcategory) params.subcategory = subcategory;

        const response = await businessService.getBusinesses(params);
        setListings(response.data);
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [category, subcategory, coords, radius]);

  useEffect(() => {
    if (!coords && geoStatus === "idle") {
      requestGPS();
    }
  }, []);

  const filteredListings = listings.filter(
    (item) =>
      item.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const radiusOptions = [
    { label: "1 km", value: 1000 },
    { label: "3 km", value: 3000 },
    { label: "5 km", value: 5000 },
    { label: "10 km", value: 10000 },
    { label: "25 km", value: 25000 },
  ];

  return (
    <div className="min-h-screen bg-dark-bg pt-32 pb-24 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-lg h-lg bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="container relative px-6">
        <div className="flex flex-wrap items-center gap-3 mb-10 text-[10px] font-bold uppercase tracking-[0.2em]">
          <Link
            to="/explore"
            className="text-text-dim hover:text-white transition-colors"
          >
            Directory
          </Link>
          <span className="text-white/10">❯</span>
          <Link
            to={`/category/${category}`}
            className="text-text-dim hover:text-white transition-colors"
          >
            {category}
          </Link>
          <span className="text-white/10">❯</span>
          <span className="text-primary">{subcategory || "Browse All"}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-10 border-b border-white/5 pb-10">
          <div className="max-w-3xl">
            <h1 className="text-white text-5xl md:text-6xl font-black mb-4 tracking-tight">
              {subcategory || category}
            </h1>
            <p className="text-text-dim text-xl leading-relaxed">
              Found{" "}
              <span className="text-white font-semibold">
                {listings.length} businesses
              </span>{" "}
              {coords ? (
                <>
                  within{" "}
                  <span className="text-primary font-bold">
                    {radiusOptions.find((r) => r.value === radius)?.label ||
                      "5 km"}
                  </span>{" "}
                  of your location
                </>
              ) : (
                "— enable GPS to filter by distance"
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {coords && (
              <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 flex-wrap">
                {radiusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRadius(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      radius === opt.value
                        ? "bg-primary text-white"
                        : "text-text-dim hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <div className="w-full lg:w-80 relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative flex items-center bg-[#1a2133] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <span className="pl-5 text-text-dim"><FaSearch/></span>
                <input
                  type="text"
                  placeholder="Search by name or keyword..."
                  className="w-full bg-transparent p-4 text-sm text-white focus:outline-none placeholder:text-white/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        {geoStatus === "denied" && (
          <div className="mb-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
            <p className="text-amber-400 text-sm">
              Location access denied. Showing all businesses without distance
              filter.{" "}
              <button
                onClick={requestGPS}
                className="underline font-bold hover:text-amber-300"
              >
                Try again
              </button>
            </p>
          </div>
        )}

        <div className="min-h-100">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/2 border border-white/5 h-80 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-40 border border-dashed border-white/10 rounded-3xl bg-white/2">
              <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">
                No businesses nearby
              </h3>
              <p className="text-text-dim max-w-md mx-auto mb-10 text-lg">
                {coords
                  ? `No businesses found within ${radiusOptions.find((r) => r.value === radius)?.label}. Try a larger radius.`
                  : "Enable GPS or try a different search."}
              </p>
              {coords && (
                <button
                  onClick={() =>
                    setRadius(
                      radiusOptions[
                        Math.min(
                          radiusOptions.findIndex((r) => r.value === radius) +
                            1,
                          radiusOptions.length - 1,
                        )
                      ].value,
                    )
                  }
                  className="btn-primary px-10 rounded-xl font-bold mr-4"
                >
                  Expand Radius
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="btn-primary px-10 rounded-xl font-bold"
              >
                ← Back
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredListings.map((shop) => (
                <div
                  key={shop._id}
                  className="group relative bg-[#1a2133] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col"
                  onClick={() => navigate(`/business/${shop._id}`)}
                >
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 text-yellow-500 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <span className="text-xs">★</span>
                      <span className="text-[10px] font-black">
                        {(shop.rating || 0.0).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <WishlistButton type="business" id={shop._id} />
                  </div>

                  <div className="p-8 flex-1">
                    <div className="mb-8">
                      <div className="w-16 h-16 bg-dark-bg rounded-2xl border border-white/10 flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:border-primary/50 transition-colors">
                        {shop.logo ? (
                          <img
                            src={shop.logo}
                            className="w-full h-full object-cover rounded-2xl"
                            alt=""
                          />
                        ) : (
                          "🏢"
                        )}
                      </div>
                      <h3 className="text-white text-2xl font-black mb-2 tracking-tight group-hover:text-primary transition-colors leading-tight">
                        {shop.businessName}
                      </h3>
                      <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">
                        {shop.subCategory}
                      </div>
                      <p className="text-text-dim text-sm leading-relaxed line-clamp-2">
                        {shop.description ||
                          "A verified local provider specializing in professional services."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/2 rounded-xl border border-white/5">
                        <span className="text-lg">📍</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-black text-text-dim uppercase tracking-widest">
                            Location
                          </span>
                          <span className="text-xs font-bold text-white/80 truncate">
                            {shop.locationAddress ||
                              shop.address ||
                              "Location not available"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto">
                    <button className="w-full bg-white/5 hover:bg-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/20">
                      View Business →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
