import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiSettings,
  FiShield,
  FiSearch,
  FiSave,
  FiGlobe,
  FiShare2,
  FiCreditCard,
  FiActivity,
  FiLayout,
  FiSlash,
} from "react-icons/fi";

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("platform");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPlatformSettings();
      setSettings(response.data);
    } catch (error) {
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updatePlatformSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async () => {
    try {
      const response = await adminService.toggleMaintenanceMode();
      setSettings(response.data.settings);
      toast.success(
        `Maintenance mode ${response.data.settings.maintenanceMode ? "activated" : "deactivated"}`,
      );
    } catch (error) {
      toast.error("Toggle failed");
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-40">
          <div className="w-10 h-10 border-2 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-slate-500/15 border border-slate-500/20 flex items-center justify-center">
              <FiSettings className="text-slate-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Platform Settings
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Control global platform behavior and configuration
          </p>
        </div>

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border border-t-white rounded-full animate-spin" />
          ) : (
            <FiSave size={16} />
          )}
          Save Configuration
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3 bg-slate-900/50 border border-white/5 rounded-3xl p-3 space-y-1">
          {[
            { id: "platform", label: "General", icon: FiSettings },
            { id: "seo", label: "SEO & Meta", icon: FiGlobe },
            { id: "social", label: "Social Config", icon: FiShare2 },
            { id: "financial", label: "Economics", icon: FiCreditCard },
            { id: "featured", label: "Featured Sections", icon: FiLayout },
            { id: "moderation", label: "Moderation Rules", icon: FiShield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
          <div className="pt-2 mt-2 border-t border-white/5">
            <button
              onClick={toggleMaintenance}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                settings.maintenanceMode
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
              }`}
            >
              <FiSlash size={16} />
              Maintenance: {settings.maintenanceMode ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-9 bg-slate-900/50 border border-white/5 rounded-3xl p-8">
          <form className="space-y-8">
            {activeTab === "platform" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      Support Email
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                      defaultValue="support@lokonomy.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      Contact Phone
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                      defaultValue="+91 98765 43210"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                    Platform AnnouncementBar
                  </label>
                  <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                    placeholder="Enter text to show on top of all pages..."
                  />
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                    Home Page Title
                  </label>
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                    value={settings.seo?.homeTitle}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo: { ...settings.seo, homeTitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                    Meta Description
                  </label>
                  <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none h-32 resize-none"
                    value={settings.seo?.homeMetaDescription}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        seo: {
                          ...settings.seo,
                          homeMetaDescription: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "social" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                {[
                  { id: "facebook", label: "Facebook URL" },
                  { id: "instagram", label: "Instagram URL" },
                  { id: "twitter", label: "Twitter URL" },
                  { id: "youtube", label: "YouTube URL" },
                  { id: "whatsapp", label: "WhatsApp Number" },
                ].map((s) => (
                  <div key={s.id}>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      {s.label}
                    </label>
                    <input
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                      value={settings.socialLinks?.[s.id] || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            [s.id]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "financial" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      Order Commission (%)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                      value={settings.platformFees?.orderCommissionPercentage}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          platformFees: {
                            ...settings.platformFees,
                            orderCommissionPercentage: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      Store Listing Fee (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                      value={settings.platformFees?.listingFee}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          platformFees: {
                            ...settings.platformFees,
                            listingFee: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "moderation" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      Auto-Flag Threshold
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none"
                        value={settings.moderation?.autoFlagThreshold || 5}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            moderation: {
                              ...settings.moderation,
                              autoFlagThreshold: e.target.value,
                            },
                          })
                        }
                      />
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        Reports before hiding
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-950/30 p-4 rounded-xl border border-white/5">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">
                        Admin Notifications
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        Notify admins on new reports
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          moderation: {
                            ...settings.moderation,
                            autoNotifyAdmins:
                              !settings.moderation?.autoNotifyAdmins,
                          },
                        })
                      }
                      className={`w-12 h-6 rounded-full relative transition-all ${settings.moderation?.autoNotifyAdmins ? "bg-indigo-600" : "bg-slate-800"}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.moderation?.autoNotifyAdmins ? "left-7" : "left-1"}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
