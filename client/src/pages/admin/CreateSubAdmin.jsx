import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiUsers,
  FiShield,
  FiPlus,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiKey,
  FiArrowLeft,
} from "react-icons/fi";

const ROLES = [
  "Content Moderator",
  "Support Agent",
  "Finance Manager",
  "admin",
];

const PERMISSIONS = [
  "User Management",
  "Analytics & Reports",
  "Marketplace",
  "Finance",
  "Support System",
  "Content",
  "Reports",
  "Transactions",
];

const ROLE_PRESETS = {
  "Content Moderator": ["Content", "Reports", "Support System"],
  "Support Agent": ["Support System", "User Management"],
  "Finance Manager": ["Finance", "Transactions", "Analytics & Reports"],
  admin: PERMISSIONS,
};

const CreateSubAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Content Moderator",
    permissions: ROLE_PRESETS["Content Moderator"],
    status: "Active",
  });

  useEffect(() => {
    if (id) {
      fetchSubAdminDetails();
    }
  }, [id]);

  const fetchSubAdminDetails = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubAdminById(id);
      const admin = res.data.data;
      if (admin) {
        setFormData({
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          status: admin.status,
        });
      }
    } catch (error) {
      toast.error("Failed to load sub-admin details");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      permissions: ROLE_PRESETS[role] || [],
    });
  };

  const togglePermission = (perm) => {
    const newPerms = formData.permissions.includes(perm)
      ? formData.permissions.filter((p) => p !== perm)
      : [...formData.permissions, perm];
    setFormData({ ...formData, permissions: newPerms });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await adminService.updateSubAdmin(id, formData);
        toast.success("Sub-admin updated successfully");
      } else {
        await adminService.createSubAdmin(formData);
        toast.success("Sub-admin created successfully");
      }
      navigate("/admin/sub-admins");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <button
              onClick={() => navigate("/admin/sub-admins")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 font-bold text-sm uppercase tracking-widest"
            >
              <FiArrowLeft /> Back to List
            </button>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/20">
                <FiShield className="text-indigo-400" />
              </div>
              {id ? "Edit" : "Create"} Sub-
              <span className="text-indigo-500">Admin</span>
            </h1>
            <p className="mt-2 text-slate-400 text-sm font-medium">
              Configure account access and administrative permissions
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 md:p-12 space-y-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                    01
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/80">
                    Basic Information
                  </h3>
                </div>
                <div className="space-y-5">
                  <div className="relative group">
                    <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-slate-700 text-sm"
                    />
                  </div>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-slate-700 text-sm"
                    />
                  </div>
                  {!id && (
                    <div className="relative group">
                      <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="password"
                        placeholder="Account Password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-slate-700 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                    02
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/80">
                    Account Role
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.role === role ? "bg-indigo-600/10 border-indigo-500 text-white shadow-inner" : "bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-500 hover:bg-slate-800/60"}`}
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest text-left">
                        {role}
                      </span>
                      {formData.role === role && (
                        <FiCheckCircle className="text-indigo-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8 mt-12">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                    03
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/80 whitespace-nowrap">
                    Module Permissions
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded hidden sm:inline">
                  RBAC System
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {PERMISSIONS.map((perm) => (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermission(perm)}
                    className={`group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${formData.permissions.includes(perm) ? "bg-indigo-600/10 border-indigo-500/40 text-white shadow-xl shadow-indigo-500/5" : "bg-slate-800/20 border-slate-700/30 text-slate-600 hover:bg-slate-800/40 hover:border-slate-600"}`}
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${formData.permissions.includes(perm) ? "bg-indigo-500 text-white shadow-lg" : "bg-slate-800 text-slate-700 group-hover:bg-slate-700 group-hover:text-slate-400"}`}
                    >
                      <FiShield size={16} />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center group-hover:tracking-widest transition-all">
                      {perm}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-12 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate("/admin/sub-admins")}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold transition-all active:scale-95 text-sm"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95 active:translate-y-0"
              >
                {id ? "Save Account" : "Deploy Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateSubAdmin;
