import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Country, State, City } from "country-state-city";
import useAuthStore from "@/store/useAuthStore";

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
  const [kundliData, setKundliData] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore.getState();

  // pad to two digits
  const pad2 = (s) => s.toString().padStart(2, "0");

  // *** CRITICAL: build full ISO 8601 with seconds + offset ***
  const buildDatetime = () => {
    if (!day || !month || !year || !time) return "";
    // e.g. "1997-07-09T10:10:00+05:30"
    return `${year}-${pad2(month)}-${pad2(day)}T${time}:00+05:30`;
  };

  const buildLocation = () => {
    const country = Country.getAllCountries().find(c => c.isoCode === countryCode)?.name;
    const state = states.find(s => s.isoCode === stateCode)?.name;
    return cityName && state && country
      ? `${cityName}, ${state}, ${country}`
      : "";
  };

  useEffect(() => {
    if (!countryCode) return;
    const st = State.getStatesOfCountry(countryCode);
    setStates(st);
    setStateCode("");
    setCities([]);
    setCityName("");
    setCoordinates("");
  }, [countryCode]);

  useEffect(() => {
    if (!stateCode) return;
    setCities(City.getCitiesOfState(countryCode, stateCode));
    setCityName("");
    setCoordinates("");
  }, [stateCode]);

  useEffect(() => {
    if (!cityName) return;
    const sel = cities.find(c => c.name === cityName);
    if (sel) setCoordinates(`${sel.latitude},${sel.longitude}`);
  }, [cityName, cities]);

  const handleFetch = async () => {
    const datetime = buildDatetime();
    const location = buildLocation();
    if (!datetime || !coordinates || !location) {
      toast.error("Please fill in all fields", { duration: 3000 });
      return;
    }

    // build query string
    let qs = [
      `ayanamsa=${ayanamsa}`,
      `datetime=${encodeURIComponent(datetime)}`,
      `location=${encodeURIComponent(location)}`,
      `la=${language}`,
      `result_type=advanced`,
      `submit=1`,
      `coordinates=${encodeURIComponent(coordinates)}`,
      `timezone=Asia%2FKolkata`
    ].join("&").replace(/%20/g, "+");

    setLoading(true);
    toast("Please wait while we generate your kundli", { duration: 3000 });

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_ASTROLOGY_URL}/kundli/detailed?${qs}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      // simulate a 3s loading
      setTimeout(() => {
        setKundliData(res.data);
        setLoading(false);
        toast.success("Kundli generated!", { duration: 3000 });
      }, 3000);

    } catch (err) {
      setLoading(false);
      toast.error("Failed to fetch Kundli data. Please try again.", { duration: 3000 });
      console.error(err);
    }
  };

  // date options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4">
      <Toaster position="top-center" />
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

        {/* Form */}
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Enter birth date (Day/Month/Year) and time (HH:mm)
          </p>
          <div className="grid grid-cols-3 gap-4">
            <select value={day} onChange={e => setDay(e.target.value)} className="bg-gray-800 text-white p-2 rounded border">
              <option value="">Day</option>
              {days.map(d => <option key={d} value={pad2(d)}>{pad2(d)}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(e.target.value)} className="bg-gray-800 text-white p-2 rounded border">
              <option value="">Month</option>
              {months.map(m => <option key={m} value={pad2(m)}>{pad2(m)}</option>)}
            </select>
            <select value={year} onChange={e => setYear(e.target.value)} className="bg-gray-800 text-white p-2 rounded border">
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded border"
          />

          {/* Country / State / City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="bg-gray-800 text-white p-2 rounded border">
              <option value="">Country</option>
              {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
            <select value={stateCode} onChange={e => setStateCode(e.target.value)} disabled={!states.length} className="bg-gray-800 text-white p-2 rounded border">
              <option value="">State</option>
              {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
            </select>
            <select value={cityName} onChange={e => setCityName(e.target.value)} disabled={!cities.length} className="bg-gray-800 text-white p-2 rounded border">
              <option value="">City</option>
              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <input
            type="text"
            value={coordinates}
            readOnly
            placeholder="Latitude,Longitude"
            className="w-full bg-gray-800 text-white p-2 rounded border"
          />

          <select value={ayanamsa} onChange={e => setAyanamsa(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border">
            <option value="1">Lahiri</option>
            <option value="3">Raman</option>
            <option value="5">KP</option>
          </select>

          <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="ml">Malayalam</option>
          </select>

          <Button onClick={handleFetch} disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-black w-full font-bold">
            {loading && <Loader2 className="animate-spin mr-2" />} Get Kundli
          </Button>
        </div>

        {kundliData && (
          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-400">Kundli Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {kundliData.data.kundli.map((item, i) => (
                <div key={i}>
                  <p className="font-semibold text-purple-300">{item.name}</p>
                  <p>{item.value}</p>
                </div>
              ))}
              {kundliData.data.dashaPeriods && (
                <div className="mt-4">
                  <p className="text-yellow-300 font-semibold mb-1">Dasha Periods:</p>
                  {kundliData.data.dashaPeriods.map((d, idx) => (
                    <p key={idx}>{d.planet} ({d.start_date} – {d.end_date})</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
