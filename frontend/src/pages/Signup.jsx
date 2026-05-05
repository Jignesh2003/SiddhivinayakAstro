import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { Eye, EyeOff, Check } from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";
// import Select from "react-select";
// import { Country, State, City } from "country-state-city";
// import { FaGoogle } from "react-icons/fa";

const Signup = () => {
  const { login } = useAuthStore();
  const [role, setRole] = useState("user"); // "user" or "astrologer"
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "", // Will be empty
    phone: "",
    email: "",
    // address: "",
    // pincode: "",
    // country: "",
    // state: "",
    // city: "",
    password: "",
    confirmPassword: "", // ✅ Added
    agreedToTerms: false,
    // Astrologer-specific fields
    expertise: "",
    yearsOfExperience: "",
    bio: "",
    languagesSpoken: "",
    pricePerMinute: "",
    gender: "",
    dob: "",
    location: "",
  });

  // const [selectedCountry, setSelectedCountry] = useState(null);
  // const [selectedState, setSelectedState] = useState(null);
  // const [selectedCity, setSelectedCity] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ Added
  const navigate = useNavigate();

  // ✅ Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    hasUppercase: false,
    hasNumber: false,
    hasMinLength: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });

    // ✅ Validate password when password field changes
    if (name === "password") {
      validatePassword(value);
    }
  };

  // ✅ Password validation function
  const validatePassword = (password) => {
    setPasswordValidation({
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!formData.agreedToTerms) {
      toast.error("Please agree to the Terms & Policies before signing up.");
      return;
    }

    setIsLoading(true);

    try {
      let endpoint = `${import.meta.env.VITE_BASE_URL}/signup`;
      let payload = {
        firstName: formData.firstName,
        lastName: formData.lastName, // Empty string
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        agreedToTerms: formData.agreedToTerms,
        role: role,
      };

      if (role === "astrologer") {
        endpoint = `${import.meta.env.VITE_ASTRO_URL}/astrologer-signup`;
        payload = {
          ...payload,
          expertise: formData.expertise,
          yearsOfExperience: formData.yearsOfExperience,
          bio: formData.bio,
          languagesSpoken: formData.languagesSpoken.split(",").map((l) => l.trim()).filter(Boolean),
          pricePerMinute: formData.pricePerMinute,
          gender: formData.gender,
          dob: formData.dob,
          location: formData.location,
        };
      }

      const response = await axios.post(endpoint, payload);
      if (response.status === 201) {
        toast.success("Account created! Logging you in...", { duration: 3000 });
        if (response.data.token) {
          login(response.data.user, response.data.token);
          toast.success("Login successful! 🎉", { duration: 3000 });
          navigate("/");
        } else {
          navigate("/login");
        }
      }
    } catch (error) {
      console.error(
        "Error during signup:",
        error.response?.data || error.message
      );

      if (error.response?.status === 409 || error.response?.status === 400) {
        toast.error(error.response?.data?.message || "User already exists!");
        if (error.response?.status === 409) {
          setTimeout(() => navigate("/login"), 2000);
        }
      } else {
        toast.error(error.response?.data?.errors || error.response?.data?.message || "Signup failed!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate dropdown options - COMMENTED OUT
  // const countryOptions = Country.getAllCountries().map((c) => ({
  //   label: c.name,
  //   value: c.isoCode,
  // }));

  // const stateOptions = selectedCountry
  //   ? State.getStatesOfCountry(selectedCountry.value).map((s) => ({
  //       label: s.name,
  //       value: s.isoCode,
  //     }))
  //   : [];

  // const cityOptions = selectedState
  //   ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map(
  //       (c) => ({
  //         label: c.name,
  //         value: c.name,
  //       })
  //     )
  //   : [];

  // Google OAuth login - COMMENTED OUT
  // const googleLoginHandler = async () => {
  //   try {
  //     window.location.href = `${import.meta.env.VITE_BASE_URL}/google`;
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Failed to initiate Google login!");
  //   }
  // };

  return (
    <div className="relative min-h-screen w-full overflow-auto pb-20">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-md"
        style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
      ></div>

      <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 py-4 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-50 w-auto"
            src={assets.SiddhivinayakAstroLogo}
            alt="Logo"
          />
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-yellow-500">
            Create Your Account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* ✅ ADDED: Role Toggle */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  role === "user"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              >
                Sign up as User
              </button>
              <button
                type="button"
                onClick={() => setRole("astrologer")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  role === "astrologer"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              >
                Sign up as Astrologer
              </button>
            </div>

            {/* ✅ MODIFIED: Single name field */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-blue-100"
              >
                 Name
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter your  name"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-blue-100"
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                pattern="[0-9]{10}"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Phone Number"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-blue-100"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-blue-100"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* ✅ Password Validation Indicators */}
              {formData.password && (
                <div className="mt-3 space-y-2 p-3 bg-gray-800 rounded-md border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                        passwordValidation.hasMinLength
                          ? "bg-green-500 scale-100 animate-pop"
                          : "bg-gray-600"
                      }`}
                    >
                      {passwordValidation.hasMinLength && (
                        <Check size={16} className="text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-300">
                      Minimum 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                        passwordValidation.hasUppercase
                          ? "bg-green-500 scale-100 animate-pop"
                          : "bg-gray-600"
                      }`}
                    >
                      {passwordValidation.hasUppercase && (
                        <Check size={16} className="text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-300">
                      At least 1 uppercase letter (A-Z)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                        passwordValidation.hasNumber
                          ? "bg-green-500 scale-100 animate-pop"
                          : "bg-gray-600"
                      }`}
                    >
                      {passwordValidation.hasNumber && (
                        <Check size={16} className="text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-300">
                      At least 1 number (0-9)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-blue-100"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* ✅ ADDED: Astrologer-specific fields (conditional) */}
            {role === "astrologer" && (
              <>
                <div className="border-t border-gray-600 pt-4 mt-4">
                  <p className="text-yellow-400 text-sm font-semibold mb-4">Professional Details</p>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-blue-100">
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-blue-100">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    id="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  />
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-blue-100">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City/Location"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  />
                </div>

                {/* Expertise */}
                <div>
                  <label htmlFor="expertise" className="block text-sm font-medium text-blue-100">
                    Expertise
                  </label>
                  <select
                    name="expertise"
                    id="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  >
                    <option value="">Select Expertise</option>
                    <option value="Vedic">Vedic</option>
                    <option value="Tarot">Tarot</option>
                    <option value="Numerology">Numerology</option>
                    <option value="Palmistry">Palmistry</option>
                    <option value="Horary">Horary</option>
                    <option value="KP">KP</option>
                    <option value="Western">Western</option>
                    <option value="Lal Kitab">Lal Kitab</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Years of Experience */}
                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-blue-100">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    id="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-blue-100">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Brief description about you and your expertise"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  />
                </div>

                {/* Languages */}
                <div>
                  <label htmlFor="languagesSpoken" className="block text-sm font-medium text-blue-100">
                    Languages (comma separated)
                  </label>
                  <input
                    type="text"
                    name="languagesSpoken"
                    id="languagesSpoken"
                    value={formData.languagesSpoken}
                    onChange={handleChange}
                    placeholder="e.g., English, Hindi, Sanskrit"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  />
                </div>

                {/* Price per Minute */}
                <div>
                  <label htmlFor="pricePerMinute" className="block text-sm font-medium text-blue-100">
                    Price per Minute (₹)
                  </label>
                  <input
                    type="number"
                    name="pricePerMinute"
                    id="pricePerMinute"
                    value={formData.pricePerMinute}
                    onChange={handleChange}
                    placeholder="e.g., 50"
                    step="0.01"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                  />
                </div>
              </>
            )}

            {/* Terms Checkbox */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="agreedToTerms"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                required
                className="h-4 w-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label
                htmlFor="agreedToTerms"
                className="text-yellow-500 text-sm select-none"
              >
                I agree to the{" "}
                <Link to="/terms" className="underline">
                  Terms & Conditions
                </Link>
                ,{" "}
                <Link to="/privacy" className="underline">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link to="/refund" className="underline">
                  Cancellation & Refund Policy
                </Link>
                .
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="flex w-full justify-center items-center rounded-md bg-gray-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                disabled={isLoading}
              >
                {isLoading ? <ClipLoader size={20} color="#fff" /> : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-blue-100">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-yellow-400 hover:text-yellow-500"
              >
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
