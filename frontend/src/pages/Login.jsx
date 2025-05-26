import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import assets from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import { toast } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader"; // Spinner

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/login`,
        formData
      );

      if (response.status === 200) {
        const { token, role, isVerified, userId } = response.data;
        if (!userId) {
          console.error("⚠️ Backend did not return userId!");
          return;
        }

      await  useAuthStore.getState().login(token, role, isVerified, userId);
        toast.success("Login successful!", { position: "top-right" });

        if (role === "admin") {
          navigate("/admin/dashboard");
        }else if(role === "astrologer"){
          navigate("/astrologer-dashboard");
        } else {
          navigate("/products");
        }
      }
    } catch (error) {
      console.error("Login error:", error.response ? error.response.data : error.message);
      toast.error("Invalid email or password!", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-auto pb-20">
      {/* 🔹 Blurred background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-md"
        style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
      ></div>

      {/* 🔸 Foreground content */}
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-4 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img className="mx-auto h-50 w-auto" src={assets.SiddhivinayakAstroLogo} alt="Logo" />
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-yellow-500">
            स्वागतम् शुभम् भवतु
            <br />
            Welcome! May it be auspicious
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                Email address
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                  Password
                </label>
                <Link to="/forgot-my-password" className="text-sm font-semibold text-blue-100 hover:text-yellow-500">
                  Forgot password?
                </Link>
              </div>

              <div className="mt-2 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="flex w-full justify-center items-center rounded-md bg-gray-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                disabled={loading}
              >
                {loading ? <ClipLoader size={20} color="#fff" /> : "Sign in"}
              </button>
            </div>
          </form>

          {/* Sign-up Links */}
          <Link to="/sign-up" className="block font-semibold text-blue-100 hover:text-yellow-500 text-center text-xl">
            Don&apos;t have an account? Sign up as User
          </Link>
          <Link
            to="/astrologer-signup"
            className="underline block font-semibold text-blue-100 hover:text-yellow-500 text-center text-xl text-yellow-500"
          >
            Signup as Astrologer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
