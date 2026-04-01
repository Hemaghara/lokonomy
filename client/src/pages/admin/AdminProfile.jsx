import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services/adminService";
import { User, Mail, Lock, Shield, Save, ArrowLeft, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const savedAdmin = localStorage.getItem("adminInfo");
        if (savedAdmin) {
          const parsedAdmin = JSON.parse(savedAdmin);
          setAdmin(parsedAdmin);
          setFormData({
            name: parsedAdmin.name || "",
            email: parsedAdmin.email || "",
            role: parsedAdmin.role || "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (error) {
        console.error("Error fetching admin profile:", error);
      }
    };
    fetchAdminProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password) {
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return;
      }
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        toast.error(
          "Password must contain uppercase, lowercase, number, and special character.",
        );
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match!");
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await adminService.updateProfile(updateData);

      const updatedAdmin = { ...admin, ...response.data };
      localStorage.setItem("adminInfo", JSON.stringify(updatedAdmin));
      if (response.data.token) {
        localStorage.setItem("adminToken", response.data.token);
      }

      setAdmin(updatedAdmin);
      toast.success("Profile updated successfully!");
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to update profile";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!admin)
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center text-slate-400 font-medium">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm tracking-wide uppercase">
              Back to Dashboard
            </span>
          </button>
          <div className="text-right">
            <h1 className="text-4xl font-black bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Admin Profile
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">
              Manage your account and credentials
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-24 h-24 text-indigo-500" />
              </div>

              <div className="relative z-10">
                <div className="w-24 h-24 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 transform group-hover:scale-105 transition-transform">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-200 truncate">
                  {admin.name}
                </h2>
                <p className="text-indigo-400 text-sm font-semibold flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4" />
                  {admin.role?.toUpperCase()}
                </p>
                <div className="mt-8 pt-8 border-t border-slate-700/50 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium truncate">
                      {admin.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 shadow-lg">
              <h3 className="text-indigo-400 font-bold mb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Security Tip
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                A secure password must be at least <b>8 characters</b> long and
                include <b>uppercase letters</b>, <b>lowercase letters</b>,{" "}
                <b>numbers</b>, and <b>special characters</b> (!@#$).
              </p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-200 border-b border-slate-700/50 pb-4">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 flex items-center gap-2">
                        <User className="w-3 h-3" /> Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-slate-200 transition-all font-medium"
                        placeholder="Current Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-slate-200 transition-all font-medium"
                        placeholder="admin@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400 ml-1 flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Account Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={admin.role !== "superadmin"}
                      className={`w-full px-5 py-4 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium appearance-none ${admin.role !== "superadmin" ? "text-slate-500 cursor-not-allowed" : "text-slate-200 cursor-pointer"}`}
                    >
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    {admin.role !== "superadmin" && (
                      <p className="text-[10px] text-slate-500 ml-1 mt-1 font-semibold uppercase tracking-wider">
                        * Only superadmins can modify roles
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="text-xl font-bold text-slate-200 border-b border-slate-700/50 pb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-400" /> Password
                    Security
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 flex items-center gap-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-slate-200 transition-all placeholder:text-slate-700"
                        placeholder="Leave blank to keep current"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400 ml-1 flex items-center gap-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-slate-950/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-slate-200 transition-all placeholder:text-slate-700"
                        placeholder="Must match password"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 px-8 bg-linear-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Processing Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Update My Profile</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/dashboard")}
                    className="py-4 px-8 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-700/50 transition-all hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
