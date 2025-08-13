import  { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../../../store/authStore"; // adjust path if needed
import { toast } from "react-toastify";

export const Invoice = () => {
  const { orderId } = useParams();
  const { token } = useAuthStore();

  // Function to download invoice
  const handleDownloadInvoice = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_ORDER_URL}/invoice/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // Important for downloading PDF
        }
      );
      console.log(res);

      // Create a Blob URL
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Invoice downloaded");
    } catch (error) {
      console.error("Invoice download failed", error);
      toast.error("Failed to download invoice");
    }
  };

  // ✅ Auto-download on first render
  useEffect(() => {
    if (orderId) {
      handleDownloadInvoice();
    }
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Invoice</h1>
      <p className="mb-4 text-gray-600">
        Order ID: <span className="font-mono">{orderId}</span>
      </p>
      <button
        onClick={handleDownloadInvoice}
        className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow"
      >
        📄 Download Again
      </button>
    </div>
  );
};

export default Invoice;
