import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";
import Layout from "./Layout"; // Import the Layout component
import DailyPrediction from "../src/pages/DailyPrediction"

// Import all your pages
import Dashboard from "../src/pages/Dashboard";
import Products from "../src/pages/Products";
import Login from "../src/pages/Login";
import Signup from "../src/pages/Signup";
import Cart from "../src/pages/Cart";
import AboutUs from "../src/pages/AboutUs";
import ContactUs from "../src/pages/ContactUs";
import Private from "../src/pages/Private";
import Tmc from "../src/pages/Tmc";
import Partners from "../src/pages/Partners";
import NotFound from "../src/pages/NotFound";
import Otp from "../src/pages/Otp";
import ForgotPassword from "../src/pages/ForgotPassword";
import ResetPassword from "../src/pages/ResetPassword";
import AdminLayout from "../src/admin/routes/AdminLayout";
import AdminHome from "../src/admin/pages/Home";
import DashboardAdmin from "../src/admin/pages/DashboardAdmin";
import AddProduct from "../src/admin/pages/AddProduct";
import ManageProducts from "../src/admin/pages/ManageProducts";
import MyOrders from "../src/pages/MyOrders";
import AdminOrders from "../src/admin/pages/AdminOrders";
import Checkout from "../src/payment/Checkout";
import OrderConfirmation from "../src/pages/OrderConfirmation";
import SingleOrderDetails from "../src/pages/SingleOrderDetails";
import Wishlist from "../src/pages/Wishlist";
import DailyBlog from "../src/pages/blogs/DailyBlog";
import AstrologyAndYou from "../src/pages/blogs/AstrologyAndYou";
import PowerOfMeditation from "../src/pages/blogs/PowerOfMeditation";
import SacredYantras from "../src/pages/blogs/SacredYantras";
import PlanetaryInfluence from "../src/pages/blogs/PlanetaryInfluence";
import SingleProduct from "../src/pages/SingleProuduct";
import ReviewPage from "../src/pages/ReviewPage";
import AstrologerSignup from "../src/astrologer/AstrologerSigup";
import AstrologerDashboard from "../src/astrologer/AstrologerDashboard";
import ChatBox from "../src/chatContext/ChatBot";
import AstrologerList from "../src/pages/AstrologerList";
import AstrologerChatRequests from "../src/astrologer/AstrologerChatRequests";
import AstrologerProfile from "../src/astrologer/AstrologerProfile";
import AdminVerifyAstrologers from "../src/admin/pages/AdminVerifyAstrologers";
import ChatRequestTimer from "../src/pages/ChatRequestTimer";
import KundliForm from "../src/astrology/KundliForm"
import KundliResult from "../src/astrology/KundliResult";
import MatchingForm from "../src/astrology/MatchingForm";
import MatchingCompatiblityResult from "../src/astrology/MatchingCompatiblityResult";
import PanchangForm from "@/astrology/PanchangForm";
import PanchangResult from "@/astrology/PanchangResult";
import LifePathNumber from '../src/astrology/LifePathNumber';
import CancellationRefundPolicy from "@/pages/CancellationRefundPolicy";
import ShippingDeliveryPolicy from "@/pages/ShippingDeliveryPolicy";

const AppRoutes = () => {
  return (
    <Layout> {/* Wrap all routes in the Layout component */}
      <Routes>
        {/* ✅ Public Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/astrologer-signup" element={< AstrologerSignup />} />
        <Route path="/forgot-my-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/tmc" element={<Tmc />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/daily-prediction" element={<DailyPrediction />} />
        <Route path="/life-path-number" element={<LifePathNumber />} />
        <Route path="/cancellation-policy" element={<CancellationRefundPolicy />} />
<Route path="/shipping-policy" element={<ShippingDeliveryPolicy />} />





        {/* ✅ Blog Pages */}
        <Route path="/blogs-astrology-and-you" element={<AstrologyAndYou />} />
        <Route path="/blogs-daily" element={<DailyBlog />} />
        <Route path="/blogs-power-of-meditation" element={<PowerOfMeditation />} />
        <Route path="/blogs-sacred-yantras" element={<SacredYantras />} />
        <Route path="/blogs-planetary-influence" element={<PlanetaryInfluence />} />
        <Route path="/products" element={<Products />} />
        <Route path="/single-product/:id" element={<SingleProduct />} />


        {/* ✅ 404 Not Found Page */}
        <Route path="*" element={<NotFound />} />

        {/* ✅ Private Info Page */}
        <Route path="/private-info" element={<Private />} />

        {/* ✅ Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/astrologer-dashboard" element={<AstrologerDashboard />} />
          <Route path="/astrologer-profile" element={<AstrologerProfile />} />
          <Route path="/chat-waiting/:sessionId" element={<ChatRequestTimer />} />
          <Route path="/astrologer-chat-request" element={<AstrologerChatRequests />} />
          <Route path="/astro-user-chat/:sessionId" element={<ChatBox />} />
          <Route path="/astro-list" element={<AstrologerList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:id" element={<SingleOrderDetails />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/product/:productId/reviews" element={<ReviewPage />} />
          <Route path="/kundli-details" element={<KundliForm />} />
          <Route path="/kundli-result" element={<KundliResult />} />
          <Route path="/matching-form" element={<MatchingForm />} />
          <Route path="/matching-kundli-result" element={<MatchingCompatiblityResult />} />
          <Route path="/panchang-form" element={<PanchangForm />} />
          <Route path="/panchang-result" element={<PanchangResult />} />
        </Route>

        {/* ✅ Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="dashboard" element={<DashboardAdmin />} />
            <Route path="verify-astrologers" element={<AdminVerifyAstrologers />} />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="manage-products" element={<ManageProducts />} />
            <Route path="orders" element={<AdminOrders />} />

          </Route>
        </Route>
      </Routes>
    </Layout>
  );
};

export default AppRoutes;