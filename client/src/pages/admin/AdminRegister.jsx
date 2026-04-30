import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.password) {
      toast.error("Please create a password");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await adminService.register(formData);
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminInfo", JSON.stringify(response.data));
      toast.success("Admin account created successfully!");
      navigate("/admin/dashboard");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Registration failed. Please check your information.";
      toast.error(errorMsg);
      console.error("Admin Registration Error:", error);
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
            Admin Signup
          </h1>
          <p className="text-slate-400">Create a new controller account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-200 transition-all text-sm"
              placeholder="John Doe"
            />
          </div>

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
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-200 transition-all text-sm"
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
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-200 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-200 transition-all text-sm appearance-none"
            >
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating Account...
              </div>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>

        <div className="mt-8 text-center bg-slate-800/20 py-4 rounded-2xl border border-slate-700/30">
          <p className="text-slate-400 text-sm">
            Already have an account?{" "}
            <Link
              to="/admin/login"
              className="text-indigo-400 font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
