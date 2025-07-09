import assets from "../assets/assets";

const PrivacyPolicy = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 py-12"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      <div className="max-w-4xl bg-white p-10 rounded-2xl shadow-lg mt-16 md:mt-24">
        <h2 className="text-4xl font-bold text-yellow-500 text-center mb-6">
          Privacy Policy
        </h2>

        <p className="text-gray-600 text-lg text-center">
          Welcome to{" "}
          <span className="text-yellow-500 font-semibold">Siddhivinayak Astro</span>.
          We are committed to protecting your privacy. This Privacy Policy outlines
          how we collect, use, share, and protect your personal information when
          you use our website and services.
        </p>

        {/* 1. Collection of Personal Information */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">1. Collection of Personal Information</h3>
          <p className="text-gray-600 mt-3">We collect personal information you provide directly to us when you:</p>
          <ul className="mt-4 space-y-2 text-gray-600 list-disc list-inside">
            <li>Place an order for our services or products.</li>
            <li>Sign up for an account.</li>
            <li>Interact with our customer support team.</li>
            <li>Submit information through forms or surveys.</li>
          </ul>
          <p className="text-gray-600 mt-4 font-semibold">Personal Information we collect includes:</p>
          <ul className="mt-2 space-y-2 text-gray-600 list-disc list-inside">
            <li>Contact Information (name, email address, phone number)</li>
            <li>Order Information (billing/shipping address, payment details)</li>
            <li>Customer Support Information (details you provide during support interactions)</li>
          </ul>
        </div>

        {/* 2. Device Information */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">2. Device Information</h3>
          <p className="text-gray-600 mt-3">
            When you visit our website, we may automatically collect certain information including:
          </p>
          <ul className="mt-2 space-y-2 text-gray-600 list-disc list-inside">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Time zone</li>
            <li>Operating system</li>
            <li>Cookies and other tracking technologies</li>
          </ul>
        </div>

        {/* 3. Order Information */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">3. Order Information</h3>
          <p className="text-gray-600 mt-3">
            We collect information necessary to process your order such as contact details,
            payment information, and shipping address.
          </p>
        </div>

        {/* 4. Customer Support Information */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">4. Customer Support Information</h3>
          <p className="text-gray-600 mt-3">
            When you contact our support, we collect relevant information including:
          </p>
          <ul className="mt-2 space-y-2 text-gray-600 list-disc list-inside">
            <li>Email exchanges</li>
            <li>Details provided during chat or phone support</li>
          </ul>
        </div>

        {/* 5. Minors */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">5. Minors</h3>
          <p className="text-gray-600 mt-3">
            Our services are not intended for individuals under 18. We do not knowingly collect data
            from minors. If discovered, we will delete the data.
          </p>
        </div>

        {/* 6. Sharing of Personal Information */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">6. Sharing of Personal Information</h3>
          <p className="text-gray-600 mt-3">
            We may share your personal data with:
          </p>
          <ul className="mt-2 space-y-2 text-gray-600 list-disc list-inside">
            <li>Service providers (payment, shipping, IT, marketing)</li>
            <li>Legal authorities if required</li>
            <li>New entities in the event of a business transfer</li>
          </ul>
          <p className="text-gray-600 mt-2">We do not sell or rent your information to third parties.</p>
        </div>

        {/* 7. Behavioural Advertising */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">7. Behavioural Advertising</h3>
          <p className="text-gray-600 mt-3">
            We use personal data for targeted advertising, including retargeting and
            personalized promotions. You can opt out via your browser or ad preferences.
          </p>
        </div>

        {/* 8. Using Personal Information */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">8. Using Personal Information</h3>
          <p className="text-gray-600 mt-3">
            We use your data to:
          </p>
          <ul className="mt-2 space-y-2 text-gray-600 list-disc list-inside">
            <li>Fulfill orders and provide support</li>
            <li>Send updates, offers, and notifications</li>
            <li>Improve our services and site performance</li>
            <li>Meet legal requirements</li>
          </ul>
        </div>

        {/* 9. Lawful Basis for Processing */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">9. Lawful Basis for Processing</h3>
          <p className="text-gray-600 mt-3">
            We process your data under:
          </p>
          <ul className="mt-2 space-y-2 text-gray-600 list-disc list-inside">
            <li>Consent</li>
            <li>Contractual necessity</li>
            <li>Legal obligation</li>
            <li>Legitimate interests (e.g., fraud detection, improvement)</li>
          </ul>
        </div>

        {/* 10. Retention of Personal Information */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">10. Retention of Personal Information</h3>
          <p className="text-gray-600 mt-3">
            We retain your data only as long as necessary for our services or legal obligations.
            When no longer required, we securely delete it.
          </p>
        </div>

        {/* 11. Cookies */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">11. Cookies</h3>
          <p className="text-gray-600 mt-3">
            We use cookies for session management, preferences, and analytics.
            You may adjust your browser settings to control cookie behavior.
          </p>
        </div>

        {/* 12. Changes to This Policy */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">12. Changes to This Policy</h3>
          <p className="text-gray-600 mt-3">
            We may update this policy periodically. Changes will be reflected by the updated date and, when significant, notified directly to users.
          </p>
        </div>

        {/* 13. Contact Us */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">13. Contact Us</h3>
          <p className="text-gray-600 mt-3">For any concerns or questions, reach out to us:</p>
          <p className="text-gray-600 mt-2">
            📧 Email: <span className="text-yellow-500">privacy@siddhivinayakastro.com</span>
          </p>
        </div>

        {/* Footer Note */}
        <div className="mt-10 text-center">
          <p className="text-gray-600 text-lg">
            By using our services, you agree to this Privacy Policy.
          </p>
          <p className="text-gray-600 text-lg mt-2">
            Thank you for trusting <span className="text-yellow-500 font-semibold">Siddhivinayak Astro</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
