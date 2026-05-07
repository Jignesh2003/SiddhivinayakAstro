import { useEffect, useState } from "react";
import axios from "axios";
import { Star, MessageCircle, Loader } from "lucide-react";
import { toast } from "react-toastify";

const LiveAstrologers = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveAstrologers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_ASTRO_URL}/list?isOnline=true`
        );
        setAstrologers(response.data || []);
      } catch (error) {
        console.error("Error fetching live astrologers:", error);
        toast.error("Failed to load astrologers", { position: "top-right" });
      } finally {
        setLoading(false);
      }
    };

    fetchLiveAstrologers();
  }, []);

  const handleChatNow = (astrologerId, astrologerName) => {
    // You can implement chat navigation here
    toast.info(`Opening chat with ${astrologerName}`, { position: "top-right" });
    // Example: navigate(`/chat/${astrologerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-yellow-500" size={40} />
          <p className="text-gray-400">Loading live astrologers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Live Astrologers</h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Connect with verified astrologers available right now
          </p>
        </div>

        {/* Astrologers Grid */}
        {astrologers.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4 text-5xl">😴</div>
            <p className="text-gray-400 text-lg">
              No astrologers are online at the moment
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later or book a session for a future time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {astrologers.map((astrologer) => (
              <div
                key={astrologer._id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700 hover:border-yellow-500 transition shadow-lg hover:shadow-xl hover:shadow-yellow-500/10"
              >
                {/* Online Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Live
                  </div>
                </div>

                {/* Profile Image Placeholder */}
                <div className="bg-gradient-to-b from-yellow-500 to-orange-500 h-40 flex items-center justify-center">
                  <div className="text-5xl">✨</div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Name */}
                  <h3 className="text-lg font-bold text-white truncate mb-1">
                    {astrologer.firstName} {astrologer.lastName}
                  </h3>

                  {/* Expertise */}
                  <p className="text-yellow-400 text-sm font-medium mb-3">
                    {astrologer.expertise || "Astrologer"}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-semibold">
                        {(astrologer.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      ({astrologer.totalSessions || 0} sessions)
                    </span>
                  </div>

                  {/* Experience & Languages */}
                  <div className="space-y-2 mb-4 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Experience:</span>
                      <span className="text-white font-medium">
                        {astrologer.yearsOfExperience || 0} yrs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="text-white font-medium">
                        ₹{astrologer.pricePerMinute || 0}/min
                      </span>
                    </div>
                  </div>

                  {/* Languages */}
                  {astrologer.languagesSpoken && astrologer.languagesSpoken.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-slate-700">
                      <p className="text-xs text-gray-400 mb-2">Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {astrologer.languagesSpoken.slice(0, 2).map((lang, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-700 text-gray-200 text-xs px-2 py-1 rounded"
                          >
                            {lang}
                          </span>
                        ))}
                        {astrologer.languagesSpoken.length > 2 && (
                          <span className="text-gray-400 text-xs px-2 py-1">
                            +{astrologer.languagesSpoken.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chat Button */}
                  <button
                    onClick={() =>
                      handleChatNow(
                        astrologer._id,
                        `${astrologer.firstName} ${astrologer.lastName}`
                      )
                    }
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <MessageCircle size={18} />
                    Chat Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAstrologers;
