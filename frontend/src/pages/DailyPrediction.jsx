// src/pages/DailyPrediction.jsx

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sun, BookOpen } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

// Swiper components & styles
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// Zodiac images & basic info
import assets from "../assets/assets";
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
const ZODIAC_INFO = {
  aries: "Aries are bold, ambitious, and confident leaders.",
  taurus: "Taurus are reliable, patient, and enjoy the finer things.",
  gemini: "Geminis are curious, witty, and always full of ideas.",
  cancer: "Cancers are intuitive, emotional, and nurturing.",
  leo: "Leos are charismatic, creative, and love attention.",
  virgo: "Virgos are detail-oriented, analytical, and loyal.",
  libra: "Libras value balance, harmony, and are social butterflies.",
  scorpio: "Scorpios are passionate, mysterious, and powerful.",
  sagittarius: "Sagittarius are adventurous, optimistic, and honest.",
  capricorn: "Capricorns are disciplined, practical, and ambitious.",
  aquarius: "Aquarius are innovative, independent, and humanitarian.",
  pisces: "Pisces are compassionate, dreamy, and artistic.",
};

export default function DailyPrediction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSign, setSelectedSign] = useState("");
  const [knowledgeSign, setKnowledgeSign] = useState("");
  const cardRefs = useRef({});

  // Fetch the full daily_predictions array
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_HOROSCOPE_URL}/all`
        );
        const preds = res.data?.data?.daily_predictions || [];
        setData(preds);
        if (preds.length) {
          setSelectedSign(preds[0].sign.name.toLowerCase());
        }
      } catch (err) {
        console.error("Error fetching horoscopes:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // When a sign is chosen, scroll its card into view
  useEffect(() => {
    if (selectedSign && cardRefs.current[selectedSign]) {
      cardRefs.current[selectedSign].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedSign]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-indigo-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold flex justify-center items-center gap-3">
            <Sun className="text-yellow-400" /> Daily Zodiac Predictions
          </h1>
          <p className="text-gray-400 text-lg">
            Swipe or tap your zodiac sign below
          </p>
        </div>

        {/* Zodiac Swiper */}
        {!loading && data.length > 0 && (
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            spaceBetween={16}
            slidesPerView={6}
            breakpoints={{
              320: { slidesPerView: 3 },
              640: { slidesPerView: 5 },
              1024: { slidesPerView: 6 },
            }}
            className="py-4"
          >
            {data.map(({ sign }) => {
              const key = sign.name.toLowerCase();
              return (
                <SwiperSlide key={key}>
                  <button
                    onClick={() => setSelectedSign(key)}
                    className={`w-full h-24 sm:h-28 flex items-center justify-center rounded-xl overflow-hidden transition ${
                      key === selectedSign
                        ? "ring-4 ring-yellow-400"
                        : "hover:ring-2 hover:ring-gray-600"
                    }`}
                  >
                    <img
                      src={SIGN_IMAGES[key]}
                      alt={sign.name}
                      className="object-contain w-full h-full"
                    />
                  </button>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}

        {/* Fallback Dropdown */}
        {!loading && data.length > 0 && (
          <div className="flex justify-center">
            <Select
              value={selectedSign}
              onValueChange={setSelectedSign}
            >
              <SelectTrigger className="w-64 bg-gray-800/80 border border-gray-700 text-white">
                <SelectValue placeholder="Choose your zodiac sign" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800/90 text-white">
                {data.map(({ sign }) => {
                  const key = sign.name.toLowerCase();
                  return (
                    <SelectItem key={key} value={key} className="capitalize">
                      {sign.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center gap-2 text-gray-400 text-base">
            <Loader2 className="animate-spin w-6 h-6" /> Fetching predictions...
          </div>
        )}

        {/* Prediction Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((item) => {
              const key = item.sign.name.toLowerCase();
              const pred = item.predictions[0] || {};
              return (
                <div
                  key={key}
                  ref={(el) => (cardRefs.current[key] = el)}
                  className={`transition-all rounded-2xl ${
                    key === selectedSign
                      ? "ring-4 ring-yellow-400"
                      : "hover:ring-2 hover:ring-gray-600"
                  }`}
                >
                  <Card className="bg-gray-800/80 border border-gray-700 p-6 rounded-2xl shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold text-yellow-300 capitalize">
                        {item.sign.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-200 leading-relaxed whitespace-pre-line min-h-[200px]">
                      {/* General */}
                      <p className="mb-4">{pred.prediction}</p>
                      {/* Seek / Challenge / Insight */}
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {pred.seek && <li><strong>Seek:</strong> {pred.seek}</li>}
                        {pred.challenge && <li><strong>Challenge:</strong> {pred.challenge}</li>}
                        {pred.insight && <li><strong>Insight:</strong> {pred.insight}</li>}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Zodiac Traits Dropdown */}
        <div className="mt-12 border-t border-gray-700 pt-8 space-y-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="text-purple-400" /> Know More About Zodiac Signs
          </h2>

          <div className="max-w-md">
            <Select
              value={knowledgeSign}
              onValueChange={setKnowledgeSign}
            >
              <SelectTrigger className="bg-gray-800 border border-gray-700 text-white">
                <SelectValue placeholder="Select a zodiac sign" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 text-white">
                {Object.keys(ZODIAC_INFO).map((sign) => (
                  <SelectItem key={sign} value={sign} className="capitalize">
                    {sign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {knowledgeSign && (
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 text-gray-300 shadow-lg max-w-3xl">
              <h3 className="text-xl font-semibold text-yellow-300 capitalize mb-2">
                {knowledgeSign}
              </h3>
              <p className="leading-relaxed text-gray-100">
                {ZODIAC_INFO[knowledgeSign]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
