import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { Eye, EyeOff } from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";
import Select from "react-select";
import { Country, State, City } from "country-state-city";

const Signup = () => {
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
    country: "",
    state: "",
    city: "",
    password: "",
  });

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/signup`, formData);
      console.log(formData);
      

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
      console.error("Error during signup:", error.response?.data || error.message);

      if (error.response?.status === 409) {
        toast.error("User already exists! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(error.response?.data?.message || "Signup failed!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate dropdown options
  const countryOptions = Country.getAllCountries().map((c) => ({
    label: c.name,
    value: c.isoCode,
  }));

  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map((s) => ({
        label: s.name,
        value: s.isoCode,
      }))
    : [];

  const cityOptions = selectedState
    ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map((c) => ({
        label: c.name,
        value: c.name,
      }))
    : [];

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
            Create Your Account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-blue-100">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First Name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
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
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last Name"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-blue-100">
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:outline-yellow-600 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-blue-100">
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
            </div>

            {/* Location Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-100">Country</label>
                <Select
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={(val) => {
                    setSelectedCountry(val);
                    setSelectedState(null);
                    setSelectedCity(null);
                    setFormData({ ...formData, country: val.label, state: "", city: "" });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100">State</label>
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
                <label className="block text-sm font-medium text-blue-100">City</label>
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
            </div>

            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-blue-100">
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
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-100">
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
                  placeholder="Password"
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
              <a href="/login" className="font-semibold text-yellow-400 hover:text-yellow-500">
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
