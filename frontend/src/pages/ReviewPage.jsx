import { useState, useEffect } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";

const ReviewSection = ({ productId, orderId }) => {
  const [review, setReview] = useState(null);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const { userId, token } = useAuthStore();

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/products/${productId}/reviews`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const userReview = response.data.reviews.find(
          (r) => r.userId === userId && r.orderId === orderId
        );
        if (userReview) {
          setReview(userReview);
          setText(userReview.text);
          setRating(userReview.rating);
          if (userReview.media) setMediaPreview(userReview.media);
        }
      } catch (error) {
        toast.error("Error fetching review!");
      }
    };

    if (productId && orderId) fetchReview();
  }, [productId, orderId, userId, token]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia(reader.result);
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = async () => {
    if (!text || rating === 0) {
      toast.warn("Please provide text and rating.");
      return;
    }

    try {
      let response;
      if (review) {
        response = await axios.put(
          `${import.meta.env.VITE_BASE_URL}/products/${productId}/reviews/${
            review._id
          }`,
          { text, rating, media },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/products/${productId}/reviews`,
          { userId, orderId, text, rating, media },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setReview(response.data.review);
      toast.success("Review submitted successfully!");
    } catch {
      toast.error("Failed to submit review.");
    }
  };

  const handleDeleteReview = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/products/${productId}/reviews/${
          review._id
        }`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReview(null);
      setText("");
      setRating(0);
      setMedia(null);
      setMediaPreview(null);
      toast.success("Review deleted successfully!");
    } catch {
      toast.error("Error deleting review!");
    }
  };

  return (
    <div className="mt-6 border p-4 rounded-md bg-white/10">
      <h4 className="text-lg font-semibold text-white">
        {review ? "Your Review" : "Write a Review"}
      </h4>

      <textarea
        className="w-full border p-2 rounded-md mt-2 text-black"
        placeholder="Write your review here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-3 flex space-x-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <Star
            key={num}
            size={24}
            className={
              num <= rating
                ? "text-yellow-500 cursor-pointer"
                : "text-gray-300 cursor-pointer"
            }
            onClick={() => setRating(num)}
          />
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        className="mt-3 text-white"
        onChange={handleMediaChange}
      />
      {mediaPreview && (
        <img
          src={mediaPreview}
          alt="Preview"
          className="mt-3 w-32 h-32 rounded-md"
        />
      )}

      {!review ? (
        <button
          className="mt-3 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          onClick={handleSubmitReview}
        >
          Submit Review
        </button>
      ) : (
        <button
          className="mt-3 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          onClick={handleDeleteReview}
        >
          Delete Review
        </button>
      )}
    </div>
  );
};

export default ReviewSection;
