import  "react";
import assets from "../assets/assets";

const Partners = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6" style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}>
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-100 mb-6">Our Trusted Partners</h1>
        <p className="text-lg text-blue-100  mb-12"><b>
          We collaborate with renowned organizations to bring you the best astrological services
          and spiritual products. Our partners help us ensure quality, authenticity, and reliability.</b>
        </p>
      </div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {/* Partner 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <img src="/path-to-partner-logo1.png" alt="Partner 1" className="mx-auto h-20 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Partner Name 1</h3>
          <p className="text-gray-500">Leading provider of Vedic astrology tools and services.</p>
        </div>

        {/* Partner 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <img src="/path-to-partner-logo2.png" alt="Partner 2" className="mx-auto h-20 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Partner Name 2</h3>
          <p className="text-gray-500">Expert in gemstone and spiritual artifacts.</p>
        </div>

        {/* Partner 3 */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <img src="/path-to-partner-logo3.png" alt="Partner 3" className="mx-auto h-20 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Partner Name 3</h3>
          <p className="text-gray-500">Trusted online platform for astrology consultations.</p>
        </div>
      </div>
    </div>
  );
};

export default Partners;
