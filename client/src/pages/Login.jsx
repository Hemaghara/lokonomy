import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { authService } from "../services";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Hourglass,
  CheckCircle,
  Ban,
  AlertTriangle,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
  LocateFixed,
} from "lucide-react";
import { subscribeToPush } from "../services/pushService";
const Login = () => {
  const { user, login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

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
    if (step !== "otp" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

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
            {
              headers: {
                "User-Agent": "lokonomy-app",
              },
            },
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
        } catch (error) {
          console.error("Geocoding Error:", error.message);
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

    const wakeUpToastId = setTimeout(() => {
      toast.loading("Server is waking up from its nap, please wait...", {
        id: "login-wakeup",
        duration: 10000,
      });
    }, 4000);

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
      clearTimeout(wakeUpToastId);
      toast.dismiss("login-wakeup");

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
      clearTimeout(wakeUpToastId);
      toast.dismiss("login-wakeup");
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

        if (response.data.user.notificationsEnabled !== false) {
          subscribeToPush().catch((err) =>
            console.error("Push subscription failed", err),
          );
        }

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
      label: "GPS Authorization",
      subLabel: "Required for secure access",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      accent: "blue",
    },
    fetching: {
      label: "Detecting Location",
      subLabel: "Verifying your current city...",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      accent: "amber",
    },
    granted: {
      label: "Access Verified",
      subLabel: "Location successfully captured",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      accent: "emerald",
    },
    denied: {
      label: "GPS Access Denied",
      subLabel: "Enable location in settings",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      accent: "rose",
    },
    error: {
      label: "Detection Failed",
      subLabel: "Tap to retry location capture",
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      accent: "orange",
    },
  };

  const currentGpsConfig = gpsStatusConfig[gpsState.status];

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-dark-bg overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-110"
      >
        <div className="glass backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-linear-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-6 shadow-lg shadow-primary/20"
            >
              L
            </motion.div>
            <h1 className="text-white text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              {step === "credentials" ? "Welcome Back" : "Security Check"}
            </h1>
            <p className="text-white text-sm max-w-70 mx-auto">
              {step === "credentials"
                ? "Enter your credentials to access your local business dashboard"
                : "Please enter the verification code sent to your email"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.form
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleInitialLogin}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-dim/80 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-text-dim group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-4 rounded-xl text-sm text-white focus:border-primary/50 focus:bg-white/8 outline-none transition-all placeholder:text-white/20"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-dim/80 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-text-dim group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-4 rounded-xl text-sm text-white focus:border-primary/50 focus:bg-white/8 outline-none transition-all placeholder:text-white/20"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <motion.div
                  layout
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${currentGpsConfig.bg}`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div
                      className={`p-2.5 rounded-xl bg-white/5 ${currentGpsConfig.color}`}
                    >
                      {currentGpsConfig.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm font-bold tracking-tight ${currentGpsConfig.color}`}
                      >
                        {currentGpsConfig.label}
                      </h4>
                      <p className="text-[11px] text-text-dim/80 font-medium">
                        {currentGpsConfig.subLabel}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {gpsState.status !== "granted" ? (
                        <button
                          type="button"
                          onClick={fetchGpsLocation}
                          disabled={gpsState.status === "fetching"}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {gpsState.status === "fetching"
                            ? "Waiting..."
                            : "Authorize"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={fetchGpsLocation}
                          className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {gpsState.status === "granted" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 pb-4 pt-1 border-t border-emerald-500/10"
                    >
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-3 h-3 text-emerald-400/70" />
                        <span className="text-[10px] text-text-dim truncate">
                          {gpsState.locationName}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <div className="space-y-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-primary to-primary-dark text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-px active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Sign In Now <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-4">
                    <p className="text-[13px] text-text-dim">
                      New to Lokonomy?{" "}
                      <Link
                        to="/register"
                        className="text-primary font-bold hover:text-primary-dark transition-colors"
                      >
                        Create account
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-8"
              >
                <div className="bg-primary/5 rounded-2xl p-4 flex flex-col items-center">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[13px] text-text-dim">
                    Verification code sent to
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {formData.email}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-3xl font-black tracking-[0.6em] text-white focus:border-primary/50 outline-none transition-all"
                      placeholder="000000"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    {otp.length === 6 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-center text-text-dim font-medium uppercase tracking-widest">
                    Enter authentication code
                  </p>
                </div>

                <div className="text-center">
                  {timer > 0 ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <p className="text-[11px] text-text-dim font-bold">
                        RESEND CODE IN {timer < 10 ? `0${timer}` : timer}S
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm text-primary font-bold hover:underline decoration-2 underline-offset-4 transition-all"
                    >
                      Resend New Code
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-primary to-primary-dark text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Verify Account <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="w-full text-[13px] font-bold text-text-dim hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Change Login Email</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      
      </motion.div>
    </div>
  );
};

export default Login;
