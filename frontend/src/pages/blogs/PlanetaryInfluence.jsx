import { Link } from "react-router-dom";
import assets from "../../assets/assets";
import BlogNavbar from "./BlogNavbar";
import { useEffect } from "react";

const PlanetaryInfluence = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <BlogNavbar />
      <div className="min-h-screen bg-gray-900 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-center text-yellow-400 mb-4">
            Planetary Influence in Astrology
          </h1>
          <img
            src={assets.GalaxyBackground}
            alt="Planets"
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
          <p className="text-lg mb-4">
            Astrology is deeply rooted in the movement of planets and their impact on human lives.
            Each planet holds a unique significance, governing different aspects of personality, behavior, and fate.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mb-3">The Role of Planets</h2>
          <p className="mb-4">
            The nine celestial bodies in astrology—Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, and Ketu—each influence different dimensions of life.
          </p>
          <ul className="list-disc list-inside text-gray-300">
            <li><strong>Sun:</strong> Represents the self, ego, and vitality.</li>
            <li><strong>Moon:</strong> Governs emotions, intuition, and subconscious mind.</li>
            <li><strong>Mercury:</strong> Influences communication, intelligence, and reasoning.</li>
            <li><strong>Venus:</strong> Rules love, beauty, and harmony.</li>
            <li><strong>Mars:</strong> Represents energy, passion, and determination.</li>
            <li><strong>Jupiter:</strong> Governs wisdom, luck, and expansion.</li>
            <li><strong>Saturn:</strong> Symbolizes discipline, karma, and structure.</li>
            <li><strong>Rahu:</strong> Associated with ambitions, illusions, and material gains.</li>
            <li><strong>Ketu:</strong> Represents detachment, spirituality, and past life karma.</li>
          </ul>
          <h2 className="text-2xl font-semibold text-yellow-300 mt-6 mb-3">Planetary Transits & Their Impact</h2>
          <p className="mb-4">
            Planetary movements or transits can bring shifts in personal and global events. Retrogrades, conjunctions,
            and eclipses are closely observed by astrologers to interpret changes in fortune, challenges, and opportunities.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mt-6 mb-3">How Planets Affect Career & Relationships</h2>
          <p className="mb-4">
            Each planet has a role in shaping an individual’s career and personal life. For instance:
          </p>
          <ul className="list-disc list-inside text-gray-300">
            <li><strong>Sun:</strong> Leadership and career growth, especially in authoritative positions.</li>
            <li><strong>Moon:</strong> Emotional well-being and harmony in personal relationships.</li>
            <li><strong>Mercury:</strong> Success in business, writing, and intellectual pursuits.</li>
            <li><strong>Venus:</strong> Love life, creativity, and financial prosperity.</li>
            <li><strong>Mars:</strong> Career in military, sports, and areas requiring aggression and determination.</li>
            <li><strong>Jupiter:</strong> Brings opportunities in education, law, and spiritual growth.</li>
            <li><strong>Saturn:</strong> Teaches patience and rewards hard work in long-term commitments.</li>
          </ul>
          <h2 className="text-2xl font-semibold text-yellow-300 mt-6 mb-3">How to Work with Planetary Energies</h2>
          <p className="mb-4">
            Understanding planetary influences can help navigate life with greater awareness. Remedies like meditation,
            chanting mantras, and wearing specific gemstones are believed to balance planetary effects.
          </p>
          <p className="mb-4">
            For example, wearing a blue sapphire is said to strengthen Saturn’s positive influence, while a ruby is linked
            to the Sun’s power. Mantras like the Gayatri Mantra (for Sun) and Om Namah Shivaya (for Saturn) can also
            enhance planetary alignment.
          </p>
          <h2 className="text-2xl font-semibold text-yellow-300 mt-6 mb-3">Conclusion</h2>
          <p className="mb-4">
            Planets are cosmic guides that shape our destinies. By understanding their influence, we can harness their energy
            for personal and spiritual growth. Whether you’re looking to improve your career, relationships, or overall
            well-being, planetary wisdom offers invaluable insights.
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

export default PlanetaryInfluence;
