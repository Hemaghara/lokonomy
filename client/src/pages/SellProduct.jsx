import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { marketService } from "../services";
import { MARKET_CATEGORIES } from "../data/marketCategories";
import { useLocation } from "../context/LocationContext";
import { getTalukas } from "../data/locations";
import { useUser } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import MapPicker from "../components/MapPicker";
const CustomDropdown = ({
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none
          ${
            disabled
              ? "opacity-30 cursor-not-allowed bg-white/2 border-white/8"
              : open
                ? "bg-white/[0.07] border-primary/60 ring-2 ring-primary/10"
                : "bg-white/4 border-white/10 hover:bg-white/6 hover:border-white/20 cursor-pointer"
          }`}
      >
        <span className={selected ? "text-white" : "text-white/25"}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30 ml-2 shrink-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-[#131929] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="py-1.5 max-h-52 overflow-y-auto">
              {options.length === 0 ? (
                <p className="px-4 py-3 text-sm text-white/25 text-center">
                  No options available
                </p>
              ) : (
                options.map((opt) => {
                  const isActive = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 flex items-center justify-between
                        ${
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "text-white/65 hover:bg-white/6 hover:text-white"
                        }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
const inputCls =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200";

const Field = ({ label, required, span2, children }) => (
  <div className={span2 ? "sm:col-span-2" : ""}>
    <label className="block text-[11px] font-medium text-white/35 mb-2 tracking-wider uppercase">
      {label}
      {required && <span className="text-primary/60 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Divider = ({ label }) => (
  <div className="sm:col-span-2 flex items-center gap-3 pt-2">
    <div className="flex-1 h-px bg-white/6" />
    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest shrink-0">
      {label}
    </span>
    <div className="flex-1 h-px bg-white/6" />
  </div>
);
const SellProduct = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { state, availableDistricts } = useLocation();

  const [shopLocation, setShopLocation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    price: "",
    priceType: "sell",
    mainCategory: "",
    subCategory: "",
    productImages: [],
    sellerProfile: {
      name: user?.name || "",
      contactNumber: "",
      whatsappNumber: "",
      contactPreference: "call",
      email: user?.email || "",
    },
    isFeatured: false,
  });

  useEffect(() => {
    if (shopLocation) {
      setFormData((prev) => ({
        ...prev,
        address: shopLocation.address || prev.address,
        pincode: shopLocation.pincode || prev.pincode,
        state: shopLocation.state || prev.state,
        // Optional: you might want to try and auto-select district/taluka if they match your location data
      }));
    }
  }, [shopLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mainCategory") {
      setFormData((prev) => ({
        ...prev,
        mainCategory: value,
        subCategory: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSellerChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      sellerProfile: { ...prev.sellerProfile, [e.target.name]: e.target.value },
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result]);
        setFormData((prev) => ({
          ...prev,
          productImages: [...prev.productImages, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.productImages.length === 0)
      return toast.error("At least one photo is required.");
    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: shopLocation?.lat,
        longitude: shopLocation?.lng,
        locationAddress: shopLocation?.address,
      };
      const res = await marketService.addProduct(payload);
      if (res.data.success) {
        toast.success("Product listed successfully!");
        navigate("/market");
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.code === "LIMIT_REACHED") {
        toast(
          (t) => (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-200">
                {errorData.message}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate("/upgrade-plan");
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  Upgrade Plan
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          ),
          {
            duration: 6000,
            position: "top-center",
            style: {
              background: "#111827",
              border: "1px solid #1f2a3d",
              padding: "16px",
              color: "#fff",
              borderRadius: "16px",
              maxWidth: "350px",
            },
            icon: "🚀",
          },
        );
      } else {
        toast.error(`Error: ${errorData?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const mainCategoryOptions = Object.keys(MARKET_CATEGORIES).map((c) => ({
    value: c,
    label: c,
  }));
  const subCategoryOptions = formData.mainCategory
    ? MARKET_CATEGORIES[formData.mainCategory].map((s) => ({
        value: s,
        label: s,
      }))
    : [];
  const priceTypeOptions = [
    { value: "sell", label: "For Sale" },
    { value: "rent", label: "For Rent" },
  ];
  const contactPrefOptions = [
    { value: "call", label: "Phone Call" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "email", label: "Email" },
  ];

  return (
    <div className="min-h-screen bg-dark-bg pt-28 pb-24 px-4 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-125 h-100 bg-primary/6 blur-[130px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-100 h-100 bg-secondary/5 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-[0.18em]">
              Marketplace Hub
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            List Your Product
          </h1>
          <p className="text-sm text-white/30">
            Complete the details below to list your item in the regional
            directory.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white/2.5 border border-white/8 rounded-2xl p-7 sm:p-10 backdrop-blur-sm shadow-2xl shadow-black/30"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Divider label="Product Info" />

              <Field label="Product Title" required span2>
                <input
                  type="text"
                  name="productName"
                  placeholder="e.g. Professional Camera Setup"
                  className={inputCls}
                  required
                  value={formData.productName}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Price (₹)" required>
                <input
                  type="number"
                  name="price"
                  placeholder="0"
                  className={inputCls}
                  required
                  value={formData.price}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Listing Type">
                <CustomDropdown
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleChange}
                  options={priceTypeOptions}
                />
              </Field>

              <Field label="Main Category" required>
                <CustomDropdown
                  name="mainCategory"
                  value={formData.mainCategory}
                  onChange={handleChange}
                  options={mainCategoryOptions}
                  placeholder="Select Category"
                />
              </Field>

              <Field label="Sub Category" required>
                <CustomDropdown
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  options={subCategoryOptions}
                  placeholder="Select Sub-Category"
                  disabled={!formData.mainCategory}
                />
              </Field>

              <Divider label="Premium Features" />
              <div className="sm:col-span-2">
                <div
                  onClick={() => {
                    if (user?.subscription?.plan !== "platinum") {
                      if (
                        window.confirm(
                          "Featured listings are exclusive to Platinum members. Update your plan now?",
                        )
                      ) {
                        navigate("/upgrade-plan");
                      }
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        isFeatured: !prev.isFeatured,
                      }));
                    }
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group
                    ${
                      formData.isFeatured
                        ? "bg-violet-600/10 border-violet-500/40 shadow-lg shadow-violet-500/10"
                        : user?.subscription?.plan === "platinum"
                          ? "bg-white/2 border-white/6 hover:border-violet-500/30"
                          : "bg-white/2 border-white/6 opacity-60 hover:opacity-100"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md
                      ${formData.isFeatured ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 group-hover:text-amber-400"} transition-all`}
                    >
                      ✨
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">
                        Featured Listing
                      </p>
                      <p className="text-slate-500 text-[10px]">
                        Your product will appear at the top of category searches
                      </p>
                    </div>
                  </div>
                  {user?.subscription?.plan !== "platinum" && (
                    <div className="px-2 py-0.5 rounded-lg bg-linear-to-r from-violet-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                      Platinum Only
                    </div>
                  )}
                  {formData.isFeatured && (
                    <div className="w-5 h-5 rounded-full bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[10px] text-white">
                      ✓
                    </div>
                  )}
                </div>
              </div>

              <Field label="Description" required span2>
                <textarea
                  name="description"
                  placeholder="Describe the item's condition, features, and any other details..."
                  className={`${inputCls} min-h-28 resize-none leading-relaxed`}
                  required
                  value={formData.description}
                  onChange={handleChange}
                />
              </Field>

              <Divider label="Photos" />

              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/30">
                    Up to 5 photos · Max 10MB each
                  </p>
                  <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                    {previews.length} / 5
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden group border border-white/10"
                    >
                      <img
                        src={src}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <label className="aspect-square rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-white/4 hover:border-primary/30 transition-all group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <svg
                        className="w-5 h-5 text-white/20 group-hover:text-primary/50 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="text-[9px] font-medium text-white/20 group-hover:text-white/40 uppercase tracking-wider transition-colors">
                        Add
                      </span>
                    </label>
                  )}
                </div>
              </div>
              <Divider label="Set Location on Map" />
              <div className="sm:col-span-2">
                <MapPicker value={shopLocation} onChange={setShopLocation} />
              </div>

              <Divider label="Regional Details" />

              <Field label="Pincode" span2>
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode (Auto-filled from Map)"
                  className={inputCls + " bg-white/2 cursor-not-allowed"}
                  readOnly
                  value={formData.pincode || ""}
                />
              </Field>

              <Field label="Street Address" span2>
                <input
                  type="text"
                  name="address"
                  placeholder="Street Address (Auto-filled from Map)"
                  className={inputCls + " bg-white/2 cursor-not-allowed"}
                  readOnly
                  value={formData.address || ""}
                />
              </Field>
              <Divider label="Seller Info" />

              <Field label="Contact Number" required>
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="+91 Phone Number"
                  className={inputCls}
                  required
                  value={formData.sellerProfile.contactNumber}
                  onChange={handleSellerChange}
                />
              </Field>

              <Field label="WhatsApp Number">
                <input
                  type="tel"
                  name="whatsappNumber"
                  placeholder="+91 WhatsApp"
                  className={inputCls}
                  value={formData.sellerProfile.whatsappNumber}
                  onChange={handleSellerChange}
                />
              </Field>

              <Field label="Contact Preference">
                <CustomDropdown
                  name="contactPreference"
                  value={formData.sellerProfile.contactPreference}
                  onChange={handleSellerChange}
                  options={contactPrefOptions}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  value={formData.sellerProfile.email}
                  onChange={handleSellerChange}
                />
              </Field>
              <div className="sm:col-span-2 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden bg-primary text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 group"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/10 to-transparent" />
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Publishing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Publish Listing
                      <svg
                        className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  )}
                </button>
                <p className="text-center text-[11px] text-white/20 mt-4">
                  Fields marked <span className="text-primary/50">*</span> are
                  required
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SellProduct;
