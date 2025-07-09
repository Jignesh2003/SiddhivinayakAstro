import assets from "../assets/assets";

const CancellationRefundPolicy = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-100 px-6 py-12"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})`, backgroundSize: "cover" }}
    >
      <div className="max-w-4xl bg-white p-10 rounded-2xl shadow-lg mt-24">
        <h2 className="text-4xl font-bold text-yellow-500 text-center mb-6">
          Cancellation & Refund Policy
        </h2>
        <p className="text-gray-600 text-lg mb-4 text-center">
          At <span className="text-yellow-500 font-semibold">Siddhivinayak Astro</span>, we value your trust and aim to ensure your satisfaction.
        </p>
        <div className="text-gray-700 space-y-4 text-lg">
          <p>
            All astrology consultations, Kundli reports, and digital services are non-refundable
            once delivered. These are personalized services, and hence cancellation or refund
            cannot be processed after delivery.
          </p>
          <p>
            If you wish to cancel an order, please contact us within <strong>1 hour</strong> of placing it. 
            After this period, cancellations may not be accepted due to immediate processing.
          </p>
          <p>
            Refunds are only applicable in rare cases such as technical failure or astrologer unavailability. 
            Approved refunds will be processed within <strong>5–7 business days</strong>.
          </p>
          <p>
            For any issues, please contact us at:{" "}
            <a href="mailto:support@siddhivinayakastro.com" className="text-blue-600 underline">
              support@siddhivinayakastro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;
