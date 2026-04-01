import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { LocationProvider } from "./context/LocationContext";
import { UserProvider } from "./context/UserContext";
import { ComparisonProvider } from "./context/ComparisonContext";
import ComparisonDock from "./components/ComparisonDock";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

// Code Splitting - Lazy Loading Pages for Performance Boost
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AddBusiness = lazy(() => import("./pages/AddBusiness"));
const EditBusiness = lazy(() => import("./pages/EditBusiness"));
const Profile = lazy(() => import("./pages/Profile"));
const Services = lazy(() => import("./pages/Services"));
const ExploreServices = lazy(() => import("./pages/ExploreServices"));
const AllServices = lazy(() => import("./pages/AllServices"));
const SubCategories = lazy(() => import("./pages/SubCategories"));
const Market = lazy(() => import("./pages/Market"));
const SellProduct = lazy(() => import("./pages/SellProduct"));
const BusinessDetails = lazy(() => import("./pages/BusinessDetails"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetails = lazy(() => import("./pages/JobDetails"));
const ApplyJob = lazy(() => import("./pages/ApplyJob"));
const PostJob = lazy(() => import("./pages/PostJob"));
const Stories = lazy(() => import("./pages/Stories"));
const PostStory = lazy(() => import("./pages/PostStory"));
const StoryDetails = lazy(() => import("./pages/StoryDetails"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const Feed = lazy(() => import("./pages/Feed"));
const PostFeed = lazy(() => import("./pages/PostFeed"));
const FeedDetails = lazy(() => import("./pages/FeedDetails"));
const JobDashboard = lazy(() => import("./pages/JobDashboard"));
const EditJob = lazy(() => import("./pages/EditJob"));
const MyChats = lazy(() => import("./pages/MyChats"));
const UpgradePlan = lazy(() => import("./pages/UpgradePlan"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Rewards = lazy(() => import("./pages/Rewards"));
const EventsMap = lazy(() => import("./pages/EventsMap"));
const CompareBusinesses = lazy(() => import("./pages/CompareBusinesses"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/admin/AdminRegister"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminUserDetails = lazy(() => import("./pages/admin/AdminUserDetails"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const ProtectedRouteAdmin = lazy(() => import("./components/ProtectedRouteAdmin"));

function App() {
  useEffect(() => {
    const wakeupURL = import.meta.env.MODE === "development" 
      ? "http://localhost:5000/" 
      : "https://lokonomy.onrender.com/";
    fetch(wakeupURL)
      .then(() => console.log("Backend awake"))
      .catch(() => console.log("Backend not awake"));
  }, []);
  return (
    <LocationProvider>
      <UserProvider>
        <ComparisonProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1e1e2e",
                color: "#fff",
                border: "1px solid #313244",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          <Router>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-300">Loading Lokonomy...</div>}>
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="/" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                <Route element={<ProtectedRouteAdmin />}>
                   <Route path="/admin/dashboard" element={<AdminDashboard />} />
                   <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/user/:id" element={<AdminUserDetails />} />
                    <Route path="/admin/businesses" element={<AdminBusinesses />} />
                    <Route path="/admin/profile" element={<AdminProfile />} />
                 </Route>
                
                <Route element={<MainLayout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/explore" element={<ExploreServices />} />
                  <Route path="/explore/all" element={<AllServices />} />
                  <Route
                    path="/category/:categoryName"
                    element={<SubCategories />}
                  />
                  <Route path="/market" element={<Market />} />
                  <Route path="/market/product/:id" element={<ProductDetails />} />
                  <Route
                    path="/services/:category/:subcategory"
                    element={<Services />}
                  />
                  <Route path="/business/:id" element={<BusinessDetails />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs/:id" element={<JobDetails />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="/stories/:id" element={<StoryDetails />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/feed/:id" element={<FeedDetails />} />
                  <Route path="/events-map" element={<EventsMap />} />
                  <Route path="/compare" element={<CompareBusinesses />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/job-dashboard" element={<JobDashboard />} />
                    <Route path="/edit-job/:id" element={<EditJob />} />
                    <Route path="/add-business" element={<AddBusiness />} />
                    <Route path="/edit-business/:id" element={<EditBusiness />} />
                    <Route path="/market/sell" element={<SellProduct />} />
                    <Route
                      path="/market/product/:id/checkout"
                      element={<Checkout />}
                    />
                    <Route path="/jobs/post" element={<PostJob />} />
                    <Route path="/jobs/:id/apply" element={<ApplyJob />} />
                    <Route path="/stories/post" element={<PostStory />} />
                    <Route path="/feed/post" element={<PostFeed />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/sales-management" element={<SellerOrders />} />
                    <Route path="/my-chats" element={<MyChats />} />
                    <Route path="/upgrade-plan" element={<UpgradePlan />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/rewards" element={<Rewards />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
            <ComparisonDock />
          </Router>
        </ComparisonProvider>
      </UserProvider>
    </LocationProvider>
  );
}

export default App;
