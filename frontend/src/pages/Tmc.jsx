import "react";
import assets from "../assets/assets";

const TermsAndConditions = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 py-12"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      <div className="max-w-4xl bg-white p-10 rounded-2xl shadow-lg mt-16 md:mt-24">
        {/* Title */}
        <h2 className="text-4xl font-bold text-yellow-500 text-center mb-6">
          Terms of Service
        </h2>

        {/* Intro */}
        <p className="text-gray-600 text-lg text-center">
          Welcome to <span className="text-yellow-500 font-semibold">SiddhiVinayak Astro</span>, your spiritual partner for astrology insights and sacred products. Please read these Terms of Service carefully before using our platform.
        </p>

        {/* Sections */}
        {[
          {
            title: "1. Acceptance of Terms",
            content:
              "By accessing or using our website, you acknowledge that you have read, understood, and agreed to be bound by these terms. If you do not agree with any part of these terms, please do not use our services.",
          },
          {
            title: "2. Services Provided",
            content:
              "We offer astrology readings, consultations, and a wide range of spiritual products. These are intended to offer spiritual guidance and inspiration, not to replace professional legal, financial, or medical advice.",
          },
          {
            title: "3. User Accounts",
            content:
              "To access services, you may need to create an account. You agree to provide accurate information, safeguard your login details, and are responsible for activity under your account.",
          },
          {
            title: "4. Astrological Insights",
            content:
              "Our consultations are based on traditional practices. Results and experiences vary, and we make no guarantees. Use your judgment in applying any advice received.",
          },
          {
            title: "5. Products & Purchases",
            content:
              "We sell spiritual products. Descriptions and images are for guidance and may not be exact. Prices may change. Payments are final. Refunds are only issued for damaged items reported within 7 days. Contact us at support@siddhivinayakastro.com.",
          },
          {
            title: "6. User Conduct",
            content:
              "You agree not to misuse the platform or engage in illegal activity. Disruptive behavior, unauthorized use, or harmful content will result in termination.",
          },
          {
            title: "7. Intellectual Property",
            content:
              "All content including images, designs, logos, and texts belong to SiddhiVinayak Astro. You may not copy, distribute, or use our intellectual property without permission.",
          },
          {
            title: "8. Disclaimer",
            content:
              "We strive for quality, but services are provided 'as-is'. Astrological results may differ and are not guaranteed. We are not responsible for any reliance on guidance provided.",
          },
          {
            title: "9. Limitation of Liability",
            content:
              "We are not liable for losses arising from use of our services, including personal, emotional, or financial outcomes based on astrology consultations.",
          },
          {
            title: "10. Indemnification",
            content:
              "You agree to indemnify SiddhiVinayak Astro and its team against any legal claims arising from your use of our services or violation of these terms.",
          },
          {
            title: "11. Changes to Terms",
            content:
              "We may update our Terms of Service without notice. Continued use of our services signifies your acceptance of updated terms.",
          },
          {
            title: "12. Governing Law",
            content:
              "These Terms are governed by Indian law. Any disputes shall be handled in the courts of Mumbai, Maharashtra.",
          },
          {
            title: "13. Shipping Policy",
            content:
              "We process and ship orders within 3–5 business days. Delivery times may vary depending on your location and courier service. You will receive tracking details once your order has shipped.",
          },
          {
            title: "14. Cancellation Policy",
            content:
              "Orders once placed cannot be canceled after processing begins. Please review your cart before confirming payment. For urgent cancellations, contact us within 1 hour of placing the order.",
          },
          {
            title: "15. Return & Exchange Policy",
            content:
              "We only accept returns for items that are damaged or incorrect upon delivery. Requests must be submitted within 7 days of delivery with photo proof. We do not accept returns for personalized or spiritual products once used or opened.",
          },
          {
            title: "16. Privacy Policy",
            content:
              "Your data security is important to us. By using our services, you also agree to our Privacy Policy regarding how we collect, store, and use your personal information. Please review it carefully.",
          },
        ].map((section, idx) => (
          <div className="mt-8" key={idx}>
            <h3 className="text-2xl font-semibold text-gray-700">
              {section.title}
            </h3>
            <p className="text-gray-600 mt-3">{section.content}</p>
          </div>
        ))}

        {/* Contact Info */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">
            17. Contact Information
          </h3>
          <p className="text-gray-600 mt-3">
            If you have any questions or concerns, please contact us:
          </p>
          <p className="text-gray-600 mt-2">
            📧 Email:{" "}
            <span className="text-yellow-500">siddhivinayakastroworld@gmail.com</span>
          </p>
          <p className="text-gray-600">
            📞 Phone: <span className="text-yellow-500">+91 ************</span>
          </p>
        </div>

        {/* Footer Acknowledgement */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-lg">
            By using our services, you agree to abide by these Terms of Service.
          </p>
          <p className="text-gray-600 text-lg">
            Thank you for choosing{" "}
            <span className="text-yellow-500 font-semibold">
              SiddhiVinayak Astro
            </span>
            !
          </p>
          <p className="text-gray-500 text-sm mt-6">
            Last updated: April 19, 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
