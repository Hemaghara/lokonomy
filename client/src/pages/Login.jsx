import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { authService } from "../services";
import { toast } from "react-hot-toast";
import { MapPin,Hourglass,CheckCircle,Ban,AlertTriangle} from "lucide-react";
const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  const [step, setStep] = useState("credentials");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");

  const [gpsState, setGpsState] = useState({
    status: "idle",
    latitude: null,
    longitude: null,
    locationName: "",
    district: "",
    taluka: "",
    accuracy: null,
  });

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

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
    toast.loading("Fetching your location...", { id: "gps-login-toast" });

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
        } catch {
        }

        setGpsState({
          status: "granted",
          latitude,
          longitude,
          locationName,
          district,
          taluka,
          accuracy: Math.round(accuracy),
        });
        toast.success("Location captured!", { id: "gps-login-toast" });
      },
      (err) => {
        toast.dismiss("gps-login-toast");
        if (err.code === err.PERMISSION_DENIED) {
          setGpsState((prev) => ({ ...prev, status: "denied" }));
          toast.error("Location access denied.");
        } else {
          setGpsState((prev) => ({ ...prev, status: "error" }));
          toast.error("Could not fetch location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleInitialLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      toast.error("Please fill all fields");
      setLoading(false);
      return;
    }

    if (gpsState.status !== "granted") {
      toast.error("GPS location is required to secure your login.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
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

      const response = await authService.login(payload);

      if (response.data.success && response.data.step === "otp") {
        if (response.data.devOtp) {
          toast.success(`Verification Code: ${response.data.devOtp}`, {
            duration: 6000,
          });
        } else {
          toast.success("Please check your email for the verification code.");
        }
        setStep("otp");
        setTimer(60);
      } else {
        toast.error(response.data.message || "Invalid Credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Invalid verification code");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOtp({
        email: formData.email,
        otp: otp,
      });

      if (response.data.success) {
        toast.success("Login successful!");
        login({
          ...response.data.user,
          token: response.data.token,
        });
        navigate("/home");
      } else {
        toast.error(response.data.message || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtp("");
    handleInitialLogin();
  };

  const gpsStatusConfig = {
    idle: {
      icon: <MapPin/>,
      label: "Enable GPS to update your location",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/30",
    },
    fetching: {
      icon: <Hourglass/>,
      label: "Fetching location...",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30",
    },
    granted: {
      icon: <CheckCircle/>,
      label: "Location Ready",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/30",
    },
    denied: {
      icon: <Ban/>,
      label: "GPS Required — Please enable in browser",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
    },
    error: {
      icon: <AlertTriangle/>,
      label: "Location required — click Allow",
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
        className="w-full max-w-md bg-card-bg border border-border p-10 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-xl font-bold text-white mx-auto mb-6">
            L
          </div>
          <h1 className="text-white text-3xl mb-2">Welcome Back</h1>
          <p className="text-text-dim text-sm">
            {step === "credentials"
              ? "Login to access your local dashboard"
              : "Verify your identity to continue"}
          </p>
        </div>

        {step === "credentials" ? (
          <form onSubmit={handleInitialLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-dim">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="w-full bg-dark-bg border border-border p-3.5 rounded-lg text-sm text-white focus:border-primary outline-none transition-all"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-dim">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full bg-dark-bg border border-border p-3.5 rounded-lg text-sm text-white focus:border-primary outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div
              className={`rounded-xl border p-4 transition-all duration-300 ${currentGpsConfig.bg}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">
                  {currentGpsConfig.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold ${currentGpsConfig.color}`}
                  >
                    {currentGpsConfig.label}
                  </p>
                  <AnimatePresence>
                    {gpsState.status === "granted" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1"
                      >
                        <p className="text-xs text-green-300 truncate">
                           {gpsState.locationName}
                        </p>
                        <p className="text-xs text-text-dim">
                          ±{gpsState.accuracy}m accuracy
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 shrink-0">
                  {(gpsState.status === "idle" ||
                    gpsState.status === "error") && (
                    <>
                      <button
                        type="button"
                        onClick={fetchGpsLocation}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/80 transition-all"
                      >
                        Allow GPS
                      </button>
                    </>
                  )}

                  {gpsState.status === "denied" && (
                    <button
                      type="button"
                      onClick={fetchGpsLocation}
                      className="px-3 py-1.5 bg-white/10 text-text-dim text-xs rounded-lg hover:bg-white/15 transition-all"
                    >
                      Enable
                    </button>
                  )}

                  {gpsState.status === "granted" && (
                    <button
                      type="button"
                      onClick={fetchGpsLocation}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition-all"
                    >
                      Refresh
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || gpsState.status !== "granted"}
              className="btn-primary w-full py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Login to Account"}
            </button>

            <div className="text-center pt-6 border-t border-white/5">
              <p className="text-sm text-text-dim mb-2">
                Don't have an account?
              </p>
              <Link
                to="/register"
                className="text-primary font-bold hover:underline"
              >
                Create new citizen profile
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-8">
            <div className="text-center">
              <p className="text-sm text-text-dim mb-2">Code sent to:</p>
              <span className="text-white font-semibold">{formData.email}</span>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                className="w-full bg-dark-bg border border-border p-4 rounded-lg text-center text-3xl font-bold tracking-[0.5em] text-white focus:border-primary outline-none"
                placeholder="000000"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <p className="text-xs text-center text-text-dim">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div className="text-center">
              {timer > 0 ? (
                <p className="text-xs text-text-dim font-medium">
                  Resend code in {timer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-primary font-bold hover:underline"
                >
                  Resend Verification Code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 font-bold"
            >
              {loading ? "Verifying..." : "Verify and Access"}
            </button>

            <button
              type="button"
              onClick={() => setStep("credentials")}
              className="w-full text-sm font-semibold text-text-dim hover:text-white transition-colors"
            >
              ← Back to login
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
