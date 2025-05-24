import { useState } from "react";
import axios from "axios";
import assets from "../assets/assets";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        toast.error("❌ Please enter a valid email!");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/forgot-password`,
        { email: trimmedEmail }
      );

      toast.success("📩 Password reset link sent! Check your email.");
      setEmail(""); // Clear input field after success
    } catch (error) {
      console.error("Forgot Password Error:", error);
      toast.error(
        error.response?.data?.message ||
        "❌ Failed to send reset link. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen flex-col justify-center px-6 py-4 lg:px-8 bg-white overflow-auto pb-20"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          className="mx-auto h-50 w-auto"
          src={assets.SiddhivinayakAstroLogo}
          alt="Logo"
        />
        <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-yellow-500">
          Forgot Password
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-blue-100">
              Enter your registered email
            </label>
            <div className="mt-2">
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-500 hover:bg-yellow-500"}`}
            >
              {loading ? "⏳ Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>

        <Link to="/login" className="block mt-4 text-center font-semibold text-gray-500 hover:text-yellow-500">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
