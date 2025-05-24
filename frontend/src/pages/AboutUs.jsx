import  "react";
import assets from "../assets/assets";

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 py-12" style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}>
      <div className="max-w-5xl bg-white p-10 rounded-2xl shadow-lg mt-16 md:mt-24">
        {/* Title */}
        <h2 className="text-4xl font-bold text-yellow-500 text-center mb-6">
          About Siddhivinayak Astro
        </h2>

        {/* Introduction */}
        <p className="text-gray-600 text-lg text-center">
          <span className="text-yellow-500 font-semibold">Siddhivinayak Astro</span>  
          is your trusted guide in the mystical world of **Vedic astrology**.  
          We bring together ancient wisdom and modern technology to help  
          individuals find clarity, peace, and direction in their lives.
        </p>

        {/* Our Story */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">Our Story</h3>
          <p className="text-gray-600 mt-3">
            Founded with the belief that the universe holds answers to our deepest  
            questions, Siddhivinayak Astro was born to **bridge the gap** between  
            astrology and everyday life.  
          </p>
          <p className="text-gray-600 mt-2">
            Whether you seek insights into **career, relationships, finance, or health**,  
            our expert astrologers and personalized reports help you navigate life&apos;s  
            challenges with confidence.
          </p>
        </div>

        {/* Why Choose Us? */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">Why Choose Us?</h3>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li>🔮 <strong>Authentic Astrology Services</strong> – Rooted in ancient Vedic principles.</li>
            <li>📜 <strong>Personalized Horoscope Readings</strong> – Based on your birth details.</li>
            <li>🛍️ <strong>Spiritual Store</strong> – High-quality gemstones, yantras, and remedies.</li>
            <li>🔐 <strong>Secure & Confidential</strong> – Your privacy is our top priority.</li>
            <li>💬 <strong>Expert Astrologers</strong> – Handpicked professionals with deep knowledge.</li>
          </ul>
        </div>

        {/* Our Vision & Mission */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">Our Vision & Mission</h3>
          <p className="text-gray-600 mt-3">
            We aim to make astrology accessible to everyone, providing accurate,  
            ethical, and insightful guidance to help individuals **align their lives**  
            with cosmic energies.
          </p>
          <p className="text-gray-600 mt-2">
            Our mission is to **empower you** with wisdom, clarity, and confidence  
            through detailed astrological insights and powerful spiritual remedies.
          </p>
        </div>

        {/* Services We Offer */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">Services We Offer</h3>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li>🌓 <strong>Daily, Weekly & Monthly Horoscopes</strong></li>
            <li>✨ <strong>Kundali (Birth Chart) Analysis</strong></li>
            <li>🔮 <strong>Personalized Astrology Consultations</strong></li>
            <li>🛍️ <strong>Astrological Remedies & Vedic Pooja Services</strong></li>
            <li>💍 <strong>Gemstone & Rudraksha Recommendations</strong></li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="mt-10 text-center">
          <p className="text-gray-700 text-lg font-semibold">
            ✨ Embrace Your Destiny – The Universe is Listening! ✨
          </p>
          <p className="text-gray-600 mt-3">
            Ready to unlock the secrets of your future? <br />
            Explore our astrology services and let the stars guide you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
