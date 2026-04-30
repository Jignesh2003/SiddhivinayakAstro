import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, AlertTriangle } from "lucide-react";

const MatchingCompatiblityResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.result;
  
  console.log("🔍 Full API Response:", JSON.stringify(data, null, 2));

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Data Found</h2>
          <p className="text-gray-600 mb-4">Please go back and try again.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Try multiple data paths - ProKerala might return it directly
  const innerData = data?.data || data || {};
  const boyInfo = innerData?.boy_info || innerData?.boy || {};
  const girlInfo = innerData?.girl_info || innerData?.girl || {};
  
  const boyKoot = boyInfo?.koot || {};
  const girlKoot = girlInfo?.koot || {};
  
  const boyRasi = boyInfo?.rasi || {};
  const girlRasi = girlInfo?.rasi || {};
  
  const boyNakshatra = boyInfo?.nakshatra || {};
  const girlNakshatra = girlInfo?.nakshatra || {};
  
  // Get total and max points from guna_milan
  const gunamilan = innerData?.guna_milan || {};
  const total = Math.round(gunamilan?.total_points || 0);
  const max = gunamilan?.maximum_points || 36;
  const percentage = Math.round((total / max) * 100);

  // Score color and verdict
  let scoreColor, verdict, bgGradient, emoji;
  if (total >= 30) {
    scoreColor = "text-green-600";
    verdict = "Excellent Match";
    bgGradient = "from-green-50 to-emerald-50";
    emoji = "💯";
  } else if (total >= 24) {
    scoreColor = "text-blue-600";
    verdict = "Good Match";
    bgGradient = "from-blue-50 to-indigo-50";
    emoji = "👍";
  } else if (total >= 18) {
    scoreColor = "text-yellow-600";
    verdict = "Average Match";
    bgGradient = "from-yellow-50 to-amber-50";
    emoji = "⚖️";
  } else {
    scoreColor = "text-red-600";
    verdict = "Poor Match";
    bgGradient = "from-red-50 to-pink-50";
    emoji = "❌";
  }

  // Koota details for table
  const kootaList = [
    { key: "varna", label: "Varna (Caste)", icon: "🧬" },
    { key: "vasya", label: "Vasya (Control)", icon: "🧲" },
    { key: "tara", label: "Tara (Destiny)", icon: "✨" },
    { key: "yoni", label: "Yoni (Nature)", icon: "🐾" },
    { key: "graha_maitri", label: "Grah Maitri (Friendship)", icon: "🪐" },
    { key: "gana", label: "Gana (Temperament)", icon: "⚖️" },
    { key: "bhakoot", label: "Bhakoot (Family)", icon: "🏠" },
    { key: "nadi", label: "Nadi (Health)", icon: "💉" },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} py-8 px-4`}>
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Hero Score Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 text-center">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Kundli Matching Result</h1>
          
          {/* Big Score */}
          <div className="my-6">
            <span className={`text-7xl font-extrabold ${scoreColor}`}>{total}</span>
            <span className="text-3xl text-gray-400 font-semibold">/{max}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-5 mb-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                total >= 30 ? "bg-green-500" :
                total >= 24 ? "bg-blue-500" :
                total >= 18 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mb-2">{percentage}% Compatibility</p>
          <p className={`text-xl font-bold ${scoreColor}`}>{verdict}</p>
        </div>

        {/* Boy & Girl Profile Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Boy Card */}
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart size={28} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Boy</h3>
            <p className="text-sm text-gray-600">
              Rasi: <span className="font-medium capitalize">{boyRasi?.name || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600">
              Nakshatra: <span className="font-medium capitalize">{boyNakshatra?.name || "N/A"}</span>
            </p>
          </div>

          {/* Girl Card */}
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart size={28} className="text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Girl</h3>
            <p className="text-sm text-gray-600">
              Rasi: <span className="font-medium capitalize">{girlRasi?.name || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-600">
              Nakshatra: <span className="font-medium capitalize">{girlNakshatra?.name || "N/A"}</span>
            </p>
          </div>
        </div>

        {/* Koota Breakdown Table */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={22} className="text-orange-500" />
            Guna Milan Koota Details
          </h2>
          <div className="space-y-3">
            {kootaList.map((koota) => {
              // Safely extract koota values (API sometimes returns {} which crashes React)
              const getSafeValue = (val) => {
                if (!val) return "-";
                if (typeof val === 'object') {
                  if (Object.keys(val).length === 0) return "-";
                  return val.name || val.description || JSON.stringify(val);
                }
                return val;
              };

              const boyKootValue = getSafeValue(boyKoot[koota.key]);
              const girlKootValue = getSafeValue(girlKoot[koota.key]);
              
              return (
                <div key={koota.key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">
                      {koota.icon} {koota.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 rounded p-2">
                      <span className="text-gray-600">Boy: </span>
                      <span className="font-semibold text-gray-800">{boyKootValue}</span>
                    </div>
                    <div className="bg-pink-50 rounded p-2">
                      <span className="text-gray-600">Girl: </span>
                      <span className="font-semibold text-gray-800">{girlKootValue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Section */}
        {innerData?.message && (
          <div className={`rounded-3xl shadow-xl p-6 mb-8 border-l-4 ${
            innerData.message.type === "good" ? "bg-green-50 border-green-500" :
            innerData.message.type === "average" ? "bg-yellow-50 border-yellow-500" :
            "bg-red-50 border-red-500"
          }`}>
            <h3 className={`font-bold mb-2 ${
              innerData.message.type === "good" ? "text-green-700" :
              innerData.message.type === "average" ? "text-yellow-700" :
              "text-red-700"
            }`}>
              Astrologer's Insight
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {typeof innerData.message.description === 'string' 
                ? innerData.message.description 
                : "No specific detailed description provided by the API for this match."}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/free-kundli-match")}
            className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition shadow-lg"
          >
            Check Another Match
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white text-orange-600 border-2 border-orange-600 py-3 rounded-xl font-semibold hover:bg-orange-50 transition"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchingCompatiblityResult;