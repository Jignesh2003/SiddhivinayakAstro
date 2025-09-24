import assets from "../assets/assets";

const CancellationRefundPolicy = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-100 px-6 py-12"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
      }}
    >
      <div className="max-w-4xl bg-white p-10 rounded-2xl shadow-lg mt-24 overflow-y-auto max-h-[90vh]">
        <h2 className="text-4xl font-bold text-yellow-500 text-center mb-6">
          Exchange, Return & Cancellation Policy
        </h2>

        {/* Returns */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">Returns</h3>
          <p className="text-gray-700 mb-3">
            We are thrilled to provide a 3-day return policy. You will be
            provided with a credit note and please be aware that we do not offer
            refunds. We charge a fee of ₹80 for Return and reverse logistics.
            However, for missing or damaged products, you must report us within
            24 hours.
          </p>
          <p className="text-gray-700 mb-3">
            Please be aware that we currently do not offer free shipping on
            international returns.
          </p>

          <h4 className="font-semibold text-gray-800 mt-4 mb-2">
            To qualify for a return:
          </h4>
          <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
            <li>
              Return request must be made within 3 days of receiving the item.
            </li>
            <li>All tags must be intact, and items must be brand-new.</li>
            <li>
              Original invoice, packing, and tags must be intact with the
              packaging.
            </li>
            <li>The product should have no blemishes or defects.</li>
            <li>Product embellishments must be in good condition.</li>
          </ul>

          <h4 className="font-semibold text-gray-800 mt-4 mb-2">
            Returns won’t be feasible if:
          </h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>The return request is outside the allotted time frame.</li>
            <li>Any item(s) included in the shipment are missing.</li>
            <li>Damage caused by misuse of the product.</li>
            <li>
              Any item that has been used and opened unless damaged when
              received.
            </li>
            <li>
              Items received with free gifts cannot be returned without the
              complimentary items.
            </li>
            <li>
              Individual items from promotional packages cannot be returned or
              reimbursed.
            </li>
            <li>
              Sale items or those purchased using credit notes cannot be
              returned.
            </li>
            <li>Items sent back without prior return request.</li>
          </ul>

          <p className="text-gray-700 mt-4">
            We retain the right to deny the return if we determine that the
            product does not meet the above parameters.
          </p>
        </section>

        {/* Return Process */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            Return Process
          </h3>
          <p className="text-gray-700 mb-3">
            When you're certain you want to return a product, WhatsApp us on{" "}
            <strong className="text-yellow-600">+917738067976</strong>{" "}
            immediately. Include your order number, the products specifications,
            and a brief explanation for the return. All return requests must be
            made within 3 days after product delivery and must meet all return
            parameters. Our Customer Care team will respond within 24 hours and
            arrange reverse pickup of the product.
          </p>
        </section>

        {/* Damage Policy */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            Damage Policy
          </h3>
          <p className="text-gray-700 mb-3">
            If a product is defective due to manufacturing or shipping, a
            replacement will be provided. Please contact us within 24 hours of
            receiving the product. Note: We do not offer refunds for damaged
            products; only replacements will be arranged.
          </p>
        </section>

        {/* Exchanges */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            Exchanges
          </h3>
          <p className="text-gray-700 mb-3">
            Exchanges are valid only for 3 days post delivery. Products may be
            exchanged as long as they are new, unopened, and in original
            packaging with tags. We charge a fee of ₹80 for exchanges and
            reverse logistics. For further information, contact us on WhatsApp
            at <strong className="text-yellow-600">+917738067976</strong>.
            (Avg`` reply time: 3h)
          </p>
        </section>

        {/* How to use Credit Note */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            How to Use Zeraki Credit Note
          </h3>
          <p className="text-gray-700 mb-3">
            Zeraki Jewels gift card can be applied at the checkout page on our
            website. Apply the code received via email and the amount will be
            deducted from the payable amount. The validity of the gift card is 3
            months.
          </p>
          <p className="text-gray-700">
            For any issues using the gift card code, contact our customer
            service team on WhatsApp at{" "}
            <strong className="text-yellow-600">+917738067976</strong> between
            10 AM to 6 PM (Monday to Saturday).
          </p>
        </section>

        {/* Cancellation */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            Cancellation
          </h3>
          <p className="text-gray-700 mb-3">
            For all COD and prepaid orders, once orders are shipped,
            cancellations are not possible.
          </p>
          <p className="text-gray-700">
            For prepaid orders, gift cards are provided as refunds (bank refunds
            are not available).
          </p>
        </section>

        {/* Customised Jewellery */}
        <section className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">
            Customised Jewellery
          </h3>
          <p className="text-gray-700">
            Customized orders once placed are non-returnable. However, if you
            receive a damaged product, you may mail a picture of the damage to{" "}
            <a
              href="mailto:support@zerakijewels.com"
              className="text-yellow-600 underline"
            >
              support@siddhivinayakastroworld.com
            </a>
            . Our team will verify and resolve the issue by replacing the order
            if damage is confirmed.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;
