import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiMessageSquare,
  FiStar,
  FiTrash2,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiPieChart,
  FiPackage,
  FiBriefcase,
  FiX,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const AdminReviews = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("business"); 
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 6,
        rating: filterRating || undefined,
      };

      let res;
      if (activeTab === "business") {
        res = await adminService.getBusinessReviews(params);
      } else {
        res = await adminService.getProductReviews(params);
      }

      setReviews(res.data.reviews);
      setTotalPages(res.data.pages);
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeTab, page, filterRating]);

  const handleDelete = async (targetId, reviewId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this review? This action cannot be undone.",
      )
    )
      return;

    try {
      if (activeTab === "business") {
        await adminService.deleteBusinessReview(targetId, reviewId);
      } else {
        await adminService.deleteProductReview(targetId, reviewId);
      }
      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const handleShowAnalytics = (businessId) => {
    navigate(`/admin/reviews/analytics/${businessId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <FiMessageSquare className="text-indigo-400" />
              </span>
              Review <span className="text-indigo-500">Management</span>
            </h1>
          
          </div>

          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-sm self-stretch md:self-auto">
            <button
              onClick={() => {
                setActiveTab("business");
                setPage(1);
              }}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "business" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-slate-200"}`}
            >
              <FiBriefcase /> Business
            </button>
            <button
              onClick={() => {
                setActiveTab("product");
                setPage(1);
              }}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "product" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-slate-200"}`}
            >
              <FiPackage /> Product
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Filter by Rating
            </label>
            <div className="relative">
              <select
                value={filterRating}
                onChange={(e) => {
                  setFilterRating(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-4 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <FiFilter className="text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl flex flex-col gap-2 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Search Analytics per Business
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Business ID..."
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white px-10 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              <button
                onClick={() => handleShowAnalytics(selectedBusinessId)}
                disabled={!selectedBusinessId}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Go
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl flex flex-col justify-center items-center">
            <div className="text-2xl font-black text-white">
              {reviews.length * page}/{totalPages * reviews.length || 0}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Current View
            </div>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-sm">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold animate-pulse">
                Fetching latest reviews...
              </p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
                <FiMessageSquare size={40} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl">
                  No reviews found
                </h3>
                <p className="text-slate-500">
                  No one has shared their feedback yet with these filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              <AnimatePresence mode="popLayout">
                {reviews.map((review, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    key={review.reviewId}
                    className="group bg-slate-800/40 border border-slate-700/40 hover:border-indigo-500/40 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10"
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 font-black">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm leading-none">
                            {review.userName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                            {activeTab === "business" ? (
                              <FiBriefcase className="text-[8px]" />
                            ) : (
                              <FiPackage className="text-[8px]" />
                            )}
                            {activeTab === "business"
                              ? review.businessName
                              : review.productName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-lg">
                        <FiStar className="text-yellow-500 fill-yellow-500 text-[10px]" />
                        <span className="text-yellow-500 text-xs font-black">
                          {review.rating}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 relative z-10">
                      <p className="text-slate-300 text-sm leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 border-t border-slate-700/40 pt-4 relative z-10">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        {activeTab === "business" && (
                          <button
                            onClick={() =>
                              handleShowAnalytics(review.businessId)
                            }
                            className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
                            title="View Business Analytics"
                          >
                            <FiPieChart size={14} />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDelete(
                              activeTab === "business"
                                ? review.businessId
                                : review.productId,
                              review.reviewId,
                            )
                          }
                          className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                          title="Delete Review"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-6 border-t border-slate-800/80 bg-slate-800/10">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                  <FiChevronLeft />
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let num;
                    if (totalPages <= 5) {
                      num = i + 1;
                    } else if (page <= 3) {
                      num = i + 1;
                    } else if (page >= totalPages - 2) {
                      num = totalPages - 4 + i;
                    } else {
                      num = page - 2 + i;
                    }
                    if (num > totalPages) return null;
                    return (
                      <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${page === num ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-800 text-slate-500 hover:text-white border border-slate-700 hover:border-slate-600"}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
