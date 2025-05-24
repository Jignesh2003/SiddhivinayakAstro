import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../src/store/useAuthStore";

const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, role } = useAuthStore();

  // ✅ Handle loading state while auth status is being determined
  if (isAuthenticated === null) return null; 

  // ✅ Redirect unauthenticated users to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ If a role is required (like 'admin') and the user doesn't have it, redirect them
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={requiredRole === "admin" ? "/dashboard" : "/"} replace />;
  }

  // ✅ Allow access to the protected route
  return <Outlet />;
};

export default ProtectedRoute;
