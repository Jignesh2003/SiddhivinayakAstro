import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";
import Layout from "./Layout"; // Import the Layout component
import DailyPrediction from "../src/pages/DailyPrediction";
import Invoice from "../src/admin/pages/Invoice";

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
import SingleProduct from "../src/pages/SingleProuduct";
import ReviewPage from "../src/pages/ReviewPage";
import AstrologerSignup from "../src/astrologer/AstrologerSigup";
import FreeMatchForm from "../src/astrology/FreeMatchForm";
import AstrologerDashboard from "../src/astrologer/AstrologerDashboard";
import ChatBox from "../src/chatContext/ChatBot";
import AstrologerList from "../src/pages/AstrologerList";
import AstrologerChatRequests from "../src/astrologer/AstrologerChatRequests";
import AstrologerProfile from "../src/astrologer/AstrologerProfile";
import AdminVerifyAstrologers from "../src/admin/pages/AdminVerifyAstrologers";
import ChatRequestTimer from "../src/pages/ChatRequestTimer";
import KundliForm from "../src/astrology/KundliForm";
import KundliResult from "../src/astrology/KundliResult";
import MatchingForm from "../src/astrology/MatchingForm";
import MatchingCompatiblityResult from "../src/astrology/MatchingCompatiblityResult";
import PanchangForm from "@/astrology/PanchangForm";
import PanchangResult from "@/astrology/PanchangResult";
import LifePathNumber from "../src/astrology/LifePathNumber";
import CancellationRefundPolicy from "@/pages/CancellationRefundPolicy";
import ShippingDeliveryPolicy from "@/pages/ShippingDeliveryPolicy";
import CodOrderConfirmation from "../src/pages/CodOrderConfirmation";
import Wallet from "@/payment/wallet/Wallet";
import AdminWithdrawalRequests from "../src/admin/pages/AdminWithdrawalRequests";
import  HowToWear  from "@/pages/HowToWear";
import AdminBlogManager from "@/admin/pages/AdminBlogManager";
import BlogList from "@/pages/blogs/BlogList";
import BlogDetail from "@/pages/blogs/BlogDetails";
import DailyPredictionBySign from "@/pages/dailyPrediction/DailyPredictionBySign";
import AdminCreateCoupon from "@/admin/pages/AdminCreateCoupon";
import OAuthSuccess from "@/pages/OAuthSuccess";
import AcceptTerms from "@/pages/AcceptTerms";

const AppRoutes = () => {
  return (
    <Layout>
      {" "}
      {/* Wrap all routes in the Layout component */}
      <Routes>
        {/* ✅ Public Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/astrologer-signup" element={<AstrologerSignup />} />
        <Route path="/forgot-my-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/tmc" element={<Tmc />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/daily-prediction" element={<DailyPrediction />} />
        <Route path="/life-path-number" element={<LifePathNumber />} />
        <Route path="/how-to-wear" element={<HowToWear />} />

        <Route
          path="/cancellation-policy"
          element={<CancellationRefundPolicy />}
        />
        <Route
          path="/daily-prediction/:sign"
          element={<DailyPredictionBySign />}
        />
        <Route path="/shipping-policy" element={<ShippingDeliveryPolicy />} />

        <Route path="/products" element={<Products />} />
        <Route path="/single-product/:id" element={<SingleProduct />} />
        <Route path="/blog-list" element={<BlogList />} />
        <Route path="/blog-details/:id" element={<BlogDetail />} />

        {/* ✅ 404 Not Found Page */}
        <Route path="*" element={<NotFound />} />

        {/* ✅ Private Info Page */}
        <Route path="/private-info" element={<Private />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/accept-terms" element={<AcceptTerms />} />


        {/* ✅ Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/astrologer-dashboard"
            element={<AstrologerDashboard />}
          />
          <Route path="/astrologer-profile" element={<AstrologerProfile />} />
          <Route
            path="/chat-waiting/:sessionId"
            element={<ChatRequestTimer />}
          />
          <Route
            path="/astrologer-chat-request"
            element={<AstrologerChatRequests />}
          />
          <Route path="/astro-user-chat/:sessionId" element={<ChatBox />} />
          <Route path="/astro-list" element={<AstrologerList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:id" element={<SingleOrderDetails />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/product/:productId/reviews" element={<ReviewPage />} />
          <Route path="/kundli-details" element={<KundliForm />} />
          <Route path="/kundli-result" element={<KundliResult />} />
          <Route path="/matching-form" element={<MatchingForm />} />
          <Route
            path="/matching-kundli-result"
            element={<MatchingCompatiblityResult />}
          />
          <Route path="/free-kundli-match" element={<FreeMatchForm />} />
          <Route path="/panchang-form" element={<PanchangForm />} />
          <Route path="/panchang-result" element={<PanchangResult />} />
          <Route path="/cod-confirmation" element={<CodOrderConfirmation />} />
          <Route path="/wallet" element={<Wallet />} />
        </Route>

        {/* ✅ Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="dashboard" element={<DashboardAdmin />} />
            <Route
              path="verify-astrologers"
              element={<AdminVerifyAstrologers />}
            />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="manage-products" element={<ManageProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="blog-manager" element={<AdminBlogManager />} />
            <Route path="create-coupon" element={<AdminCreateCoupon />} />



            <Route
              path="withdrawal-requests"
              element={<AdminWithdrawalRequests />}
            />
            <Route path="invoice/:orderId" element={<Invoice />} />
          </Route>
        </Route>
      </Routes>
    </Layout>
  );
};

export default AppRoutes;
