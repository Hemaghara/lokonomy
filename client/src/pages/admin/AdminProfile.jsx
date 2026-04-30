import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import {
  User,
  Mail,
  Lock,
  Shield,
  Save,
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
            Loading profile…
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-600/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase hidden xs:inline">
              Dashboard
            </span>
          </button>

          <div className="text-right">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-linear-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              Admin Profile
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
              Manage your account & credentials
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden">
              <Shield className="absolute -top-3 -right-3 w-28 h-28 text-indigo-500/5" />

              <div className="flex items-center gap-5 lg:flex-col lg:items-start lg:gap-0">
                <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-20 lg:h-20 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 lg:mb-5">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>

                <div className="flex-1 min-w-0 lg:w-full">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-100 truncate">
                    {admin.name}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/25 rounded-full text-indigo-400 text-xs font-bold tracking-wider uppercase">
                    <Shield className="w-3 h-3" />
                    {admin.role}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-700/40">
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {admin.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-2xl p-5">
              <h3 className="text-indigo-400 font-bold text-sm flex items-center gap-2 mb-2.5">
                <Key className="w-3.5 h-3.5" />
                Security Tip
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                A strong password needs at least{" "}
                <span className="text-slate-200 font-semibold">
                  8 characters
                </span>{" "}
                with{" "}
                <span className="text-slate-200 font-semibold">uppercase</span>,{" "}
                <span className="text-slate-200 font-semibold">lowercase</span>,{" "}
                <span className="text-slate-200 font-semibold">numbers</span>,
                and{" "}
                <span className="text-slate-200 font-semibold">symbols</span>{" "}
                (!@#$).
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <section>
                <SectionHeader label="Personal Information" />
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <Field
                    label="Full Name"
                    htmlFor="admin-name"
                    icon={<User className="w-3.5 h-3.5" />}
                  >
                    <input
                      id="admin-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="input-base"
                    />
                  </Field>

                  <Field
                    label="Email Address"
                    htmlFor="admin-email"
                    icon={<Mail className="w-3.5 h-3.5" />}
                  >
                    <input
                      id="admin-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@example.com"
                      className="input-base"
                    />
                  </Field>
                </div>

                <div className="mt-4 sm:mt-5">
                  <Field
                    label="Account Role"
                    htmlFor="admin-role"
                    icon={<Shield className="w-3.5 h-3.5" />}
                  >
                    <select
                      id="admin-role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={admin.role !== "superadmin"}
                      className={`input-base appearance-none ${
                        admin.role !== "superadmin"
                          ? "text-slate-500 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    {admin.role !== "superadmin" && (
                      <p className="mt-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                        * Only superadmins can modify roles
                      </p>
                    )}
                  </Field>
                </div>
              </section>

              <section>
                <SectionHeader
                  label="Password Security"
                  icon={<Lock className="w-4 h-4 text-indigo-400" />}
                />
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <Field label="New Password">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current"
                        className="input-base pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm New Password">
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Must match password"
                        className="input-base pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </Field>
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/admin/dashboard")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700/50 transition-all duration-200 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 px-6 bg-linear-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .input-base {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 0.75rem;
          color: rgb(226 232 240);
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-base::placeholder { color: rgb(71 85 105); }
        .input-base:focus {
          border-color: rgb(99 102 241 / 0.6);
          box-shadow: 0 0 0 3px rgb(99 102 241 / 0.12);
        }
        .input-base:disabled { color: rgb(100 116 139); cursor: not-allowed; }
        option { background: #1e293b; }
      `}</style>
    </div>
  );
};

const SectionHeader = ({ label, icon }) => (
  <div className="flex items-center gap-2 pb-3 border-b border-slate-700/40">
    {icon}
    <h3 className="text-base sm:text-lg font-bold text-slate-200">{label}</h3>
  </div>
);

const Field = ({ label, icon, htmlFor, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label 
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider"
      >
        {icon}
        {label}
      </label>
    )}
    {children}
  </div>
);

export default AdminProfile;
