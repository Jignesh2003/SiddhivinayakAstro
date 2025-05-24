import  "react";
import assets from "../assets/assets";

const ContactUs = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 py-12" style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}>
      <div className="max-w-4xl bg-white p-10 rounded-2xl shadow-lg mt-16 md:mt-24">
        {/* Title */}
        <h2 className="text-4xl font-bold text-yellow-500 text-center mb-6">
          Contact Us
        </h2>

        {/* Introduction */}
        <p className="text-gray-600 text-lg text-center">
          Have questions or need guidance? Our team at{" "}
          <span className="text-yellow-500 font-semibold"> Siddhivinayak Astro </span>  
          is here to help! Feel free to reach out to us for astrology consultations,  
          spiritual remedies, or any inquiries.
        </p>

        {/* Contact Details */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">Our Contact Information</h3>
          <div className="mt-4 space-y-3 text-gray-600">
            <p>📍 <strong>Address:</strong> 123 Spiritual Lane, Pune, India</p>
            <p>📞 <strong>Phone:</strong> +91 98765 43210</p>
            <p>📧 <strong>Email:</strong> support@siddhivinayakastro.com</p>
            <p>🌍 <strong>Website:</strong> www.siddhivinayakastro.com</p>
          </div>
        </div>

        {/* Business Hours */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">Business Hours</h3>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li>🕘 <strong>Monday - Friday:</strong> 9:00 AM – 7:00 PM</li>
            <li>🕙 <strong>Saturday - Sunday:</strong> 10:00 AM – 5:00 PM</li>
            <li>📅 <strong>Holidays:</strong> Closed on major festivals</li>
          </ul>
        </div>

        {/* Contact Form */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">Send Us a Message</h3>
          <p className="text-gray-600 mt-3">
            Fill out the form below, and we&apos;ll get back to you as soon as possible.
          </p>
          <form className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              type="email"
              placeholder="Your Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <textarea
              placeholder="Your Message"
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-yellow-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-yellow-600 transition"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Social Media Links */}
        <div className="mt-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-700">Connect with Us</h3>
          <p className="text-gray-600 mt-3">Follow us on social media for updates:</p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="https://facebook.com" className="text-blue-600 text-3xl hover:text-blue-800">
              🔵 Facebook
            </a>
            <a href="https://instagram.com" className="text-pink-600 text-3xl hover:text-pink-800">
              📷 Instagram
            </a>
            <a href="https://twitter.com" className="text-blue-400 text-3xl hover:text-blue-600">
              🐦 Twitter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
