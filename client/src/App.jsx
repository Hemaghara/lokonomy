import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { LocationProvider } from "./context/LocationContext";
import { UserProvider } from "./context/UserContext";
import { ComparisonProvider } from "./context/ComparisonContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import ComparisonDock from "./components/ComparisonDock";
import ConfirmModal from "./components/admin/ConfirmModal";
import AIGuide from "./components/AIGuide";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

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
const UserSupport = lazy(() => import("./pages/UserSupport"));
const BusinessVerification = lazy(() => import("./pages/BusinessVerification"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/admin/AdminRegister"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminUserDetails = lazy(() => import("./pages/admin/AdminUserDetails"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminMarketplace = lazy(() => import("./pages/admin/AdminMarketplace"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetails = lazy(() => import("./pages/admin/AdminOrderDetails"));
const AdminProductDetails = lazy(
  () => import("./pages/admin/AdminProductDetails"),
);
const AdminBusinessDetails = lazy(
  () => import("./pages/admin/AdminBusinessDetails"),
);
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs"));
const AdminJobDetails = lazy(() => import("./pages/admin/AdminJobDetails"));
const AdminStoriesFeed = lazy(() => import("./pages/admin/AdminStoriesFeed"));
const AdminStoryDetails = lazy(() => import("./pages/admin/AdminStoryDetails"));
const AdminFeedDetails = lazy(() => import("./pages/admin/AdminFeedDetails"));
const AdminSubscriptions = lazy(
  () => import("./pages/admin/AdminSubscriptions"),
);
const AdminPushNotifications = lazy(
  () => import("./pages/admin/AdminPushNotifications"),
);
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminReviewAnalytics = lazy(
  () => import("./pages/admin/AdminReviewAnalytics"),
);
const AdminRewards = lazy(() => import("./pages/admin/AdminRewards"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminAuctionDetails = lazy(
  () => import("./pages/admin/AdminAuctionDetails"),
);
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminBusinessVerification = lazy(
  () => import("./pages/admin/AdminBusinessVerification"),
);
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminQA = lazy(() => import("./pages/admin/AdminQA"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
const AdminChats = lazy(() => import("./pages/admin/AdminChats"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSubAdmins = lazy(() => import("./pages/admin/AdminSubAdmins"));
const CreateSubAdmin = lazy(() => import("./pages/admin/CreateSubAdmin"));
const AdminHealthMonitor = lazy(
  () => import("./pages/admin/AdminHealthMonitor"),
);
const AdminAlertCenter = lazy(() => import("./pages/admin/AdminAlertCenter"));
const AdminFraudDetection = lazy(
  () => import("./pages/admin/AdminFraudDetection"),
);
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns"));
const AdminActivityHeatmap = lazy(
  () => import("./pages/admin/AdminActivityHeatmap"),
);
const AdminChurnPredictor = lazy(
  () => import("./pages/admin/AdminChurnPredictor"),
);
const AdminApiKeyManagement = lazy(
  () => import("./pages/admin/AdminApiKeyManagement"),
);
const AdminContentSchedule = lazy(
  () => import("./pages/admin/AdminContentSchedule"),
);
const ProtectedRouteAdmin = lazy(
  () => import("./components/ProtectedRouteAdmin"),
);
const AdminGuard = lazy(() => import("./components/admin/AdminGuard"));
const AdminErrorBoundary = lazy(
  () => import("./components/admin/AdminErrorBoundary"),
);
const AppliedJobs = lazy(() => import("./pages/AppliedJobs"));

function App() {
  useEffect(() => {
    const wakeupURL =
      import.meta.env.MODE === "development"
        ? "http://localhost:5000/"
        : "https://lokonomy.onrender.com/";
    fetch(wakeupURL)
      .then(() => console.log("Backend awake"))
      .catch(() => console.log("Backend not awake"));
  }, []);
  return (
    <LocationProvider>
      <ConfirmProvider>
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
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-300">
                    Loading Lokonomy...
                  </div>
                }
              >
                <Routes>
                  <Route element={<AuthLayout />}>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                  </Route>

                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/register" element={<AdminRegister />} />
                  <Route
                    element={
                      <AdminErrorBoundary>
                        <ProtectedRouteAdmin />
                      </AdminErrorBoundary>
                    }
                  >
                    <Route
                      path="/admin/dashboard"
                      element={<AdminDashboard />}
                    />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route
                      path="/admin/user/:id"
                      element={<AdminUserDetails />}
                    />
                    <Route
                      path="/admin/businesses"
                      element={<AdminBusinesses />}
                    />
                    <Route
                      path="/admin/business/:id"
                      element={<AdminBusinessDetails />}
                    />
                    <Route
                      path="/admin/marketplace"
                      element={<AdminMarketplace />}
                    />
                    <Route
                      path="/admin/marketplace/orders"
                      element={<AdminOrders />}
                    />
                    <Route
                      path="/admin/marketplace/product/:id"
                      element={<AdminProductDetails />}
                    />
                    <Route
                      path="/admin/marketplace/order/:id"
                      element={<AdminOrderDetails />}
                    />
                    <Route
                      path="/admin/marketplace/auction/:id"
                      element={<AdminAuctionDetails />}
                    />
                    <Route path="/admin/coupons" element={<AdminCoupons />} />
                    <Route path="/admin/support" element={<AdminSupport />} />
                    <Route path="/admin/bookings" element={<AdminBookings />} />
                    <Route
                      path="/admin/verification"
                      element={<AdminBusinessVerification />}
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <AdminGuard permission="canManageSettings">
                          <AdminSettings />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin/audit-logs"
                      element={<AdminAuditLogs />}
                    />
                    <Route path="/admin/qa" element={<AdminQA />} />
                    <Route
                      path="/admin/moderation"
                      element={<AdminModeration />}
                    />
                    <Route path="/admin/chats" element={<AdminChats />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/jobs" element={<AdminJobs />} />
                    <Route
                      path="/admin/jobs/:id"
                      element={<AdminJobDetails />}
                    />
                    <Route
                      path="/admin/stories-feed"
                      element={<AdminStoriesFeed />}
                    />
                    <Route
                      path="/admin/stories-feed/story/:id"
                      element={<AdminStoryDetails />}
                    />
                    <Route
                      path="/admin/stories-feed/feed/:id"
                      element={<AdminFeedDetails />}
                    />
                    <Route
                      path="/admin/subscriptions"
                      element={
                        <AdminGuard permission="canViewAnalytics">
                          <AdminSubscriptions />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin/notifications"
                      element={<AdminPushNotifications />}
                    />
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                    <Route
                      path="/admin/reviews/analytics/:businessId"
                      element={<AdminReviewAnalytics />}
                    />
                    <Route path="/admin/rewards" element={<AdminRewards />} />
                    <Route
                      path="/admin/referrals"
                      element={<AdminReferrals />}
                    />
                    <Route path="/admin/profile" element={<AdminProfile />} />

                    <Route
                      element={
                        <AdminErrorBoundary>
                          <ProtectedRouteAdmin requiredRole="superadmin" />
                        </AdminErrorBoundary>
                      }
                    >
                      <Route
                        path="/admin/analytics"
                        element={<AdminAnalytics />}
                      />
                      <Route
                        path="/admin/health"
                        element={<AdminHealthMonitor />}
                      />

                      <Route
                        path="/admin/sub-admins"
                        element={<AdminSubAdmins />}
                      />
                      <Route
                        path="/admin/sub-admins/create"
                        element={<CreateSubAdmin />}
                      />
                      <Route
                        path="/admin/sub-admins/edit/:id"
                        element={<CreateSubAdmin />}
                      />
                      <Route
                        path="/admin/alerts"
                        element={<AdminAlertCenter />}
                      />
                      <Route
                        path="/admin/fraud"
                        element={<AdminFraudDetection />}
                      />
                      <Route
                        path="/admin/campaigns"
                        element={<AdminCampaigns />}
                      />
                      <Route
                        path="/admin/heatmap"
                        element={<AdminActivityHeatmap />}
                      />
                      <Route
                        path="/admin/churn"
                        element={<AdminChurnPredictor />}
                      />
                      <Route
                        path="/admin/api-keys"
                        element={<AdminApiKeyManagement />}
                      />
                      <Route
                        path="/admin/content-schedule"
                        element={<AdminContentSchedule />}
                      />
                    </Route>
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
                    <Route
                      path="/market/product/:id"
                      element={<ProductDetails />}
                    />
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
                      <Route
                        path="/edit-business/:id"
                        element={<EditBusiness />}
                      />
                      <Route path="/market/sell" element={<SellProduct />} />
                      <Route
                        path="/market/product/:id/checkout"
                        element={<Checkout />}
                      />
                      <Route path="/jobs/post" element={<PostJob />} />
                      <Route path="/jobs/applied" element={<AppliedJobs />} />
                      <Route path="/jobs/:id/apply" element={<ApplyJob />} />
                      <Route path="/stories/post" element={<PostStory />} />
                      <Route path="/stories/edit/:storyId" element={<PostStory />} />
                      <Route path="/feed/post" element={<PostFeed />} />
                      <Route path="/feed/edit/:id" element={<PostFeed />} />
                      <Route path="/my-orders" element={<MyOrders />} />
                      <Route
                        path="/sales-management"
                        element={<SellerOrders />}
                      />
                      <Route path="/my-chats" element={<MyChats />} />
                      <Route path="/upgrade-plan" element={<UpgradePlan />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/rewards" element={<Rewards />} />
                      <Route path="/support" element={<UserSupport />} />
                      <Route
                        path="/business/verification"
                        element={<BusinessVerification />}
                      />
                      <Route
                        path="/notifications"
                        element={<Notifications />}
                      />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
              <ComparisonDock />
              <AIGuide />
              <ConfirmModal />
            </Router>
          </ComparisonProvider>
        </UserProvider>
      </ConfirmProvider>
    </LocationProvider>
  );
}

export default App;
