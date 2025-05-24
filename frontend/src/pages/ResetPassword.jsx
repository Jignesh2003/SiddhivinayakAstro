import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import assets from "../assets/assets";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false); // ✅ Loading state

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    // ✅ Basic password validation (customize as needed)
    if (formData.password.length < 8) {
      return toast.error("Password must be at least 8 characters long.");
    }

    setIsLoading(true); // ✅ Start loading state
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/reset-password/${token}`,
        { password: formData.password }
      );

      if (response.status === 200) {
        toast.success("Password reset successful! Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false); // ✅ Stop loading state
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-4 bg-white" style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold text-yellow-500">
          Reset Your Password
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* New Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-500">
              New Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full rounded-md bg-white px-3 py-2 text-gray-500 border border-gray-300 focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full rounded-md bg-white px-3 py-2 text-gray-500 border border-gray-300 focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-md text-white font-semibold py-2 ${isLoading ? "bg-gray-400" : "bg-yellow-500 hover:bg-yellow-600"}`}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
