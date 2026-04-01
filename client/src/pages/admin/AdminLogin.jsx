import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services/adminService";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Please enter your admin email address");
      return;
    }
    if (!formData.password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const response = await adminService.login(formData);
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminInfo", JSON.stringify(response.data));
      toast.success("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMsg);
      console.error("Admin Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md p-8 bg-card-bg/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400 mb-2">
            Lokonomy Admin
          </h1>
          <p className="text-slate-400">Control Center Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-200 transition-all"
              placeholder="admin@lokonomy.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-200 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Authenticating...
              </div>
            ) : (
              "Sign In to Panel"
            )}
          </button>
        </form>

        <div className="mt-8 text-center bg-slate-800/20 py-4 rounded-2xl border border-slate-700/30">
          <p className="text-slate-400 text-sm">
            Don't have an account?{" "}
            <Link
              to="/admin/register"
              className="text-indigo-400 font-bold hover:underline"
            >
              Create Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
