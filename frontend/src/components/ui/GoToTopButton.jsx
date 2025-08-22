import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function GoToTopButton() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 250);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showTopBtn) return null;
  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-30 right-55 z-50 bg-indigo-700 hover:bg-indigo-900 text-white p-2 rounded-full shadow-lg transition"
      aria-label="Go to top"
    >
      <ArrowUp size={30} />
    </button>
  );
}
