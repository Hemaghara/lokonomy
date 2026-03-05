import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { businessService } from "../services";
import { categories } from "../data/categories";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import MapPicker from "../components/MapPicker";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingStorefront,
  HiOutlineUser,
  HiOutlineTag,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineClipboardDocument,
  HiOutlineCheckCircle,
  HiOutlineCamera,
  HiOutlineChevronDown,
  HiOutlineSun,
  HiOutlineMoon,
} from "react-icons/hi2";
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";

const TimePicker = ({ value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [hh, mm] = value.split(":").map(Number);
  const isPM = hh >= 12;
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;

  const setHour12 = (h12) => {
    const newHH = isPM ? (h12 % 12) + 12 : h12 % 12;
    onChange(
      `${String(newHH).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    );
  };
  const setMinute = (m) => {
    onChange(`${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };
  const toggleAMPM = () => {
    const newHH = isPM ? hh - 12 : hh + 12;
    onChange(
      `${String(newHH).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    );
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const display12 = `${String(hour12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 bg-[#111827] border text-xs font-semibold px-3 py-2.5 rounded-xl transition-all w-32.5 justify-between
          ${open ? "border-violet-500 text-violet-400 ring-2 ring-violet-500/20" : "border-[#1f2a3d] text-slate-300 hover:border-violet-500/40"}`}
      >
        <HiOutlineClock
          className={`text-sm shrink-0 ${open ? "text-violet-400" : "text-slate-500"}`}
        />
        <span>{display12}</span>
        <HiOutlineChevronDown
          className={`text-xs shrink-0 transition-transform ${open ? "rotate-180 text-violet-400" : "text-slate-600"}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 bg-[#111827] border border-[#1f2a3d] rounded-2xl shadow-2xl shadow-black/50 p-4 w-65">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {label}
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-slate-600 font-medium text-center mb-2">
                Hour
              </p>
              <div className="grid grid-cols-3 gap-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour12(h)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${
                        hour12 === h
                          ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                          : "text-slate-400 hover:bg-[#1f2a3d] hover:text-white"
                      }`}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px bg-[#1f2a3d] self-stretch" />
            <div className="flex-1">
              <p className="text-[10px] text-slate-600 font-medium text-center mb-2">
                Minute
              </p>
              <div className="grid grid-cols-3 gap-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${
                        mm === m
                          ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                          : "text-slate-400 hover:bg-[#1f2a3d] hover:text-white"
                      }`}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-[#1f2a3d]">
            <button
              type="button"
              onClick={() => {
                if (isPM) toggleAMPM();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all
                ${!isPM ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500 hover:bg-[#1f2a3d]"}`}
            >
              <HiOutlineSun className="text-sm" /> AM
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPM) toggleAMPM();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all
                ${isPM ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-slate-500 hover:bg-[#1f2a3d]"}`}
            >
              <HiOutlineMoon className="text-sm" /> PM
            </button>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full mt-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

const EditBusiness = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  // shopLocation: { lat, lng, address } | null
  const [shopLocation, setShopLocation] = useState(null);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const initialBusinessHours = daysOfWeek.reduce((acc, day) => {
    acc[day] = {
      isOpen: day !== "Sunday",
      startTime: "09:00",
      endTime: "18:00",
    };
    return acc;
  }, {});

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    description: "",
    mainCategory: "",
    subCategory: "",
    logo: "",
    photos: [],
    contactNumber: "",
    email: "",
    website: "",
    address: "",
    state: "Gujarat",
    district: "",
    taluka: "",
    pincode: "",
    facebookLink: "",
    instagramLink: "",
    youtubeLink: "",
    twitterLink: "",
    businessHours: initialBusinessHours,
  });

  useEffect(() => {
    if (shopLocation) {
      setFormData((prev) => ({
        ...prev,
        address: shopLocation.address || prev.address,
        pincode: shopLocation.pincode || prev.pincode,
        state: shopLocation.state || prev.state,
        district: shopLocation.district || prev.district,
        taluka: shopLocation.taluka || prev.taluka,
      }));
    }
  }, [shopLocation]);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await businessService.getBusinessById(id);
        const biz = response.data;

        let hours = initialBusinessHours;
        if (biz.businessHours) {
          const bh = biz.businessHours;
          daysOfWeek.forEach((day) => {
            const dayData = bh[day] || (bh.get && bh.get(day));
            if (dayData) {
              hours[day] = {
                isOpen: dayData.isOpen ?? true,
                startTime: dayData.startTime || "09:00",
                endTime: dayData.endTime || "18:00",
              };
            }
          });
        }

        setFormData({
          businessName: biz.businessName || "",
          ownerName: biz.ownerName || "",
          description: biz.description || "",
          mainCategory: biz.mainCategory || "",
          subCategory: biz.subCategory || "",
          logo: biz.logo || "",
          photos: biz.photos || [],
          contactNumber: biz.contactNumber || "",
          email: biz.email || "",
          website: biz.website || "",
          address: biz.address || "",
          state: biz.state || "Gujarat",
          district: biz.district || "",
          taluka: biz.taluka || "",
          pincode: biz.pincode || "",
          facebookLink: biz.facebookLink || "",
          instagramLink: biz.instagramLink || "",
          youtubeLink: biz.youtubeLink || "",
          twitterLink: biz.twitterLink || "",
          businessHours: hours,
        });

        if (
          biz.location &&
          biz.location.coordinates &&
          biz.location.coordinates.length === 2
        ) {
          const [lng, lat] = biz.location.coordinates;
          setShopLocation({
            lat,
            lng,
            address:
              biz.locationAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          });
        }
      } catch (err) {
        console.error("Error fetching business:", err);
        toast.error("Failed to load business data");
        navigate("/profile");
      } finally {
        setFetching(false);
      }
    };
    fetchBusiness();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHourChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours[day], [field]: value },
      },
    }));
  };

  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (target === "logo") {
        setFormData((prev) => ({ ...prev, logo: reader.result }));
      } else {
        if (formData.photos.length >= 25) {
          toast.error("Maximum 25 photos allowed.");
          return;
        }
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, reader.result],
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const applyToAllDays = (sourceDay) => {
    const sourceStatus = formData.businessHours[sourceDay];
    const newHours = { ...formData.businessHours };
    daysOfWeek.forEach((day) => {
      newHours[day] = { ...sourceStatus };
    });
    setFormData((prev) => ({ ...prev, businessHours: newHours }));
    toast.success(`Applied ${sourceDay}'s hours to all days`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopLocation) {
      toast.error("Please pin your shop location on the map.");
      return;
    }
    if (!/^\d{10}$/.test(formData.contactNumber)) {
      toast.error("Please enter a valid 10-digit contact number.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: shopLocation.lat,
        longitude: shopLocation.lng,
        locationAddress: shopLocation.address || "",
      };
      const response = await businessService.updateBusiness(id, payload);
      if (response.data.success) {
        toast.success("Business Updated Successfully!");
        navigate(`/business/${response.data.business._id}`);
      }
    } catch (err) {
      console.error("Error updating business:", err);
      toast.error(
        err.response?.data?.message ||
          "Update Failed. Please check all fields.",
      );
    } finally {
      setLoading(false);
    }
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600 disabled:opacity-40";
  const labelCls =
    "text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";
  const sectionTitle =
    "flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-5 pb-4 border-b border-[#1f2a3d]";
  const dayAbbr = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
          Loading Business…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .ab * { font-family: 'DM Sans', sans-serif; }
        .ab select option { background: #111827; color: #e2e8f0; }
      `}</style>

      <div className="ab max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-6"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back
          </button>
          <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
            Edit Business
          </p>
          <h1 className="text-white font-bold text-2xl md:text-3xl leading-snug">
            Update Your Business
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Modify your business details and save changes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className={card + " p-6"}>
            <h2 className={sectionTitle}>
              <HiOutlineBuildingStorefront className="text-violet-400 text-base" />{" "}
              Business Profile
            </h2>
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[#1f2a3d]">
              <div className="w-20 h-20 rounded-2xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center overflow-hidden shrink-0">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <HiOutlineCamera className="text-3xl text-slate-700" />
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 bg-[#0d1424] hover:bg-violet-500/10 border border-[#1f2a3d] hover:border-violet-500/30 text-slate-400 hover:text-violet-400 text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer transition-all">
                  <HiOutlinePhoto className="text-sm" /> Change Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logo")}
                  />
                </label>
                <p className="text-slate-600 text-[11px] mt-2">
                  Square image · PNG/JPG · Max 2MB
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  <HiOutlineBuildingStorefront className="text-violet-400" />{" "}
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  placeholder="e.g. Neo Electronics"
                  className={inputCls}
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineUser className="text-violet-400" /> Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  placeholder="Full name"
                  className={inputCls + " bg-[#0d1424]/50 cursor-not-allowed"}
                  readOnly
                  required
                  value={formData.ownerName}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineTag className="text-violet-400" /> Main Category *
                </label>
                <select
                  name="mainCategory"
                  className={inputCls}
                  required
                  value={formData.mainCategory}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineTag className="text-violet-400" /> Sub Category *
                </label>
                <select
                  name="subCategory"
                  className={inputCls}
                  required
                  value={formData.subCategory}
                  onChange={handleChange}
                  disabled={!formData.mainCategory}
                >
                  <option value="">Select Sub-Category</option>
                  {categories
                    .find((c) => c.name === formData.mainCategory)
                    ?.subcategories.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  <HiOutlineDocumentText className="text-violet-400" />{" "}
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Tell customers about your services, experience, and what makes you special…"
                  className={inputCls + " h-24 resize-none"}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className={card + " p-6"}>
            <h2 className={sectionTitle}>
              <HiOutlinePhone className="text-violet-400 text-base" /> Contact &
              Social Links
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  <HiOutlinePhone className="text-violet-400" /> Contact Number
                  (10 Digits) *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="82009 73720"
                  className={inputCls}
                  required
                  value={formData.contactNumber}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineEnvelope className="text-violet-400" /> Email
                  Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="business@example.com"
                  className={inputCls}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  <HiOutlineGlobeAlt className="text-violet-400" /> Website URL
                </label>
                <input
                  type="url"
                  name="website"
                  placeholder="https://www.yoursite.com"
                  className={inputCls}
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#1f2a3d]">
              <div>
                <label className={labelCls}>
                  <FaFacebook className="text-blue-400" /> Facebook
                </label>
                <input
                  type="text"
                  name="facebookLink"
                  placeholder="facebook.com/yourpage"
                  className={inputCls}
                  value={formData.facebookLink}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <FaInstagram className="text-pink-400" /> Instagram
                </label>
                <input
                  type="text"
                  name="instagramLink"
                  placeholder="instagram.com/yourpage"
                  className={inputCls}
                  value={formData.instagramLink}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <FaYoutube className="text-red-400" /> YouTube
                </label>
                <input
                  type="text"
                  name="youtubeLink"
                  placeholder="youtube.com/yourchannel"
                  className={inputCls}
                  value={formData.youtubeLink}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <FaTwitter className="text-sky-400" /> Twitter / X
                </label>
                <input
                  type="text"
                  name="twitterLink"
                  placeholder="twitter.com/yourhandle"
                  className={inputCls}
                  value={formData.twitterLink}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className={card + " p-6"}>
            <h2 className={sectionTitle}>
              <HiOutlineMapPin className="text-violet-400 text-base" /> Shop
              Location
            </h2>

            {/* Map Picker */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <HiOutlineMapPin className="text-violet-400" /> Pin Exact Shop
                Location on Map *
              </p>
              <MapPicker
                value={shopLocation}
                onChange={setShopLocation}
                height="340px"
              />
              {!shopLocation && (
                <p className="text-[11px] text-amber-400/80 mt-2 font-medium">
                  ⚠ Pin required — move the marker to update your shop's
                  location.
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  <HiOutlineMapPin className="text-violet-400" /> Street Address
                  *
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Street Address (Pin location on map to fill)"
                  className={inputCls + " bg-[#0d1424]/50 cursor-not-allowed"}
                  readOnly
                  required
                  value={formData.address}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineMapPin className="text-violet-400" /> State
                </label>
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  className={inputCls + " bg-[#0d1424]/50 cursor-not-allowed"}
                  readOnly
                  value={formData.state}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineMapPin className="text-violet-400" /> District
                </label>
                <input
                  type="text"
                  name="district"
                  placeholder="District"
                  className={inputCls + " bg-[#0d1424]/50 cursor-not-allowed"}
                  readOnly
                  value={formData.district}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineMapPin className="text-violet-400" /> Taluka
                </label>
                <input
                  type="text"
                  name="taluka"
                  placeholder="Taluka"
                  className={inputCls + " bg-[#0d1424]/50 cursor-not-allowed"}
                  readOnly
                  value={formData.taluka}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <HiOutlineMapPin className="text-violet-400" /> Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  className={inputCls + " bg-[#0d1424]/50 cursor-not-allowed"}
                  readOnly
                  value={formData.pincode}
                />
              </div>
            </div>
          </div>

          <div className={card + " p-6"}>
            <h2 className={sectionTitle}>
              <HiOutlineClock className="text-violet-400 text-base" /> Business
              Hours
              <span className="ml-auto text-[10px] text-slate-600 font-normal">
                Click time to change
              </span>
            </h2>

            <div className="space-y-2">
              {daysOfWeek.map((day) => {
                const hrs = formData.businessHours[day];
                return (
                  <div
                    key={day}
                    className={`flex flex-wrap items-center gap-3 p-3.5 rounded-xl border transition-all duration-200
                      ${hrs.isOpen ? "bg-[#0d1424] border-[#1f2a3d]" : "bg-[#0a0f1c] border-[#161f2e] opacity-50"}`}
                  >
                    <span className="w-9 text-slate-400 font-semibold text-xs shrink-0">
                      {dayAbbr[day]}
                    </span>

                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <div
                        className={`w-9 h-5 rounded-full relative transition-all duration-200 shrink-0 ${hrs.isOpen ? "bg-violet-600" : "bg-[#1f2a3d]"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${hrs.isOpen ? "left-4" : "left-0.5"}`}
                        />
                      </div>
                      <input
                        type="checkbox"
                        checked={hrs.isOpen}
                        onChange={(e) =>
                          handleHourChange(day, "isOpen", e.target.checked)
                        }
                        className="hidden"
                      />
                      <span
                        className={`text-[11px] font-semibold w-11 ${hrs.isOpen ? "text-violet-400" : "text-slate-600"}`}
                      >
                        {hrs.isOpen ? "Open" : "Closed"}
                      </span>
                    </label>
                    {hrs.isOpen && (
                      <div className="flex items-center gap-2 ml-auto flex-wrap">
                        <TimePicker
                          value={hrs.startTime}
                          label="Opening Time"
                          onChange={(val) =>
                            handleHourChange(day, "startTime", val)
                          }
                        />
                        <span className="text-slate-700 text-xs">→</span>
                        <TimePicker
                          value={hrs.endTime}
                          label="Closing Time"
                          onChange={(val) =>
                            handleHourChange(day, "endTime", val)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => applyToAllDays(day)}
                          title="Apply to all days"
                          className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-violet-400 border border-[#1f2a3d] hover:border-violet-500/30 px-2.5 py-2 rounded-lg transition-all shrink-0"
                        >
                          <HiOutlineClipboardDocument className="text-sm" /> All
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Gallery ── */}
          <div className={card + " p-6"}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1f2a3d]">
              <h2 className="flex items-center gap-2.5 text-slate-200 font-semibold text-sm">
                <HiOutlinePhoto className="text-violet-400 text-base" /> Shop
                Gallery
              </h2>
              <span className="text-xs text-slate-600">
                {formData.photos.length} / 25
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {formData.photos.length < 25 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-[#1f2a3d] hover:border-violet-500/40 bg-[#0d1424] hover:bg-violet-500/5 cursor-pointer flex flex-col items-center justify-center gap-1.5 group transition-all">
                  <HiOutlinePlus className="text-xl text-slate-700 group-hover:text-violet-400 transition-colors" />
                  <span className="text-[10px] text-slate-700 group-hover:text-violet-400 font-medium transition-colors">
                    Add
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "gallery")}
                  />
                </label>
              )}
              {formData.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl bg-[#0d1424] border border-[#1f2a3d] relative group overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`Gallery ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <HiOutlineXMark className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 active:scale-[.98] text-white font-semibold text-sm py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Saving Changes…
              </>
            ) : (
              <>
                <HiOutlineCheckCircle className="text-base" /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditBusiness;
