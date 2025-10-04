import "react";
import assets from "../assets/assets";

const ContactUs = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 py-20"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      <div className="max-w-3xl bg-white bg-opacity-90 p-10 rounded-3xl shadow-xl text-center">
        {/* Title */}
        <h2 className="text-5xl font-extrabold text-yellow-500 mb-8">
          Contact Us
        </h2>

        {/* Introduction */}
        <p className="text-gray-700 text-lg mb-10 leading-relaxed">
          Have questions or need guidance? Our team at{" "}
          <span className="text-yellow-500 font-semibold">
            Siddhivinayak Astro
          </span>{" "}
          is here to help! Reach out to us anytime for astrology consultations,
          spiritual remedies, or any inquiries.
        </p>

        {/* Legal Name Section */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            SV ASTRO PRIVATE LIMITED
          </h3>
          <p className="text-gray-900 font-medium">SV ASTRO Private Limited</p>
        </div>

        {/* Contact Details */}
        <div className="mb-10 text-gray-700 space-y-4">
          <p className="text-lg">
            📍 <strong>Address:</strong> 505-506, BUILDING NO 3 HIGHLAND
            BUILDING, LOKHANDWALA TOWNSHIP Kandivali East Maharashtra 400101
            Kandivali East Mumbai India
          </p>
          <p className="text-lg">
            📞 <strong>Phone:</strong> 2269010407
          </p>
          <p className="text-lg">
            📧 <strong>Email:</strong> siddhivinayakastroworld@gmail.com
          </p>
          <p className="text-lg">
            🌍 <strong>Website:</strong> www.siddhivinayakastro.com
          </p>
          <p className="text-lg">
            🌍 <strong>Website:</strong> www.siddhivinayakastro.in
          </p>
        </div>

        {/* Business Hours */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Business Hours
          </h3>
          <ul className="text-gray-700 space-y-2 text-lg leading-relaxed">
            <li>
              🕘 <strong>Monday - Friday:</strong> 9:00 AM – 7:00 PM
            </li>
            <li>
              🕙 <strong>Saturday - Sunday:</strong> 10:00 AM – 5:00 PM
            </li>
            <li>
              📅 <strong>Holidays:</strong> Closed on major festivals
            </li>
          </ul>
        </div>

        {/* Social Media Links */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Connect with Us
          </h3>
          <div className="flex justify-center space-x-10 text-4xl">
            <a
              href="https://www.facebook.com/people/Siddhivinayak-Astro/pfbid02b4zzioDRA3wVwoEVc6BfsAZrwUcitAV77EgmjnhjMUyxdQrAyXEdcVBJGtWHRsxnl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition"
              aria-label="Facebook"
            >
              🔵
            </a>
            <a
              href="https://www.instagram.com/siddhivinayak_astro/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-800 transition"
              aria-label="Instagram"
            >
              📷
            </a>
            <a
              href="https://x.com/SiddhiVinayak33?fbclid=PAZXh0bgNhZW0CMTEAAafw5OTwShZXhtYLOLLMmhCtt8-OufxNYb9-URSzA268YteVMGZ_4v2-qmcfqg_aem_yFpRzZKhd46ZofmI8TYyEg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-600 transition"
              aria-label="Twitter"
            >
              🐦
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
