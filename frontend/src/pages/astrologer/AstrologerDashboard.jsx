import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Radio, Star, Clock, Award } from "lucide-react";
import useAstrologerStore from "../../store/useAstrologerStore";
import assets from "../../assets/assets";
import { toast } from "react-toastify";

const AstrologerDashboard = () => {
  const navigate = useNavigate();
  const { token, astrologerData, toggleLive, logout, loading } = useAstrologerStore();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (astrologerData) {
      setIsOnline(astrologerData.isOnline);
    }
  }, [astrologerData]);

  const handleToggleLive = async () => {
    const newStatus = await toggleLive();
    if (newStatus !== false) {
      setIsOnline(newStatus);
      toast.success(`Status changed to ${newStatus ? "Online" : "Offline"}`, {
        position: "top-right"
      });
    } else {
      toast.error("Failed to update status", { position: "top-right" });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully", { position: "top-right" });
  };

  if (!astrologerData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome, {astrologerData.firstName} 👋
            </h1>
            <p className="text-yellow-200 text-sm md:text-base">
              Manage your profile and availability
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Live Status Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <h2 className="text-lg font-semibold text-white">
                {isOnline ? "Currently Online" : "Currently Offline"}
              </h2>
            </div>
          </div>
          <button
            onClick={handleToggleLive}
            disabled={loading}
            className={`w-full md:w-64 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              isOnline
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Radio size={20} />
            <span>{isOnline ? "Go Offline" : "Go Live"}</span>
          </button>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
            <div className="space-y-3 text-gray-100">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>
                  {astrologerData.firstName} {astrologerData.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-sm">{astrologerData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone:</span>
                <span>{astrologerData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Expertise:</span>
                <span>{astrologerData.expertise || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star size={20} className="text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {(astrologerData.averageRating || 0).toFixed(1)}
                </p>
                <p className="text-gray-300 text-sm">Rating</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock size={20} className="text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {astrologerData.totalSessions || 0}
                </p>
                <p className="text-gray-300 text-sm">Sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expertise Details */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Award size={24} />
            Professional Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2">Experience</p>
              <p className="text-white text-lg">
                {astrologerData.yearsOfExperience || 0} years
              </p>
            </div>
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2">Price per Minute</p>
              <p className="text-white text-lg">
                ₹{astrologerData.pricePerMinute || 0}/min
              </p>
            </div>
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2">Languages</p>
              <p className="text-white text-lg">
                {(astrologerData.languagesSpoken || []).join(", ") || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2">Verification</p>
              <p className={`text-lg font-semibold ${
                astrologerData.isVerified ? "text-green-400" : "text-yellow-400"
              }`}>
                {astrologerData.isVerified ? "✓ Verified" : "⧓ Pending"}
              </p>
            </div>
          </div>
          {astrologerData.bio && (
            <div className="mt-6">
              <p className="text-gray-300 text-sm font-medium mb-2">Bio</p>
              <p className="text-gray-200 text-sm leading-relaxed">
                {astrologerData.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AstrologerDashboard;
