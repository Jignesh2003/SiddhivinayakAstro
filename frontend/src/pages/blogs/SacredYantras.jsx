import { Link } from "react-router-dom";
import assets from "../../assets/assets";
import BlogNavbar from "./BlogNavbar";
import { useEffect } from "react";

const SacredYantras = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <BlogNavbar />
      <div className="min-h-screen bg-gray-900 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-center text-yellow-400 mb-4">
            The Power of Sacred Mantras
          </h1>
          <img
            src={assets.gifts}
            alt="Sacred Mantras"
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
          <p className="text-lg mb-4">
            Mantras have been an integral part of spiritual practices across cultures for centuries.
            These sacred sounds hold deep vibrational energy, aligning the mind, body, and spirit with the universe.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">What is a Mantra?</h2>
          <p className="mb-4">
            A mantra is a sacred word, phrase, or sound repeated to aid concentration in meditation.
            The vibrations of the mantra influence energy fields, promoting healing, clarity, and spiritual growth.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">Popular Sacred Mantras</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Om (ॐ):</strong> The universal sound, representing the essence of the universe.</li>
            <li><strong>Gayatri Mantra:</strong> A powerful Vedic chant for enlightenment and wisdom.</li>
            <li><strong>Maha Mrityunjaya Mantra:</strong> A chant for protection and healing.</li>
            <li><strong>Om Mani Padme Hum:</strong> A Buddhist mantra for compassion and purification.</li>
          </ul>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">Benefits of Chanting Mantras</h2>
          <p className="mb-4">
            Regular mantra chanting helps in reducing stress, improving concentration, and enhancing spiritual well-being.
            It connects individuals with higher consciousness, leading to inner peace and harmony.
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

export default SacredYantras;
