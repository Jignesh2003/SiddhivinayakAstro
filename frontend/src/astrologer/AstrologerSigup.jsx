import { useState } from "react";
import axios from "axios";
import assets from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";
import Select from "react-select";
import { Country, State, City } from "country-state-city";

const initialValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  gender: "",
  dob: "",
  expertise: "",
  yearsOfExperience: "",
  bio: "",
  languagesSpoken: "",
  pricePerMinute: "",
};

const EXPERTISE_OPTIONS = [
  "Vedic", "Tarot", "Numerology", "Palmistry", "Horary",
  "KP", "Western", "Lal Kitab", "Other",
];

export default function AstrologerSignup() {
  const [form, setForm] = useState(initialValues);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputClass = 
    "block w-full rounded-md bg-white bg-opacity-30 px-3 py-2 text-gray-800 placeholder-gray-600 focus:bg-opacity-50 focus:outline-none";

  const countryOptions = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));
  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map(s => ({ label: s.name, value: s.isoCode }))
    : [];
  const cityOptions = selectedState
    ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map(c => ({ label: c.name, value: c.name }))
    : [];

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match", { position: "top-right" });
      return setLoading(false);
    }
    try {
      const payload = {
        ...form,
        country: selectedCountry?.label || "",
        state: selectedState?.label || "",
        city: selectedCity?.label || "",
        location: [selectedCity, selectedState, selectedCountry]
          .filter(Boolean).map(o => o.label).join(", "),
        languagesSpoken: form.languagesSpoken.split(",").map(l => l.trim()),
        role: "astrologer",
      };
      await axios.post(`${import.meta.env.VITE_ASTRO_URL}/astrologer-signup`, payload);
      console.log(payload);
      
      toast.success("Signup successful! Please verify your account.", { position: "top-right" });
      setForm(initialValues);
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedCity(null);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Signup failed.", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred full-screen background */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-lg"
        style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
      />
      {/* Gradient overlay to improve contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-900 opacity-10" />

      {/* Centered form container */}
      <div className="relative z-10 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <img
              src={assets.SiddhivinayakAstroLogo}
              alt="Logo"
              className="mx-auto h-20 w-auto"
            />
            <h1 className="mt-4 text-3xl font-bold text-yellow-300">
              Astrologer Registration
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="text-lg font-semibold text-yellow-200 mb-2">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-lg font-semibold text-yellow-200 mb-2">
                Security
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className={`${inputClass} pr-10`}
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center text-gray-600 cursor-pointer"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </div>
                </div>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`${inputClass} pr-10`}
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center text-gray-600 cursor-pointer"
                    onClick={() => setShowConfirmPassword(v => !v)}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <h2 className="text-lg font-semibold text-yellow-200 mb-2">
                Professional Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <input
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{ menu: m => ({ ...m, zIndex: 1000 }) }}
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={c => {
                    setSelectedCountry(c);
                    setSelectedState(null);
                    setSelectedCity(null);
                  }}
                  placeholder="Country"
                />
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{ menu: m => ({ ...m, zIndex: 1000 }) }}
                  options={stateOptions}
                  value={selectedState}
                  onChange={s => {
                    setSelectedState(s);
                    setSelectedCity(null);
                  }}
                  isDisabled={!selectedCountry}
                  placeholder="State"
                />
                <Select
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{ menu: m => ({ ...m, zIndex: 1000 }) }}
                  options={cityOptions}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  isDisabled={!selectedState}
                  placeholder="City"
                />
                <select
                  name="expertise"
                  value={form.expertise}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Expertise</option>
                  {EXPERTISE_OPTIONS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* More About You */}
            <div>
              <h2 className="text-lg font-semibold text-yellow-200 mb-2">
                More About You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="yearsOfExperience"
                  type="number"
                  placeholder="Years of Experience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  className={inputClass}
                />
                <input
                  name="languagesSpoken"
                  placeholder="Languages (comma separated)"
                  value={form.languagesSpoken}
                  onChange={handleChange}
                  className={inputClass}
                />
                <input
                  name="pricePerMinute"
                  type="number"
                  placeholder="Price Per Minute"
                  value={form.pricePerMinute}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <textarea
                name="bio"
                rows={4}
                placeholder="Short Bio"
                value={form.bio}
                onChange={handleChange}
                className={`${inputClass} mt-4`}
              />
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 rounded-md transition"
              >
                {loading ? <ClipLoader size={20} /> : "Register as Astrologer"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-yellow-200">
            Already a user?{" "}
            <Link to="/sign-up" className="font-medium underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
