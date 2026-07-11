import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiArrowLeft,
  FiClock,
} from "react-icons/fi";
import Navbar from "../components/Navbar";

const BusinessVerification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verificationData, setVerificationData] = useState({
    documentType: "registration_certificate",
    documentNumber: "",
    documentFile: null,
  });

  useEffect(() => {
    fetchBusinessStatus();
  }, []);

  const fetchBusinessStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/businesses/my");
      if (Array.isArray(res.data)) {
        setBusiness(res.data[0]);
      } else if (res.data.businesses && res.data.businesses.length > 0) {
        setBusiness(res.data.businesses[0]);
      } else {
        setBusiness(null);
      }
    } catch (_) {
      console.error("Failed to fetch business");
    } finally {
      setLoading(false);
    }
  };

  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  const MAX_SIZE_MB = 5;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(
        `File size must be under ${MAX_SIZE_MB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
      );
      e.target.value = "";
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVerificationData((prev) => ({
        ...prev,
        documentFile: reader.result,
        documentFileName: file.name,
      }));
      setUploading(false);
      toast.success(`"${file.name}" attached successfully.`);
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error("Failed to read file. Please try again.");
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationData.documentFile)
      return toast.error("Please upload a document first.");
    if (!verificationData.documentNumber.trim())
      return toast.error("Please enter the document number.");

    try {
      await api.post(`/businesses/${business._id}/verify`, verificationData);
      toast.success(
        "Verification request submitted! We'll review it within 24-48 hours.",
      );
      fetchBusinessStatus();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Submission failed. Please try again.",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );

  const cardCls =
    "bg-[#111827]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem]";

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-200 selection:bg-violet-500/30">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-32">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 group text-sm font-bold uppercase tracking-widest"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Profile
        </motion.button>

        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-600/20 mb-8 ring-8 ring-violet-500/10"
          >
            <FiShield size={40} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4"
          >
            Trust & Verification
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed"
          >
            Elevate your business credibility and unlock the full potential of
            the Lokonomy marketplace.
          </motion.p>
        </header>

        <AnimatePresence mode="wait">
          {!business ? (
            <motion.div
              key="no-business"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`${cardCls} p-16 text-center shadow-2xl`}
            >
              <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <FiInfo className="text-amber-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                No Business Profile Found
              </h2>
              <p className="text-slate-400 mb-10 max-w-sm mx-auto">
                You need to register a business listing before you can begin the
                identity verification process.
              </p>
              <button
                onClick={() => navigate("/add-business")}
                className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-600/30 transition-all active:scale-95"
              >
                Register Business
              </button>
            </motion.div>
          ) : business.verificationStatus === "verified" ? (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${cardCls} p-20 text-center shadow-2xl border-emerald-500/20 bg-emerald-500/5`}
            >
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <FiCheckCircle className="text-emerald-500" size={56} />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">
                Identity Verified
              </h2>
              <p className="text-slate-400 mb-10 text-lg">
                Congratulations! <strong>{business.businessName}</strong> is now
                a trusted member of the Lokonomy community.
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                <FiShield size={16} /> Trusted Merchant Active
              </div>
            </motion.div>
          ) : business.verificationStatus === "pending" ||
            business.verificationStatus === "under_review" ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${cardCls} p-20 text-center shadow-2xl border-violet-500/20 bg-violet-500/5`}
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-violet-500/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-violet-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiClock className="text-violet-400" size={32} />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-4">
                Verification in Review
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
                Our safety team is currently reviewing your documentation. This
                usually takes 24-48 business hours. We'll notify you once
                confirmed.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardCls} overflow-hidden shadow-2xl`}
            >
              <div className="p-10 border-b border-white/5 bg-white/2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FiFileText className="text-violet-500" /> Identity Documents
                </h2>
                <p className="text-slate-500 mt-2">
                  Official verification documents are required to confirm your
                  business entity.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                      Document Category
                    </label>
                    <select
                      className="w-full bg-[#0d1424] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-bold text-white cursor-pointer appearance-none"
                      value={verificationData.documentType}
                      onChange={(e) =>
                        setVerificationData({
                          ...verificationData,
                          documentType: e.target.value,
                        })
                      }
                    >
                      <option value="registration_certificate">
                        Registration Certificate
                      </option>
                      <option value="tax_id">Tax ID / GST Details</option>
                      <option value="utility_bill">
                        Business Address Proof
                      </option>
                      <option value="id_proof">
                        Individual ID (Aadhar/Voter)
                      </option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                      Identify Number
                    </label>
                    <input
                      required
                      className="w-full bg-[#0d1424] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-bold text-white placeholder:text-slate-700"
                      placeholder="e.g. GSTIN12345678"
                      value={verificationData.documentNumber}
                      onChange={(e) =>
                        setVerificationData({
                          ...verificationData,
                          documentNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    Document Attachment
                  </label>

                  {verificationData.documentFile ? (
                    <div className="border-2 border-violet-500 bg-violet-500/5 rounded-4xl p-10 text-center">
                      <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-violet-600 text-white scale-110 mb-4">
                        <FiCheckCircle size={32} />
                      </div>
                      <p className="text-lg font-bold text-white mb-1">
                        Document Attached
                      </p>
                      <p className="text-sm text-violet-300 font-mono truncate max-w-xs mx-auto mb-6">
                        {verificationData.documentFileName}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setVerificationData((prev) => ({
                            ...prev,
                            documentFile: null,
                            documentFileName: "",
                          }))
                        }
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all"
                      >
                        <FiAlertCircle size={14} /> Remove & Re-upload
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`relative group border-2 border-dashed rounded-4xl p-16 text-center transition-all duration-500 ${
                        uploading
                          ? "border-violet-500/50 bg-violet-500/5"
                          : "border-white/10 hover:border-violet-500/50 hover:bg-white/2"
                      }`}
                    >
                      <input
                        type="file"
                        id="document-upload"
                        aria-label="Click to Select File"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <div className="space-y-6">
                        <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 bg-white/5 text-slate-500 group-hover:scale-110 group-hover:bg-violet-600/20 group-hover:text-violet-400">
                          {uploading ? (
                            <div className="w-8 h-8 border-4 border-t-white border-white/20 rounded-full animate-spin" />
                          ) : (
                            <FiUploadCloud size={32} />
                          )}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white">
                            {uploading
                              ? "Reading file…"
                              : "Click to Select File"}
                          </p>
                          <p className="text-sm text-slate-500 mt-2 font-medium">
                            Supported: PDF, JPG, PNG · Max 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex gap-5">
                  <FiAlertCircle
                    className="text-amber-500 shrink-0 mt-1"
                    size={24}
                  />
                  <p className="text-sm text-amber-200/60 leading-relaxed font-medium">
                    Ensure the document is clear, valid, and matches your
                    business information exactly. Document tampering will result
                    in a permanent platform ban.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !verificationData.documentFile}
                  className="w-full py-5 bg-linear-to-r from-violet-600 to-indigo-700 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.01] transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  Submit verification request
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BusinessVerification;
