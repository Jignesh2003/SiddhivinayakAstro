import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sun } from "lucide-react";
import assets from "../../assets/assets";

const SIGN_IMAGES = {
  aries: assets.Aries,
  taurus: assets.Taurus,
  gemini: assets.Gemini,
  cancer: assets.Cancer,
  leo: assets.Leo,
  virgo: assets.Virgo,
  libra: assets.Libra,
  scorpio: assets.Scorpio,
  sagittarius: assets.Sagittarius,
  capricorn: assets.Capricorn,
  aquarius: assets.Aquarius,
  pisces: assets.Pisces,
};

export default function DailyPredictionBySign() {
  const { sign } = useParams(); // Extract sign from URL
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPrediction() {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_HOROSCOPE_URL}/all`
        );
        const preds = res.data?.data?.daily_predictions || [];
        const found = preds.find(
          (item) => item.sign.name.toLowerCase() === sign.toLowerCase()
        );
        if (found) setPrediction(found.predictions[0] || null);
        else setError("Zodiac sign prediction not found.");
      } catch (err) {
        console.log(err);
        setError("Error fetching prediction.");
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, [sign]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 rounded-xl text-white">
      <div className="flex items-center gap-3 mb-6">
        <img src={SIGN_IMAGES[sign]} alt={sign} className="w-16 h-16" />
        <h1 className="text-4xl capitalize font-bold flex items-center gap-2">
          <Sun className="text-yellow-400" />
          {sign}
        </h1>
      </div>
      <Card className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-yellow-300">
            Daily Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-line text-gray-200">
          {prediction?.prediction || "No prediction available."}
          <ul className="list-disc list-inside mt-4 text-gray-300 space-y-1">
            {prediction?.seek && (
              <li>
                <strong>Seek:</strong> {prediction.seek}
              </li>
            )}
            {prediction?.challenge && (
              <li>
                <strong>Challenge:</strong> {prediction.challenge}
              </li>
            )}
            {prediction?.insight && (
              <li>
                <strong>Insight:</strong> {prediction.insight}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
