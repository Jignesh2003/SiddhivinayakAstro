import { Link } from "react-router-dom";
import assets from "../../assets/assets";
import BlogNavbar from "./BlogNavbar";
import { useEffect } from "react";

const PowerOfMeditation = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <BlogNavbar />
      <div className="min-h-screen bg-gray-900 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-center text-yellow-400 mb-4">
            The Power of Meditation
          </h1>
          <img
            src={assets.Virgo}
            alt="Meditation"
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
          <p className="text-lg mb-4">
            Meditation is an ancient practice that brings peace, clarity, and spiritual
            awareness. By quieting the mind and focusing inward, one can achieve a
            state of deep relaxation and heightened consciousness.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">
            Benefits of Meditation
          </h2>
          <ul className="list-disc list-inside mb-4">
            <li>Reduces stress and anxiety</li>
            <li>Enhances focus and mental clarity</li>
            <li>Improves emotional well-being</li>
            <li>Strengthens spiritual connection</li>
            <li>Promotes overall health and well-being</li>
            <li>Enhances self-awareness and mindfulness</li>
            <li>Boosts creativity and problem-solving abilities</li>
          </ul>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">
            Meditation and Astrology
          </h2>
          <p className="mb-4">
            Just as astrology helps us understand cosmic influences, meditation allows us
            to align our energies with the universe. Many practitioners meditate based on
            planetary positions to harness celestial energies effectively. Each zodiac
            sign and planetary transit has unique vibrational frequencies that can be
            balanced through meditation.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">
            Different Meditation Techniques
          </h2>
          <ul className="list-disc list-inside mb-4">
            <li><strong>Mindfulness Meditation:</strong> Focus on the present moment, observing thoughts without judgment.</li>
            <li><strong>Chakra Meditation:</strong> Activate and balance the body’s energy centers for spiritual growth.</li>
            <li><strong>Mantra Meditation:</strong> Chant sacred sounds or affirmations to elevate consciousness.</li>
            <li><strong>Guided Meditation:</strong> Follow a guided voice to visualize and deepen relaxation.</li>
          </ul>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">
            Meditation for Emotional Healing
          </h2>
          <p className="mb-4">
            Regular meditation helps release past traumas, fosters self-love, and strengthens emotional resilience.
            By incorporating meditation into your daily routine, you can cultivate inner peace and gain a deeper
            understanding of yourself and your life&apos;s purpose.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">
            Getting Started with Meditation
          </h2>
          <p className="mb-4">
            To begin meditating, find a quiet place, sit comfortably, and focus on your
            breath. Let go of distractions and allow your mind to enter a peaceful state.
            Start with just a few minutes a day and gradually extend your practice.
            Consistency is key to experiencing the full benefits of meditation.
          </p>
          <div className="flex justify-center mt-6">
          <Link
            to="/"
            className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg text-lg font-semibold hover:bg-yellow-600"
          >
            Back to Home
          </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PowerOfMeditation;
