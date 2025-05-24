import { useState } from "react";
import axios from "axios";
import assets from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";

const initialValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  gender: "",
  dob: "",
  location: "",
  expertise: "",
  yearsOfExperience: "",
  bio: "",
  languagesSpoken: "",
  pricePerMinute: "",
};

const EXPERTISE_OPTIONS = [
  "Vedic",
  "Tarot",
  "Numerology",
  "Palmistry",
  "Horary",
  "KP",
  "Western",
  "Lal Kitab",
  "Other",
];

const AstrologerSignup = () => {
  const [form, setForm] = useState(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match", { position: "top-right" });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        languagesSpoken: form.languagesSpoken.split(",").map((lang) => lang.trim()),
        role: "astrologer",
      };

      await axios.post(
        `${import.meta.env.VITE_ASTRO_URL}/astrologer-signup`,
        payload
      );

      toast.success("Signup successful! Please verify your account.", { position: "top-right" });
      setForm(initialValues);
      setTimeout(()=> navigate("/login"),3000)
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Signup failed.", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-auto pb-20">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-md"
        style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
      ></div>

      <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-4 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img className="mx-auto h-50 w-auto" src={assets.SiddhivinayakAstroLogo} alt="Logo" />
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-yellow-500">
            Astrologer Registration
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-blue-100">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-blue-100">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-blue-100">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
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
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-100">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Astro Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-blue-100">
                  Gender
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-blue-100">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  id="dob"
                  value={form.dob}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-blue-100">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  placeholder="Location"
                  value={form.location}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="expertise" className="block text-sm font-medium text-blue-100">
                  Expertise
                </label>
                <select
                  name="expertise"
                  id="expertise"
                  value={form.expertise}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                >
                  <option value="">Select Expertise</option>
                  {EXPERTISE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-blue-100">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  id="yearsOfExperience"
                  placeholder="Years of Experience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="languagesSpoken" className="block text-sm font-medium text-blue-100">
                  Languages Spoken (comma separated)
                </label>
                <input
                  type="text"
                  name="languagesSpoken"
                  id="languagesSpoken"
                  placeholder="English, Hindi, etc."
                  value={form.languagesSpoken}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="pricePerMinute" className="block text-sm font-medium text-blue-100">
                  Price Per Minute
                </label>
                <input
                  type="number"
                  name="pricePerMinute"
                  id="pricePerMinute"
                  placeholder="Price Per Minute"
                  value={form.pricePerMinute}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-blue-100">
                Bio
              </label>
              <textarea
                name="bio"
                id="bio"
                placeholder="Tell us about yourself and your expertise"
                value={form.bio}
                onChange={handleChange}
                rows="3"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="flex w-full justify-center items-center rounded-md bg-gray-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                disabled={loading}
              >
                {loading ? <ClipLoader size={20} color="#fff" /> : "Register as Astrologer"}
              </button>
            </div>
          </form>

          <Link 
            to="/sign-up" 
            className="block font-semibold text-blue-100 hover:text-yellow-500 text-center mt-4"
          >
            Want to register as a user instead? Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AstrologerSignup;
