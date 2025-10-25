import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { Eye, EyeOff } from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";
// import Select from "react-select";
// import { Country, State, City } from "country-state-city";
// import { FaGoogle } from "react-icons/fa";

const Signup = () => {
  const { login } = useAuthStore();
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
  });

  // const [selectedCountry, setSelectedCountry] = useState(null);
  // const [selectedState, setSelectedState] = useState(null);
  // const [selectedCity, setSelectedCity] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ Added
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
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
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/signup`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName, // Empty string
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          agreedToTerms: formData.agreedToTerms,
        }
      );
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

      if (error.response?.status === 409) {
        toast.error("User already exists! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(error.response?.data?.errors || "Signup failed!");
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

            {/* COMMENTED OUT: Last Name */}
            {/* <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-blue-100"
              >
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last Name"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div> */}

            {/* COMMENTED OUT: Phone */}
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

            {/* Email - KEPT */}
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

            {/* COMMENTED OUT: Address */}
            {/* <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-blue-100"
              >
                Address
              </label>
              <textarea
                name="address"
                id="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Address"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div> */}

            {/* COMMENTED OUT: Location Dropdowns */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-100">
                  Country
                </label>
                <Select
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={(val) => {
                    setSelectedCountry(val);
                    setSelectedState(null);
                    setSelectedCity(null);
                    setFormData({
                      ...formData,
                      country: val.label,
                      state: "",
                      city: "",
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100">
                  State
                </label>
                <Select
                  options={stateOptions}
                  value={selectedState}
                  onChange={(val) => {
                    setSelectedState(val);
                    setSelectedCity(null);
                    setFormData({ ...formData, state: val.label, city: "" });
                  }}
                  isDisabled={!selectedCountry}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100">
                  City
                </label>
                <Select
                  options={cityOptions}
                  value={selectedCity}
                  onChange={(val) => {
                    setSelectedCity(val);
                    setFormData({ ...formData, city: val.label });
                  }}
                  isDisabled={!selectedState}
                />
              </div>
            </div> */}

            {/* COMMENTED OUT: Pincode */}
            {/* <div>
              <label
                htmlFor="pincode"
                className="block text-sm font-medium text-blue-100"
              >
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                id="pincode"
                pattern="[0-9]{6}"
                value={formData.pincode}
                onChange={handleChange}
                required
                placeholder="Pincode"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div> */}

            {/* Password - KEPT */}
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
            </div>

            {/* ✅ ADDED: Confirm Password */}
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

            {/* Terms Checkbox - KEPT */}
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

            {/* Submit Button - KEPT */}
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

          {/* COMMENTED OUT: Divider */}
          {/* <div className="flex items-center my-5">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-2 text-gray-400">or</span>
            <hr className="flex-grow border-gray-300" />
          </div> */}

          {/* COMMENTED OUT: Google Login */}
          {/* <button
            onClick={googleLoginHandler}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-md hover:bg-gray-100 transition"
          >
            <FaGoogle size={20} />
            Sign-up with Google
          </button> */}

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
          <Link
            to="/astrologer-signup"
            className="block font-semibold text-blue-100 hover:text-yellow-300 text-center text-xl pt-5 text-yellow-500"
          >
            Signup as Astrologer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
