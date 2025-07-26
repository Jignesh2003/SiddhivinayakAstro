import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { UploadCloud } from "lucide-react";
import AstrologerSidebar from "./AstrologerSidebar";
import useAuthStore from "../store/useAuthStore";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const AstrologerProfile = () => {
  const [files, setFiles] = useState({
    aadhaar: null,
    pan: null,
    education: null,
    bank: null,
  });
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(""); // holds the returned kyc status

  const token = useAuthStore((state) => state.token);

  // Check file size and type before accepting
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) {
      setFiles((prev) => ({ ...prev, [field]: null }));
      return;
    }
    // Client side file size check
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name} is too large. Max 5MB per document.`);
      e.target.value = "";
      return;
    }
    // Accept only images
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Only images are allowed.");
      e.target.value = "";
      return;
    }
    setFiles((prev) => ({ ...prev, [field]: file }));
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
      const res = await axios.post(
        `${import.meta.env.VITE_ASTRO_URL}/upload-documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Set kyc status from response
      if (res.data.user?.kyc) {
        setKycStatus(res.data.user.kyc);
      }
      toast.success(res.data.message);
      setFiles({ aadhaar: null, pan: null, education: null, bank: null });
    } catch (err) {
      if (
        err?.response?.data?.message?.includes("too large") ||
        err?.response?.data?.message?.includes("5MB")
      ) {
        toast.error(err.response.data.message);
      } else {
        toast.error(
          err.response?.data?.message || "Failed to upload. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderUploadInput = (label, field) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="font-medium text-sm text-gray-700">{label}</label>
      <input
        key={files[field]?.name || field} // forces remount when files[field] changes
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, field)}
        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {files[field] && (
        <div className="flex items-center gap-2 mt-2">
          <img
            src={URL.createObjectURL(files[field])}
            alt={field}
            className="h-16 w-16 object-cover rounded"
          />
          <span className="text-sm text-gray-600">{files[field].name}</span>
        </div>
      )}
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

          {/* Display current KYC status */}
          {kycStatus && (
            <div className="mb-6">
              <span className="font-medium">KYC Status: </span>
              <span
                className={`font-semibold ${
                  kycStatus === "approved"
                    ? "text-green-600"
                    : kycStatus === "rejected"
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              >
                {kycStatus}
              </span>
            </div>
          )}

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
