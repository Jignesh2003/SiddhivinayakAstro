// src/pages/DailyPrediction.jsx

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Loader2, Sun, BookOpen, Calendar, X } from "lucide-react";
import { useState } from "react";
import axios from "axios";

// Swiper components & styles
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

// Zodiac images & basic info
import assets from "../assets/assets";

const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
];

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
  // cachedPredictions acts as our frontend dictionary/in-memory cache.
  // It stores horoscope data using the zodiac sign as the key (e.g., cachedPredictions["aries"]).
  // This prevents making a new API call if the user clicks the same sign twice in one session.
  // Note: This state is cleared automatically when the user refreshes or leaves the page.
  const [cachedPredictions, setCachedPredictions] = useState({});

  // Stores the data of the currently clicked zodiac sign to display in the modal popup
  const [selectedSignData, setSelectedSignData] = useState(null);

  // Tracks which sign is currently being fetched from the backend to show a loading spinner
  const [loadingSign, setLoadingSign] = useState(null);

  // Controls the visibility of the prediction modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Global error state if the API fails (e.g., due to insufficient Prokerala credits)
  const [error, setError] = useState(null);

  // Helper to display the current date beautifully in the header
  const getCurrentDate = () => {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return now.toLocaleDateString('en-US', options);
  };

  // Triggered when a user clicks on one of the 12 zodiac sign cards
  const handleSignClick = async (sign) => {
    const lowerSign = sign.toLowerCase();

    // 1) CACHE CHECK: If we already fetched this sign's prediction today,
    // load it from our local dictionary instead of hitting the backend API again.
    // This saves massive amounts of API credits!
    if (cachedPredictions[lowerSign]) {
      setSelectedSignData(cachedPredictions[lowerSign]);
      setIsModalOpen(true);
      return;
    }

    // 2) FETCH NEW DATA: Not in cache, so we must fetch it from the backend.
    setLoadingSign(lowerSign);
    setError(null);

    try {
      const res = await axios.get(`${import.meta.env.VITE_HOROSCOPE_URL}/${lowerSign}`);
      const predictionData = res.data?.data?.daily_prediction;

      if (!predictionData) {
        throw new Error("Invalid response format");
      }

      // 3) UPDATE CACHE: Save the newly fetched data into our dictionary
      setCachedPredictions((prev) => ({
        ...prev,
        [lowerSign]: predictionData
      }));

      // 4) DISPLAY MODAL: Set the data and open the modal popup
      setSelectedSignData(predictionData);
      setIsModalOpen(true);
    } catch (err) {
      console.error(`Error fetching prediction for ${lowerSign}:`, err);
      setError(`Failed to fetch the horoscope for ${sign}.`);
    } finally {
      setLoadingSign(null); // Stop the spinning loader
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Wait 300ms for the fade-out animation to complete before clearing the data
    setTimeout(() => setSelectedSignData(null), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-indigo-900 text-white relative">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold flex justify-center items-center gap-3">
            <Sun className="text-yellow-400" /> Daily Zodiac Predictions
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Calendar className="w-5 h-5" />
            <p className="text-lg font-medium">{getCurrentDate()}</p>
          </div>
          <p className="text-gray-400 text-lg">
            Tap on your zodiac sign below to read today's horoscope
          </p>
        </div>

        {/* Global Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl text-center max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Zodiac Signs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 py-8 px-2">
          {ZODIAC_SIGNS.map((sign) => (
            <button
              key={sign}
              onClick={() => handleSignClick(sign)}
              disabled={loadingSign === sign}
              className={`relative flex flex-col items-center justify-center rounded-full transition-all duration-500 group
                ${loadingSign === sign
                  ? 'opacity-70 scale-95'
                  : 'hover:-translate-y-2 hover:scale-105'}
              `}
            >
              {/* Animated Glow Behind the Circle on Hover */}
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl scale-50 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>

              {/* The Zodiac Circle */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center p-2 shadow-[inset_0_4px_15px_rgba(0,0,0,0.6),0_8px_20px_rgba(0,0,0,0.4)] border border-gray-700/50 group-hover:border-yellow-400/60 group-hover:shadow-[0_0_25px_rgba(250,204,21,0.3)] transition-all duration-300 overflow-hidden">
                {loadingSign === sign ? (
                  <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
                ) : (
                  <img
                    src={SIGN_IMAGES[sign]}
                    alt={sign}
                    className="object-contain w-full h-full drop-shadow-xl group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] transition-transform duration-500"
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Zodiac Traits Carousel */}
        <div className="mt-16 border-t border-gray-800 pt-10 space-y-8 w-full">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
            <BookOpen className="text-purple-400 w-8 h-8" /> Know More About Zodiac Signs
          </h2>

          <div className="w-full">
            <Swiper
              modules={[Autoplay, EffectFade]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              speed={2500} // Keeps the fading transition slow and smooth
              loop={true}
              grabCursor={true} // Makes it feel more interactive
              className="rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            >
              {Object.keys(ZODIAC_INFO).map((sign) => (
                <SwiperSlide key={sign}>
                  <div className="relative group bg-gradient-to-br from-indigo-950/90 via-gray-900/95 to-black/95 border border-yellow-500/20 hover:border-yellow-400/50 rounded-3xl p-8 sm:p-12 text-gray-300 shadow-xl backdrop-blur-md min-h-[200px] flex flex-col justify-center transition-all duration-700 overflow-hidden cursor-grab active:cursor-grabbing">

                    {/* Background Animated Glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-yellow-400/20 transition-colors duration-1000"></div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
                      {/* Image Container with floating animation */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black/60 rounded-full p-4 border border-gray-600/50 shadow-[inset_0_4px_15px_rgba(0,0,0,0.8)] flex-shrink-0 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.2)] transition-shadow duration-700 animate-[bounce_6s_ease-in-out_infinite]">
                        <img
                          src={SIGN_IMAGES[sign]}
                          alt={sign}
                          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>

                      <div className="text-center sm:text-left flex-1 flex flex-col justify-center pt-2">
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 capitalize drop-shadow-sm tracking-wide">
                          {sign}
                        </h3>
                        <div className="h-1 w-16 bg-yellow-500/50 rounded-full my-4 mx-auto sm:mx-0 group-hover:w-32 transition-all duration-700"></div>
                        <p className="leading-relaxed text-gray-200 text-base sm:text-xl font-light tracking-wide max-w-4xl">
                          {ZODIAC_INFO[sign]}
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      {/* Prediction Modal */}
      {isModalOpen && selectedSignData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="absolute inset-0"
            onClick={closeModal}
          ></div>

          <Card className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900/95 via-indigo-950/95 to-slate-900/95 border border-yellow-500/30 shadow-[0_0_50px_rgba(99,102,241,0.3)] ring-1 ring-white/10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-3xl backdrop-blur-xl">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 bg-black/40 hover:bg-red-500/20 hover:text-red-400 rounded-full text-gray-400 transition-all duration-200 z-10 border border-transparent hover:border-red-500/30"
            >
              <X className="w-6 h-6" />
            </button>

            <CardHeader className="pb-6 pt-10 text-center relative">
              {/* Background Glow Effect behind Image */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/20 blur-[60px] rounded-full pointer-events-none"></div>

              {/* Enlarged Image Container */}
              <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center p-6 mb-6 shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] border-2 border-yellow-500/40 group">
                <img
                  src={SIGN_IMAGES[selectedSignData.sign_name.toLowerCase()]}
                  alt={selectedSignData.sign_name}
                  className="object-contain w-full h-full drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Title & Date */}
              <CardTitle className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 capitalize tracking-wide drop-shadow-sm">
                {selectedSignData.sign_name}
              </CardTitle>
              <div className="inline-flex items-center justify-center gap-2 mt-4 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <Calendar className="w-4 h-4 text-yellow-500/80" />
                <p className="text-gray-300 text-sm font-medium tracking-wide">
                  {selectedSignData.date}
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-8 sm:p-10 pt-0 relative">
              <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>
              <div className="prose prose-invert max-w-none mt-6">
                <p
                  className="text-gray-200 leading-relaxed text-lg sm:text-xl whitespace-pre-line font-light tracking-wide"
                  dangerouslySetInnerHTML={{ __html: selectedSignData.prediction }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}