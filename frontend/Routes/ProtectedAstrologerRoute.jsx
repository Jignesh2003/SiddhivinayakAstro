import { Navigate, Outlet } from "react-router-dom";
import useAstrologerStore from "../src/store/useAstrologerStore";

const ProtectedAstrologerRoute = () => {
  const { isAuthenticated } = useAstrologerStore();

  // ✅ Handle loading state while auth status is being determined
  if (isAuthenticated === null) return null;

  // ✅ Redirect unauthenticated astrologers to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Allow access to the protected astrologer route
  return <Outlet />;
};

export default ProtectedAstrologerRoute;
