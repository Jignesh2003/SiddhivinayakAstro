import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import assets from "../assets/assets";

const OtpVerification = () => {
  const { userId, login, isVerified } = useAuthStore();
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false); // For submit button loading

  useEffect(() => {
    if (isVerified) {
      navigate("/products"); // Redirect if already verified
    }
  }, [isVerified, navigate]);

  const handleGetOtp = async () => {
    setIsLoading(true);
    const { token } = useAuthStore.getState();

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/otp-sent`,
        { userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOtpSent(true);
      toast.success("OTP sent successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    const { token } = useAuthStore.getState();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/verify-otp`,
        { userId, otp },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      login(token, response.data.role, true);
      toast.success("OTP verified successfully!");
      navigate("/products");
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg mt-36 text-center"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      <h2 className="text-2xl font-bold text-yellow-500">Verify OTP</h2>

      {!otpSent ? (
        <button
          onClick={handleGetOtp}
          disabled={isLoading}
          className="bg-yellow-500 text-white py-3 px-6 rounded-full w-full hover:bg-yellow-600 transition mt-4"
        >
          {isLoading ? "Sending..." : "Get OTP"}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="border p-2 w-full rounded text-center"
          />
          <button
            type="submit"
            disabled={verifying}
            className="bg-yellow-500 text-white py-3 w-full rounded hover:bg-yellow-600 transition"
          >
            {verifying ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}
    </div>
  );
};

export default OtpVerification;
