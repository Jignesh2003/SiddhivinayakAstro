import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { jwtDecode } from "jwt-decode";

const OAuthSuccess = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    useEffect(() => {
        const token = new URLSearchParams(search).get("token");
        console.log("TOken from params:", token);

        if (token) {
            const decoded = jwtDecode(token);
            console.log("decoded:", decoded);


            // call Zustand store login → automatically persisted
            login(
                token,
                decoded.role,          // extract from JWT
                decoded.isVerified,    // extract from JWT if present
                decoded.id,            // userId
                decoded.hasUsedFreeTrial || false
            );

            // redirect user depending on terms & role
            if (!decoded.agreedToTerms) {
                navigate("/accept-terms");
            } else if (decoded.role === "admin") {
                navigate("/admin-dashboard");
            } else {
                navigate("/user-dashboard");
            }
        } else {
            navigate("/login");
        }
    }, [search, login, navigate]);

    return <p>Logging in...</p>
};

export default OAuthSuccess;
