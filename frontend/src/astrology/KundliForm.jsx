import { useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function KudliForm() {
  const [datetime, setDatetime] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [ayanamsa, setAyanamsa] = useState("1"); // Lahiri by default
  const [kundliData, setKundliData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    setError("");
    if (!datetime || !coordinates) {
      setError("Please provide both datetime and coordinates.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/kundli/detailed`,
        {
          params: {
            datetime,
            coordinates,
            ayanamsa,
            la: "en",
            year_length: "1",
          },
        }
      );
      setKundliData(response.data);
    } catch (err) {
      console.error("Error fetching kundli:", err);
      setError("Failed to fetch Kundli data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-4">
          Detailed Kundli Generator
        </h1>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-600"
            placeholder="Select datetime"
          />

          <input
            type="text"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-600"
            placeholder="Latitude,Longitude (e.g. 28.6139,77.2090)"
          />

          <select
            value={ayanamsa}
            onChange={(e) => setAyanamsa(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-600"
          >
            <option value="1">Lahiri</option>
            <option value="3">Raman</option>
            <option value="5">KP</option>
          </select>

          <Button
            onClick={handleFetch}
            className="bg-yellow-500 hover:bg-yellow-600 text-black w-full font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            Get Kundli
          </Button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Kundli Result */}
        {kundliData && (
          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-400">Kundli Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {kundliData?.data?.kundli?.map((item, idx) => (
                <div key={idx}>
                  <p className="font-semibold text-purple-300">{item.name}</p>
                  <p>{item.value}</p>
                </div>
              ))}
              {kundliData?.data?.dashaPeriods && (
                <div className="mt-4">
                  <p className="text-yellow-300 font-semibold mb-1">Dasha Periods:</p>
                  {kundliData.data.dashaPeriods.map((dasha, i) => (
                    <p key={i}>{`${dasha.planet} (${dasha.start_date} - ${dasha.end_date})`}</p>
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
