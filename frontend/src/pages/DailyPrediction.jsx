// src/pages/DailyPrediction.jsx

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Loader2, Sun } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// Your zodiac images imported from your assets file
import assets from "../assets/assets";

// Map sign names (lowercase) to their image
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

export default function DailyPrediction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSign, setSelectedSign] = useState("");
  const cardRefs = useRef({});

  // Fetch all predictions once
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_HOROSCOPE_URL}/all`
        );
        const preds = res.data?.data?.daily_predictions || [];
        setData(
          preds.map((item) => ({
            sign: item.sign.name.toLowerCase(),
            displayName: item.sign.name,
            prediction:
              item.predictions[0]?.prediction || "No prediction available.",
          }))
        );
      } catch (err) {
        console.error("Error fetching horoscopes:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Default select first sign when data arrives
  useEffect(() => {
    if (!selectedSign && data.length) {
      setSelectedSign(data[0].sign);
    }
  }, [data]);

  // Scroll to card on select change
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
            Swipe or select your zodiac sign below
          </p>
        </div>

        {/* Zodiac Image Slider */}
        {!loading && data.length > 0 && (
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={12}
            slidesPerView={6}
            navigation
            autoplay={{ delay: 2000, disableOnInteraction: false }}
            breakpoints={{
              320: { slidesPerView: 3 },
              640: { slidesPerView: 5 },
              1024: { slidesPerView: 6 },
            }}
            className="py-4"
          >
            {data.map(({ sign, displayName }) => (
              <SwiperSlide key={sign}>
                <button
                  onClick={() => setSelectedSign(sign)}
                  className={`w-full h-24 sm:h-28 flex flex-col items-center justify-center rounded-xl overflow-hidden transition 
                    ${
                      selectedSign === sign
                        ? "ring-2 ring-yellow-400"
                        : "hover:ring-1 hover:ring-gray-600"
                    }
                  `}
                >
                  <img
                    src={SIGN_IMAGES[sign]}
                    alt={displayName}
                    className="object-fit w-full h-full"
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* Dropdown Fallback */}
        {!loading && data.length > 0 && (
          <div className="flex justify-center">
            <Select
              value={selectedSign}
              onValueChange={(val) => setSelectedSign(val)}
            >
              <SelectTrigger className="w-64 bg-gray-800/80 border border-gray-700 text-white">
                <SelectValue placeholder="Choose your zodiac sign" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800/90 text-white">
                {data.map(({ sign, displayName }) => (
                  <SelectItem
                    key={sign}
                    value={sign}
                    className="capitalize hover:bg-gray-700"
                  >
                    {displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center gap-2 text-gray-400 text-base">
            <Loader2 className="animate-spin w-6 h-6" /> Fetching predictions...
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map(({ sign, displayName, prediction }) => (
              <div
                key={sign}
                ref={(el) => (cardRefs.current[sign] = el)}
                className={`transition-all rounded-2xl ${
                  selectedSign === sign
                    ? "ring-2 ring-yellow-400"
                    : "hover:ring-1 hover:ring-gray-600"
                }`}
              >
                <Card className="bg-gray-800/80 border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-4xl">{SIGN_IMAGES[sign] && ""}</span>
                      <span className="text-2xl font-bold text-yellow-300 capitalize">
                        {displayName}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm sm:text-base text-gray-200 leading-relaxed whitespace-pre-line min-h-[150px]">
                    {prediction}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
