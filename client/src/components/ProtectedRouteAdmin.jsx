import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { adminService } from "../services";
import { FiLock, FiAlertTriangle, FiRefreshCw, FiLogOut } from "react-icons/fi";
import { toast } from "react-hot-toast";

let verificationCache = {
  token: null,
  isVerified: null,
  timestamp: 0,
};
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const ProtectedRouteAdmin = ({ requiredRole }) => {
  const [isVerified, setIsVerified] = useState(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const location = useLocation();
  const adminToken = localStorage.getItem("adminToken");
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");

  const verify = useCallback(async () => {
    if (!adminToken) {
      setIsVerified(false);
      return;
    }

    const now = Date.now();
    if (
      verificationCache.token === adminToken &&
      now - verificationCache.timestamp < 60000
    ) {
      setIsVerified(verificationCache.isVerified);
      return;
    }

    try {
      await adminService.verify();

      verificationCache = {
        token: adminToken,
        isVerified: true,
        timestamp: now,
      };
      setIsVerified(true);
    } catch (error) {
      console.error("Admin verification failed", error);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      verificationCache = { token: null, isVerified: false, timestamp: 0 };
      setIsVerified(false);
    }
  }, [adminToken]);

  useEffect(() => {
    verify();
  }, [verify]);

  useEffect(() => {
    if (!adminToken || !isVerified) return;

    const decoded = decodeToken(adminToken);
    if (!decoded || !decoded.exp) return;

    const checkTimeout = () => {
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decoded.exp - now;

      if (timeLeft < 300 && timeLeft > 0 && !showTimeoutModal) {
        setShowTimeoutModal(true);
      }

      if (timeLeft <= 0) {
        handleLogout();
        toast.error("Session expired. Please login again.");
      }
    };

    const timer = setInterval(checkTimeout, 30000);
    checkTimeout();

    return () => clearInterval(timer);
  }, [adminToken, isVerified, showTimeoutModal]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    verificationCache = { token: null, isVerified: false, timestamp: 0 };
    setIsVerified(false);
    setShowTimeoutModal(false);
  };

  const handleReauthenticate = async (e) => {
    e.preventDefault();
    if (!reauthPassword) return;

    setIsReauthenticating(true);
    try {
      const res = await adminService.reauth(reauthPassword);

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminInfo", JSON.stringify(res.data.admin));

      verificationCache = {
        token: res.data.token,
        isVerified: true,
        timestamp: Date.now(),
      };

      setShowTimeoutModal(false);
      setReauthPassword("");
      toast.success("Session successfully extended");
      setIsVerified(true);
    } catch (error) {
      toast.error("Invalid password. Please try again.");
    } finally {
      setIsReauthenticating(false);
    }
  };

  useEffect(() => {
    if (isVerified && requiredRole && adminInfo.role !== requiredRole) {
      toast.error(`Forbidden: ${requiredRole} access required`);
    }
  }, [isVerified, requiredRole, adminInfo.role]);

  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-indigo-400">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="font-bold tracking-widest text-xs uppercase">
            Validating Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredRole && adminInfo.role !== requiredRole) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <>
      <Outlet />

      {showTimeoutModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-3xl shadow-indigo-500/10 scale-in-center">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent)]">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                  <FiAlertTriangle className="text-amber-500" />
                  Session <span className="text-amber-500">Warning</span>
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Your secure session is about to expire
                </p>
              </div>
            </div>

            <form onSubmit={handleReauthenticate} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20 text-xl shadow-inner">
                    {adminInfo.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {adminInfo.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tight">
                      {adminInfo.role}
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="Enter password to extend"
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isReauthenticating}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isReauthenticating ? (
                    <>
                      <FiRefreshCw className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Stay Logged In"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 text-slate-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <FiLogOut size={12} /> Logout Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleInCenter {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
          animation: scaleInCenter 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        }
      `}</style>
    </>
  );
};

export default ProtectedRouteAdmin;
