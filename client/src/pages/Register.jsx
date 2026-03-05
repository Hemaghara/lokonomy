import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { authService } from "../services";
import { toast } from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [gpsState, setGpsState] = useState({
    status: "idle",
    latitude: null,
    longitude: null,
    locationName: "",
    district: "",
    taluka: "",
    accuracy: null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setGpsState((prev) => ({ ...prev, status: "error" }));
      return;
    }

    setGpsState((prev) => ({ ...prev, status: "fetching" }));
    toast.loading("Fetching your location...", { id: "gps-toast" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        let district = "";
        let taluka = "";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          );
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(",");
            locationName = parts.slice(0, 3).join(",").trim();

            const addr = data.address || {};
            const rawDistrict =
              addr.state_district || addr.county || addr.city || "";
            district = rawDistrict.replace(/ District/i, "").trim();
            taluka = (
              addr.suburb ||
              addr.town ||
              addr.village ||
              addr.city_district ||
              ""
            ).trim();
          }
        } catch {}

        setGpsState({
          status: "granted",
          latitude,
          longitude,
          locationName,
          district,
          taluka,
          accuracy: Math.round(accuracy),
        });
        toast.success("Location captured successfully!", { id: "gps-toast" });
      },
      (err) => {
        toast.dismiss("gps-toast");
        if (err.code === err.PERMISSION_DENIED) {
          setGpsState((prev) => ({ ...prev, status: "denied" }));
          toast.error(
            "Location access denied. GPS is required for registration.",
          );
        } else {
          setGpsState((prev) => ({ ...prev, status: "error" }));
          toast.error("Could not fetch location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    if (gpsState.status !== "granted") {
      toast.error("GPS location is required to create a profile.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.username,
        email: formData.email,
        password: formData.password,
        locationPermission: "granted",
      };

      if (gpsState.status === "granted" && gpsState.latitude) {
        payload.latitude = gpsState.latitude;
        payload.longitude = gpsState.longitude;
        payload.locationName = gpsState.locationName;
        payload.district = gpsState.district;
        payload.taluka = gpsState.taluka;
      }

      const response = await authService.register(payload);

      if (response.data.token) {
        const userData = {
          ...response.data.user,
          token: response.data.token,
        };
        login(userData);
        toast.success("Account created successfully!");
        navigate("/home");
      } else {
        toast.error(response.data.message || "Registration Failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const gpsStatusConfig = {
    idle: {
      icon: "📍",
      label: "Enable GPS Location",
      sublabel: "Share your location for personalized local services",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/30",
    },
    fetching: {
      icon: "⏳",
      label: "Fetching location...",
      sublabel: "Please wait while we get your coordinates",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30",
    },
    granted: {
      icon: "✅",
      label: "Location Captured",
      sublabel: null,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/30",
    },
    denied: {
      icon: "🚫",
      label: "GPS Required",
      sublabel: "Please allow location access in your browser settings",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
    },
    error: {
      icon: "⚠️",
      label: "Location Unavailable",
      sublabel: "GPS is mandatory for account security",
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/30",
    },
  };

  const currentGpsConfig = gpsStatusConfig[gpsState.status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-card-bg border border-border p-10 md:p-12 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-xl font-bold text-white mx-auto mb-6">
            L
          </div>
          <h1 className="text-white text-3xl mb-2">Create Citizen Profile</h1>
          <p className="text-text-dim text-sm">
            Join the local network to discover and sell services.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-dim">
                Full Name
              </label>
              <input
                type="text"
                name="username"
                className="w-full bg-dark-bg border border-border p-3.5 rounded-lg text-sm text-white focus:border-primary outline-none transition-all"
                value={formData.username}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-dim">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="w-full bg-dark-bg border border-border p-3.5 rounded-lg text-sm text-white focus:border-primary outline-none transition-all"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-dim">
                Create Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full bg-dark-bg border border-border p-3.5 rounded-lg text-sm text-white focus:border-primary outline-none transition-all"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-dim">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                className="w-full bg-dark-bg border border-border p-3.5 rounded-lg text-sm text-white focus:border-primary outline-none transition-all"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div
            className={`rounded-xl border p-5 transition-all duration-300 ${currentGpsConfig.bg}`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5 shrink-0">
                {currentGpsConfig.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm ${currentGpsConfig.color}`}
                >
                  {currentGpsConfig.label}
                </p>

                <AnimatePresence mode="wait">
                  {gpsState.status === "granted" ? (
                    <motion.div
                      key="granted"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-1"
                    >
                      <p className="text-xs text-green-400 font-medium truncate">
                        📌 {gpsState.locationName}
                      </p>
                      <p className="text-xs text-text-dim">
                        Lat: {gpsState.latitude?.toFixed(5)} · Lng:{" "}
                        {gpsState.longitude?.toFixed(5)} · ±{gpsState.accuracy}m
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="sublabel"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-text-dim mt-1"
                    >
                      {currentGpsConfig.sublabel}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {(gpsState.status === "idle" ||
                  gpsState.status === "error") && (
                  <>
                    <button
                      type="button"
                      onClick={fetchGpsLocation}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/80 transition-all whitespace-nowrap"
                    >
                      Allow GPS
                    </button>
                  </>
                )}

                {gpsState.status === "denied" && (
                  <button
                    type="button"
                    onClick={fetchGpsLocation}
                    className="px-4 py-2 bg-white/10 text-text-dim text-xs font-medium rounded-lg hover:bg-white/15 transition-all whitespace-nowrap"
                  >
                    Enable GPS
                  </button>
                )}

                {gpsState.status === "granted" && (
                  <button
                    type="button"
                    onClick={fetchGpsLocation}
                    className="px-3 py-2 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/30 transition-all whitespace-nowrap"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4 text-base font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || gpsState.status !== "granted"}
          >
            {loading ? "Creating Profile..." : "Register Citizen Node"}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-text-dim mb-2">Already have an account?</p>
          <Link to="/login" className="text-primary font-bold hover:underline">
            Login to your account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
