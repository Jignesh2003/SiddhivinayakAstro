import assets from "../assets/assets";

const ShippingDeliveryPolicy = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-100 px-6 py-12"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})`, backgroundSize: "cover" }}
    >
      <div className="max-w-4xl bg-white p-10 rounded-2xl shadow-lg mt-24">
        <h2 className="text-4xl font-bold text-yellow-500 text-center mb-6">
          Shipping & Delivery Policy
        </h2>
        <p className="text-gray-600 text-lg mb-4 text-center">
          Welcome to <span className="text-yellow-500 font-semibold">Siddhivinayak Astro</span>.
          Here is how our digital deliveries work:
        </p>
        <div className="text-gray-700 space-y-4 text-lg">
          <p>
            All services and products sold through our platform are digital in nature.
            These include Kundli reports, astrological predictions, and consultations.
            As such, there is no physical shipping involved.
          </p>
          <p>
            Typical delivery time for reports or personalized services is between{" "}
            <strong>1 to 3 business days</strong> from the order date.
          </p>
          <p>
            In case of live consultations, the time slot will be confirmed via email or phone.
            Please ensure your contact details are accurate when placing the order.
          </p>
          <p>
            If you have not received your service within the expected timeframe,
            kindly reach out to us at:{" "}
            <a href="mailto:support@siddhivinayakastro.com" className="text-blue-600 underline">
              support@siddhivinayakastro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingDeliveryPolicy;
