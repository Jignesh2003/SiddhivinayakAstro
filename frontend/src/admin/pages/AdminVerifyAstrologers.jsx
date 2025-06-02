import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../store/useAuthStore";

const AdminVerifyAstrologers = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token ,userId} = useAuthStore();
// const id = userId
  const fetchAstrologers = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/admin/astrologers/pending-kyc`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAstrologers(res.data.astrologers || []);
    } catch (err) {
      console.error("Error fetching astrologers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const handleVerification = async (id, action) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/admin/astrologers/${id}/verify`,
        { status: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAstrologers((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(`Failed to ${action} astrologer`, err);
    }
  };

  if (loading) {
    return <p className="p-4 text-center text-gray-600">Loading astrologers...</p>;
  }

  return (
    <div className="p-4">
      {astrologers.length === 0 ? (
        <p className="text-center text-gray-600">No pending KYC astrologers.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {astrologers.map((astro) => (
            <div
              key={astro._id}
              className="border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col"
            >
              <div className="p-4 flex-1">
                <h2 className="text-lg font-semibold mb-1 text-gray-800">
                  {astro.firstName} {astro.lastName}
                </h2>
                <p className="text-sm text-gray-500 mb-1">Email: {astro.email}</p>
                <p className="text-sm text-gray-500 mb-1">Phone: {astro.phone}</p>
                <p className="text-sm text-gray-500 mb-3">
                  Experience: {astro.yearsOfExperience} yrs
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {astro.documents?.aadhaar && (
                    <a
                      href={astro.documents.aadhaar}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={astro.documents.aadhaar}
                        alt="Aadhaar"
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </a>
                  )}
                  {astro.documents?.pan && (
                    <a
                      href={astro.documents.pan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={astro.documents.pan}
                        alt="PAN"
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </a>
                  )}
                  {astro.documents?.education && (
                    <a
                      href={astro.documents.education}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={astro.documents.education}
                        alt="Education"
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </a>
                  )}
                  {astro.documents?.bank && (
                    <a
                      href={astro.documents.bank}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={astro.documents.bank}
                        alt="Bank"
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </a>
                  )}
                </div>
              </div>

              <div className="px-4 pb-4 flex justify-between">
                <button
                  onClick={() => handleVerification(astro._id, "approved")}
                  className="flex-1 mr-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-md transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleVerification(astro._id, "rejected")}
                  className="flex-1 ml-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-md transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerifyAstrologers;
