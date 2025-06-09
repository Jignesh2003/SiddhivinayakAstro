import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

const ChatRequestTimer = () => {
  const { sessionId } = useParams();
  const [timeLeft, setTimeLeft] = useState(120);
  const [isCancelling, setIsCancelling] = useState(false);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    let timerInterval;
    let pollingInterval;
    let didRedirect = false;

    const cleanUpAndRedirect = (path) => {
      if (didRedirect) return;
      didRedirect = true;
      clearInterval(timerInterval);
      clearInterval(pollingInterval);
      navigate(path);
    };

    const checkStatus = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_CHAT_URL}/status/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.status === "approved") {
          toast.success("Astrologer connected successfully!", { duration: 3000 });
          cleanUpAndRedirect(`/astro-user-chat/${sessionId}`);
        } else if (data.status === "rejected") {
          toast.error("Astrologer is currently busy!", { duration: 3000 });
          cleanUpAndRedirect("/astro-list");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // called when timer hits zero
    const handleTimeout = async () => {
      try {
        await axios.patch(
          `${import.meta.env.VITE_CHAT_URL}/status/${sessionId}`,
          { status: "rejected" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Auto-cancel error:", err);
      } finally {
        toast.error("No astrologer available—request cancelled.", { duration: 3000 });
        cleanUpAndRedirect("/astro-list");
      }
    };

    // Start countdown
    timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Poll every 5 seconds
    pollingInterval = setInterval(checkStatus, 5000);
    checkStatus(); // initial status check

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollingInterval);
    };
  }, [sessionId, token, navigate]);

  const handleCancel = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      await axios.patch(
        `${import.meta.env.VITE_CHAT_URL}/status/${sessionId}`,
        { status: "rejected" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.error("Request cancelled.", { duration: 3000 });
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error("Failed to cancel. Please try again.", { duration: 3000 });
    } finally {
      navigate("/astro-list");
    }
  };

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Waiting for Astrologer Approval…</h1>
      <p className="text-lg mb-6">Time Left: {formatTime(timeLeft)}</p>
      <button
        onClick={handleCancel}
        disabled={isCancelling}
        className={`px-4 py-2 rounded ${
          isCancelling
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700"
        } text-white`}
      >
        {isCancelling ? "Cancelling…" : "Cancel Request"}
      </button>
    </div>
  );
};

export default ChatRequestTimer;
