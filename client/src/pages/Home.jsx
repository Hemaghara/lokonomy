import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "../data/categories";

const Home = () => {
  const navigate = useNavigate();
  const displayedCategories = categories.slice(0, 6);
  return (
    <div className="min-h-screen bg-dark-bg">
      <main className="container pt-32 pb-24">
        <section className="mb-20 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-white">
                Local Economy, <br />
                <span className="text-primary">Simplified.</span>
              </h1>
              <p className="text-text-dim text-lg max-w-xl">
                The easiest way to discover services, trade goods, and stay
                updated with your local community.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link to="/explore" className="btn-primary">
                  Explore Services
                </Link>
                <Link
                  to="/market"
                  className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-lg font-semibold transition-all"
                >
                  Marketplace
                </Link>
                <Link
                  to="/feed"
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-6 py-2.5 rounded-lg font-semibold transition-all"
                >
                  Community Feed
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-white">Categories</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            <AnimatePresence>
              {displayedCategories.map((cat) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/category/${cat.name}`)}
                  className="bg-card-bg border border-border p-8 rounded-xl text-center cursor-pointer hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-4"
                >
                  <div className="text-4xl">{cat.icon}</div>
                  <span className="font-semibold text-sm text-text-main">
                    {cat.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              to="/explore/all"
              className="bg-white/5 hover:bg-primary hover:text-white text-text-main px-10 py-4 rounded-xl font-bold transition-all border border-white/10 hover:border-primary shadow-xl flex items-center gap-3 group"
            >
              Explore All Services
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
