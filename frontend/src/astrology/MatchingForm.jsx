// src/pages/MatchForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Globe, User, ArrowRight, MapPin } from "lucide-react";
import { Country, State, City } from "country-state-city";

export default function MatchingForm() {
  const navigate = useNavigate();

  // Common
  const [ayanamsa, setAyanamsa] = useState("1");
  const [la, setLa] = useState("en");

  // Girl’s info
  const [girlDob, setGirlDob] = useState("");
  const [girlCountry, setGirlCountry] = useState("");
  const [girlState, setGirlState] = useState("");
  const [girlCity, setGirlCity] = useState("");
  const [girlCoords, setGirlCoords] = useState("");
  const [girlStates, setGirlStates] = useState([]);
  const [girlCities, setGirlCities] = useState([]);

  // Boy’s info
  const [boyDob, setBoyDob] = useState("");
  const [boyCountry, setBoyCountry] = useState("");
  const [boyState, setBoyState] = useState("");
  const [boyCity, setBoyCity] = useState("");
  const [boyCoords, setBoyCoords] = useState("");
  const [boyStates, setBoyStates] = useState([]);
  const [boyCities, setBoyCities] = useState([]);

  // Load girl states on country change
  useEffect(() => {
    if (!girlCountry) return;
    setGirlStates(State.getStatesOfCountry(girlCountry));
    setGirlState("");
    setGirlCity("");
    setGirlCities([]);
    setGirlCoords("");
  }, [girlCountry]);

  // Load girl cities on state change
  useEffect(() => {
    if (!girlState) return;
    setGirlCities(City.getCitiesOfState(girlCountry, girlState));
    setGirlCity("");
    setGirlCoords("");
  }, [girlState, girlCountry]);

  // Auto‑fill girl coords when city selected
  useEffect(() => {
    if (!girlCity) return;
    const c = girlCities.find((c) => c.name === girlCity);
    if (c) {
      const lat = parseFloat(c.latitude).toFixed(6);
      const lon = parseFloat(c.longitude).toFixed(6);
      setGirlCoords(`${lat},${lon}`);
    }
  }, [girlCity, girlCities]);

  // Repeat for boy
  useEffect(() => {
    if (!boyCountry) return;
    setBoyStates(State.getStatesOfCountry(boyCountry));
    setBoyState("");
    setBoyCity("");
    setBoyCities([]);
    setBoyCoords("");
  }, [boyCountry]);

  useEffect(() => {
    if (!boyState) return;
    setBoyCities(City.getCitiesOfState(boyCountry, boyState));
    setBoyCity("");
    setBoyCoords("");
  }, [boyState, boyCountry]);

  useEffect(() => {
    if (!boyCity) return;
    const c = boyCities.find((c) => c.name === boyCity);
    if (c) {
      const lat = parseFloat(c.latitude).toFixed(6);
      const lon = parseFloat(c.longitude).toFixed(6);
      setBoyCoords(`${lat},${lon}`);
    }
  }, [boyCity, boyCities]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !ayanamsa ||
      !girlDob ||
      !girlCoords ||
      !boyDob ||
      !boyCoords
    ) {
      return toast.error(
        "Please complete all fields and select cities to auto‑fill coordinates"
      );
    }

    // Append seconds and timezone offset +05:30
    const formatISO = (dt) => {
      // dt is "YYYY-MM-DDTHH:MM"
      return `${dt}:00+05:30`;
    };

    const isoGirl = formatISO(girlDob);
    const isoBoy = formatISO(boyDob);

    const qs = new URLSearchParams({
      ayanamsa,
      girl_coordinates: girlCoords,
      girl_dob: isoGirl,
      boy_coordinates: boyCoords,
      boy_dob: isoBoy,
      la,
    }).toString();

    navigate(`/matching-kundli-result?${qs}`);
    console.log(qs);
    
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-6">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 space-y-6 w-full max-w-lg "
      >
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          Kundli Compatibility
        </h1>

        {/* Ayanamsa & Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Ayanamsa</label>
            <select
              value={ayanamsa}
              onChange={(e) => setAyanamsa(e.target.value)}
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            >
              <option value="1"> Lahiri</option>
              <option value="3"> Raman</option>
              <option value="5"> KP</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Language</label>
            <select
              value={la}
              onChange={(e) => setLa(e.target.value)}
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>

        {/* Girl’s DOB */}
        <div>
          <label className=" mb-1 flex items-center gap-1">
            <User /> Girl’s DOB
          </label>
          <input
            type="datetime-local"
            value={girlDob}
            onChange={(e) => setGirlDob(e.target.value)}
            required
            className="w-full p-2 bg-white bg-opacity-20 rounded"
          />
        </div>

        {/* Girl’s Location */}
        <div className="grid grid-cols-3 gap-3">
          <select
            value={girlCountry}
            onChange={(e) => setGirlCountry(e.target.value)}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">Country</option>
            {Country.getAllCountries().map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={girlState}
            onChange={(e) => setGirlState(e.target.value)}
            disabled={!girlStates.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">State</option>
            {girlStates.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={girlCity}
            onChange={(e) => setGirlCity(e.target.value)}
            disabled={!girlCities.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">City</option>
            {girlCities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label className=" mb-1 flex items-center gap-1">
            <Globe /> Girl’s Coordinates
          </label>
          <input
            type="text"
            value={girlCoords}
            readOnly
            className="w-full p-2 bg-white bg-opacity-20 rounded pr-10"
          />
          <MapPin className="absolute right-2 top-10 text-yellow-400" />
        </div>

        {/* Boy’s DOB */}
        <div>
          <label className=" mb-1 flex items-center gap-1">
            <User /> Boy’s DOB
          </label>
          <input
            type="datetime-local"
            value={boyDob}
            onChange={(e) => setBoyDob(e.target.value)}
            required
            className="w-full p-2 bg-white bg-opacity-20 rounded"
          />
        </div>

        {/* Boy’s Location */}
        <div className="grid grid-cols-3 gap-3">
          <select
            value={boyCountry}
            onChange={(e) => setBoyCountry(e.target.value)}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">Country</option>
            {Country.getAllCountries().map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={boyState}
            onChange={(e) => setBoyState(e.target.value)}
            disabled={!boyStates.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">State</option>
            {boyStates.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={boyCity}
            onChange={(e) => setBoyCity(e.target.value)}
            disabled={!boyCities.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">City</option>
            {boyCities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label className=" mb-1 flex items-center gap-1">
            <Globe /> Boy’s Coordinates
          </label>
          <input
            type="text"
            value={boyCoords}
            readOnly
            className="w-full p-2 bg-white bg-opacity-20 rounded pr-10"
          />
          <MapPin className="absolute right-2 top-10 text-yellow-400" />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 transition rounded py-3 font-semibold flex items-center justify-center gap-2"
        >
          <ArrowRight className="h-5 w-5" />
          Check Compatibility
        </button>
      </form>
    </div>
  );
}
