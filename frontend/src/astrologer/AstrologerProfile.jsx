import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { UploadCloud } from "lucide-react";
import AstrologerSidebar from "./AstrologerSidebar";
import useAuthStore from "../store/useAuthStore";

const AstrologerProfile = () => {
  const [files, setFiles] = useState({
    aadhaar: null,
    pan: null,
    education: null,
    bank: null,
  });

  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);

  const handleFileChange = (e, field) => {
    setFiles((prev) => ({ ...prev, [field]: e.target.files[0] }));
  };

  const handleSubmit = async () => {
    if (!files.aadhaar || !files.pan || !files.education || !files.bank) {
      toast.error("Please upload all required documents.");
      return;
    }

    const formData = new FormData();
    formData.append("aadhaar", files.aadhaar);
    formData.append("pan", files.pan);
    formData.append("education", files.education);
    formData.append("bank", files.bank);

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_ASTRO_URL}/upload-documents`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Documents uploaded successfully!");
      setFiles({ aadhaar: null, pan: null, education: null, bank: null });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderUploadInput = (label, field) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="font-medium text-sm text-gray-700">{label}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, field)}
        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <AstrologerSidebar />

      <div className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800">
            Upload Documents
          </h1>

          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md space-y-5 w-full">
            {renderUploadInput("Aadhaar Card", "aadhaar")}
            {renderUploadInput("PAN Card", "pan")}
            {renderUploadInput("Education Certificate", "education")}
            {renderUploadInput("Bank Passbook", "bank")}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  Upload All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstrologerProfile;
