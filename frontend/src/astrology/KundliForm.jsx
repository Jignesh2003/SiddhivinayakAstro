import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Country, State, City } from "country-state-city";

export default function KundliForm() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [time, setTime] = useState("");             // "HH:mm"
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [ayanamsa, setAyanamsa] = useState("1");
  const [language, setLanguage] = useState("en");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const pad2 = (s) => s.toString().padStart(2, "0");

  const buildDatetime = () => {
    if (!day||!month||!year||!time) return "";
    return `${year}-${pad2(month)}-${pad2(day)}T${time}:00+05:30`;
  };
  const buildLocation = () => {
    const country = Country.getAllCountries().find(c=>c.isoCode===countryCode)?.name;
    const state = states.find(s=>s.isoCode===stateCode)?.name;
    return cityName&&state&&country
      ? `${cityName}, ${state}, ${country}`
      : "";
  };

  // load states & cities
  useEffect(() => {
    if (!countryCode) return;
    setStates(State.getStatesOfCountry(countryCode));
    setStateCode(""); setCities([]); setCityName(""); setCoordinates("");
  }, [countryCode]);

  useEffect(() => {
    if (!stateCode) return;
    setCities(City.getCitiesOfState(countryCode, stateCode));
    setCityName(""); setCoordinates("");
  }, [stateCode]);

  useEffect(() => {
    if (!cityName) return;
    const sel = cities.find(c=>c.name===cityName);
    if (sel) setCoordinates(`${sel.latitude},${sel.longitude}`);
  }, [cityName, cities]);

  const handleSubmit = () => {
    const datetime = buildDatetime();
    const location = buildLocation();
    if (!datetime||!coordinates||!location) {
      toast.error("Please fill all fields");
      return;
    }

    const q = new URLSearchParams({
      datetime,
      coordinates,
      location,
      ayanamsa,
      la: language,
      year_length: "1"
    }).toString();

    setLoading(true);
    toast("Redirecting…", { duration: 1500 });
    setTimeout(() => {
      setLoading(false);
      navigate(`/kundli-result?${q}`);
    }, 800);
  };

  // date arrays
  const days = [...Array(31)].map((_,i)=>i+1);
  const months = [...Array(12)].map((_,i)=>i+1);
  const currentYear = new Date().getFullYear();
  const years = [...Array(120)].map((_,i)=>currentYear - i);

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4">
      <Toaster position="top-center"/>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-yellow-400 text-center">
          Detailed Kundli Generator
        </h1>
              {/* Ayanamsa Info */}
        <div className="bg-gray-800 p-4 rounded space-y-1 text-sm">
          <p><strong>Ayanamsa</strong> sets the zodiac offset:</p>
          <ul className="list-disc list-inside">
            <li><strong>Lahiri</strong> – Official Indian standard</li>
            <li><strong>Raman</strong> – G.K. Ojha’s method</li>
            <li><strong>KP</strong> – Krishnamurti Paddhati</li>
          </ul>
        </div>
        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-4">
          <select value={day} onChange={e=>setDay(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Day</option>
            {days.map(d=><option key={d} value={pad2(d)}>{pad2(d)}</option>)}
          </select>
          <select value={month} onChange={e=>setMonth(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Month</option>
            {months.map(m=><option key={m} value={pad2(m)}>{pad2(m)}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Year</option>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <input
          type="time" value={time}
          onChange={e=>setTime(e.target.value)}
          className="w-full bg-gray-800 p-2 rounded"
        />

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select value={countryCode} onChange={e=>setCountryCode(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Country</option>
            {Country.getAllCountries().map(c=><option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
          </select>
          <select value={stateCode} onChange={e=>setStateCode(e.target.value)} disabled={!states.length} className="bg-gray-800 p-2 rounded">
            <option value="">State</option>
            {states.map(s=><option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
          </select>
          <select value={cityName} onChange={e=>setCityName(e.target.value)} disabled={!cities.length} className="bg-gray-800 p-2 rounded">
            <option value="">City</option>
            {cities.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <input
          type="text" value={coordinates} readOnly
          placeholder="Latitude,Longitude"
          className="w-full bg-gray-800 p-2 rounded"
        />

        {/* Ayanamsa & Language */}
        <select value={ayanamsa} onChange={e=>setAyanamsa(e.target.value)} className="bg-gray-800 p-2 rounded">
          <option value="1">Lahiri</option>
          <option value="3">Raman</option>
          <option value="5">KP</option>
        </select>
        <select value={language} onChange={e=>setLanguage(e.target.value)} className="bg-gray-800 p-2 rounded">
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
          <option value="te">Telugu</option>
          <option value="ml">Malayalam</option>
        </select>

        <Button onClick={handleSubmit} disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-black w-full font-bold">
          {loading && <Loader2 className="animate-spin mr-2"/>} Generate Kundli
        </Button>
      </div>
    </div>
  );
}
