import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { businessService } from "../services";
import {
  FaArrowLeft,
  FaStar,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaCheckCircle,
} from "react-icons/fa";

const CompareBusinesses = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ids = searchParams.get("ids")?.split(",") || [];

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const results = await Promise.all(
          ids.map((id) => businessService.getBusinessById(id)),
        );
        setBusinesses(results.map((res) => res.data));
      } catch (err) {
        console.error("Error fetching comparison data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-white text-3xl font-black mb-4">
          No businesses selected
        </h2>
        <p className="text-text-dim mb-8">
          Go back to the services page to select businesses for comparison.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary px-8 rounded-xl font-bold"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const comparisonFields = [
    { label: "Category", key: "subCategory" },
    {
      label: "Rating",
      key: "rating",
      render: (val) => (
        <div className="flex items-center gap-2">
          <FaStar className="text-yellow-500" />
          <span className="font-bold">{(val || 0).toFixed(1)}</span>
        </div>
      ),
    },
    { label: "Location", key: "locationAddress", icon: <FaMapMarkerAlt /> },
    {
      label: "Operating Hours",
      key: "openingHours",
      icon: <FaClock />,
      render: (val) => val || "Contact for hours",
    },
    {
      label: "Contact",
      key: "phone",
      icon: <FaPhone />,
      render: (val) => val || "N/A",
    },
    {
      label: "Verified",
      key: "isVerified",
      render: (val) =>
        val ? (
          <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs">
            <FaCheckCircle /> Verified
          </div>
        ) : (
          "Standard"
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg pt-32 pb-24 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-150 h-150 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-150 h-150 bg-secondary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container relative px-6 mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">
              Business <span className="text-primary">Comparison</span>
            </h1>
            <p className="text-text-dim">
              Comparing {businesses.length} businesses side by side
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {businesses.map((business, idx) => (
            <div
              key={business._id}
              className="relative group bg-[#1a2133] border border-white/5 rounded-4xl overflow-hidden flex flex-col transition-all duration-500 hover:border-primary/30"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-secondary opacity-50" />

              <div className="p-8 pb-4">
                <div className="w-20 h-20 bg-dark-bg rounded-2xl border border-white/10 flex items-center justify-center text-4xl mb-6 shadow-inner overflow-hidden group-hover:border-primary/50 transition-colors">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      className="w-full h-full object-cover"
                      alt={business.businessName}
                    />
                  ) : (
                    "🏢"
                  )}
                </div>
                <h3 className="text-white text-2xl font-black mb-2 tracking-tight line-clamp-1">
                  {business.businessName}
                </h3>
                <Link
                  to={`/business/${business._id}`}
                  className="text-primary text-xs font-black uppercase tracking-[0.2em] hover:brightness-125 transition-all"
                >
                  View Profile →
                </Link>
              </div>

              <div className="px-8 py-6 space-y-6">
                {comparisonFields.map((field) => (
                  <div key={field.label} className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
                      {field.label}
                    </span>
                    <div className="text-white text-sm font-semibold flex items-center gap-2">
                      {field.icon && (
                        <span className="text-primary/70">{field.icon}</span>
                      )}
                      {field.render
                        ? field.render(business[field.key])
                        : business[field.key] || "Not listed"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 pt-4 mt-auto border-t border-white/5">
                <p className="text-text-dim text-xs leading-relaxed italic line-clamp-3">
                  "
                  {business.description ||
                    "A verified local provider specializing in professional services."}
                  "
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            to="/explore"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1"
          >
            ← Add more businesses
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareBusinesses;
