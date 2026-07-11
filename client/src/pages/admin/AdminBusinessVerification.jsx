import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { useConfirm } from "../../context/ConfirmContext";
import {
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiEye,
  FiSearch,
  FiFilter,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiTrendingUp,
  FiX,
  FiExternalLink,
} from "react-icons/fi";

const statusConfig = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  under_review: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  rejected: "bg-rose-500/15 text-rose-400 border-rose-500/25",
};

const getTimeInQueue = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return { text: `${days}d ${hours % 24}h`, isUrgent: days >= 3 };
  if (hours > 0) return { text: `${hours}h`, isUrgent: hours >= 48 };
  return { text: "< 1h", isUrgent: false };
};

const DocumentLightbox = ({ src, onClose }) => (
  <div
    className="fixed inset-0 z-9999 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button
      onClick={onClose}
      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
    >
      <FiX size={20} />
    </button>
    <img
      src={src}
      alt="KYC Document"
      className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

const AdminBusinessVerification = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const confirm = useConfirm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingVerifications();
      setBusinesses(response.data.businesses);
      setStats(response.data.stats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch verification queue");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === businesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(businesses.map(b => b._id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await confirm({
      title: `Approve ${selectedIds.length} Businesses`,
      description: `Are you sure you want to verify these ${selectedIds.length} businesses?`,
      confirmLabel: "Bulk Approve",
      isDanger: false,
    });
    if (!isConfirmed) return;

    try {
      await adminService.bulkApproveBusinesses(selectedIds);
      toast.success(`${selectedIds.length} businesses verified`);
      setSelectedIds([]);
      setIsBulkMode(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Bulk approval failed");
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0 || !rejectionReason.trim()) return;
    try {
      await adminService.bulkRejectBusinesses(selectedIds, rejectionReason);
      toast.success(`${selectedIds.length} businesses rejected`);
      setShowRejectionModal(false);
      setRejectionReason("");
      setSelectedIds([]);
      setIsBulkMode(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Bulk rejection failed");
    }
  };

  const handleApprove = async (id) => {
    const isConfirmed = await confirm({
      title: "Approve Business",
      description:
        "Are you sure you want to verify this business? This will grant them verified status and unlock premium features.",
      confirmLabel: "Approve & Verify",
      isDanger: false,
    });
    if (!isConfirmed) return;

    try {
      await adminService.approveBusiness(id);
      toast.success("Business verified successfully");
      fetchData();
      setSelectedBusiness(null);
    } catch (err) {
      console.error(err);
      toast.error("Approval failed");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    try {
      await adminService.rejectBusiness(selectedBusiness._id, rejectionReason);
      toast.success("Business verification rejected");
      setShowRejectionModal(false);
      setRejectionReason("");
      fetchData();
      setSelectedBusiness(null);
    } catch (err) {
      console.error(err);
      toast.error("Rejection failed");
    }
  };

  const markReview = async (id) => {
    try {
      await adminService.markVerificationUnderReview(id);
      toast.success("Marked as under review");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    }
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return (
      /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) ||
      url.includes("cloudinary") ||
      url.includes("imgur") ||
      url.includes("firebase")
    );
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <FiCheckCircle className="text-emerald-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              KYC Verification
            </h2>
          </div>
          
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsBulkMode(!isBulkMode);
              if (isBulkMode) setSelectedIds([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              isBulkMode 
                ? "bg-slate-800 text-slate-300 border-slate-700"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            }`}
          >
            {isBulkMode ? "Cancel Bulk Mode" : "Bulk Actions"}
          </button>
        </div>
      </header>

      {isBulkMode && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition-all"
            >
              {selectedIds.length === businesses.length && businesses.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <span className="text-sm font-bold text-slate-400">
              {selectedIds.length} selected
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (selectedIds.length === 0) {
                  toast.error("Select businesses first");
                  return;
                }
                setShowRejectionModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-wider hover:bg-rose-500/20 transition-all"
            >
              Bulk Reject
            </button>
            <button
              onClick={handleBulkApprove}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10"
            >
              Bulk Approve
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Pending",
            value: stats.pending,
            color: "amber",
            icon: FiClock,
          },
          {
            label: "In Review",
            value: stats.under_review,
            color: "indigo",
            icon: FiEye,
          },
          {
            label: "Verified Total",
            value: stats.verified,
            color: "emerald",
            icon: FiCheckCircle,
          },
          {
            label: "Rejected",
            value: stats.rejected,
            color: "rose",
            icon: FiXCircle,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-white/5 rounded-2xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <s.icon className={`text-${s.color}-400`} size={16} />
              <span className="text-2xl font-black text-white">
                {s.value || 0}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4 h-150 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5">
              <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">
                Verification queue is empty
              </p>
            </div>
          ) : (
            businesses.map((b) => {
              const queueTime = getTimeInQueue(b.createdAt);
              return (
                <div
                  key={b._id}
                  onClick={() => setSelectedBusiness(b)}
                  className={`group bg-slate-900/50 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all hover:border-emerald-500/30 ${selectedBusiness?._id === b._id ? "ring-2 ring-emerald-500/50 border-emerald-500/50 bg-emerald-500/5" : ""} ${selectedIds.includes(b._id) ? "border-emerald-500 bg-emerald-500/10" : ""}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {isBulkMode && (
                        <div onClick={(e) => handleSelect(e, b._id)} className="shrink-0 flex items-center justify-center cursor-pointer mr-1">
                          <input type="checkbox" checked={selectedIds.includes(b._id)} readOnly className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 pointer-events-none" />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center text-slate-400 font-bold">
                        {b.logo ? (
                          <img
                            src={b.logo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          b.businessName?.[0]
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight group-hover:text-emerald-400 transition-colors uppercase">
                          {b.businessName}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                          {b.category || b.mainCategory}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${statusConfig[b.verificationStatus]}`}
                      >
                        {b.verificationStatus?.replace("_", " ")}
                      </span>

                      <span
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          queueTime.isUrgent
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                            : "bg-slate-800 text-slate-500 border border-slate-700/50"
                        }`}
                      >
                        <FiClock size={8} />
                        {queueTime.text}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-bold uppercase tracking-tight">
                      <FiMapPin size={10} />
                      Gujarat, {b.district}
                    </span>
                    <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-7 bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden min-h-125 flex flex-col relative">
          {selectedBusiness ? (
            <div className="p-6 h-full flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none mb-2">
                    {selectedBusiness.businessName}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <FiTrendingUp className="text-emerald-400" /> Owned by{" "}
                    {selectedBusiness.ownerId?.name || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => markReview(selectedBusiness._id)}
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <FiEye size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      Contact Info
                    </p>
                    <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                      <p>Phone: {selectedBusiness.contactNumber}</p>
                      <p>Email: {selectedBusiness.ownerId?.email}</p>
                      <p className="truncate text-[10px] text-slate-500">
                        UID: {selectedBusiness.ownerId?._id}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                      Physical Address
                    </p>
                    <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 text-xs text-slate-300">
                      <p>{selectedBusiness.address}</p>
                      <p className="mt-1 font-bold text-slate-500 uppercase">
                        {selectedBusiness.taluka}, {selectedBusiness.district},{" "}
                        {selectedBusiness.pincode}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">
                    Verification Documents
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedBusiness.kycDocuments?.length > 0 ? (
                      selectedBusiness.kycDocuments.map((doc, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isImageUrl(doc)) {
                              setLightboxSrc(doc);
                            } else {
                              window.open(doc, "_blank");
                            }
                          }}
                          className="group/doc relative aspect-video bg-slate-950 rounded-xl border border-white/5 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all"
                        >
                          {isImageUrl(doc) ? (
                            <>
                              <img
                                src={doc}
                                alt={`KYC Document ${idx + 1}`}
                                className="w-full h-full object-cover group-hover/doc:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/doc:opacity-100 transition-opacity flex items-center justify-center">
                                <FiEye size={20} className="text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 group-hover/doc:bg-slate-900 transition-colors">
                              <FiFileText
                                size={20}
                                className="text-slate-500 group-hover/doc:text-emerald-400 transition-colors"
                              />
                              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                View Doc
                              </span>
                              <FiExternalLink
                                size={10}
                                className="text-slate-700"
                              />
                            </div>
                          )}
                          <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                            {idx + 1}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600">
                        <FiFileText size={20} className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          No documents uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex gap-3 pt-6 border-t border-white/5">
                <button
                  onClick={() => setShowRejectionModal(true)}
                  className="flex-1 py-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-black uppercase tracking-wider hover:bg-rose-500/20 transition-all"
                >
                  Reject Verification
                </button>
                <button
                  onClick={() => handleApprove(selectedBusiness._id)}
                  className="flex-2 py-4 rounded-2xl bg-emerald-600 text-white text-sm font-black uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/10"
                >
                  Approve & Verify
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-10 text-center">
              <FiCheckCircle size={64} className="mb-6 opacity-5" />
              <p className="text-base font-black text-white/20 uppercase tracking-[0.2em]">
                Select a queue item
              </p>
              <p className="text-xs text-slate-500 font-bold mt-2">
                Pick a business from the left to start the KYC process
              </p>
            </div>
          )}
        </div>
      </div>

      {lightboxSrc && (
        <DocumentLightbox
          src={lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">
              Rejection Reason
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please provide a valid reason for rejecting this verification
              request. This will be visible to the business owner.
            </p>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-rose-500 outline-none h-32 resize-none mb-4"
              placeholder="e.g. Identity documents are blurred, address proof doesn't match..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => isBulkMode ? handleBulkReject() : handleReject()}
                className="flex-2 py-3 bg-rose-600 text-white rounded-xl font-black text-sm hover:bg-rose-500 transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBusinessVerification;
