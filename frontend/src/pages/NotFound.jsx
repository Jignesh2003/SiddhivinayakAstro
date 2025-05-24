import { Link } from "react-router-dom";
import assets from "../assets/assets"; // Ensure you have a galaxy background in assets

const NotFound = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage: `url(${assets.HeroSelectionBackground})`,
      }}
    >
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Lost in the Cosmos?</h2>
      <p className="text-lg text-center max-w-md mb-6">
        It looks like you&apos;ve ventured into the unknown. Let&apos;s bring you back to safety.
      </p>
      <Link
        to="/"
        className="bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold hover:bg-purple-900 transition duration-300"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
