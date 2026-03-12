import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddBusiness from "./pages/AddBusiness";
import EditBusiness from "./pages/EditBusiness";
import Profile from "./pages/Profile";
import Services from "./pages/Services";
import ExploreServices from "./pages/ExploreServices";
import AllServices from "./pages/AllServices";
import SubCategories from "./pages/SubCategories";
import Market from "./pages/Market";
import SellProduct from "./pages/SellProduct";
import BusinessDetails from "./pages/BusinessDetails";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import ApplyJob from "./pages/ApplyJob";
import PostJob from "./pages/PostJob";
import Stories from "./pages/Stories";
import PostStory from "./pages/PostStory";
import StoryDetails from "./pages/StoryDetails";
import MyOrders from "./pages/MyOrders";
import SellerOrders from "./pages/SellerOrders";
import Feed from "./pages/Feed";
import PostFeed from "./pages/PostFeed";
import FeedDetails from "./pages/FeedDetails";
import JobDashboard from "./pages/JobDashboard";
import EditJob from "./pages/EditJob";
import MyChats from "./pages/MyChats";
import UpgradePlan from "./pages/UpgradePlan";
import Wishlist from "./pages/Wishlist";
import { LocationProvider } from "./context/LocationContext";
import { UserProvider } from "./context/UserContext";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <LocationProvider>
      <UserProvider>
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
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
              </Route>
            </Route>
          </Routes>
        </Router>
      </UserProvider>
    </LocationProvider>
  );
}

export default App;
