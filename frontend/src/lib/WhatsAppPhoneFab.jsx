    // WhatsAppPhoneFAB.jsx
// --- Update these paths to your actual image files ---
import assets from "../assets/assets.js"

// Edit these values as needed
const WHATSAPP_NUMBER = "+919799993488";
const PHONE_NUMBER = +912269010407;
const WHATSAPP_TEXT = encodeURIComponent("Hi");

const fabStyles = {
  position: "fixed",
  bottom: "50px",
  right: "20px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const iconStyles = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  background: "#25D366",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  fontSize: "30px",
  cursor: "pointer",
  transition: "background .2s",
  border: "none",
  outline: "none",
  overflow: "hidden",
};

const phoneIconStyles = {
  ...iconStyles,
  background: "#25D366",
};

const imgStyles = {
  width: "32px",
  height: "32px",
  objectFit: "contain",
  display: "block",
};

export default function WhatsAppPhoneFAB() {
  return (
    <div style={fabStyles}>
      {/* WhatsApp Icon */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER.replace(
          /[^0-9]/g,
          ""
        )}?text=${WHATSAPP_TEXT}`}
        target="_blank"
        rel="noopener noreferrer"
        style={iconStyles}
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <img src={assets.WhatsAppIcon} alt="WhatsApp" style={imgStyles} />
      </a>
      {/* Phone Icon */}
      <a
        href={`tel:${PHONE_NUMBER}`}
        style={phoneIconStyles}
        title="Call Now"
        aria-label="Call Now"
      >
        <img src={assets.PhoneIcon} alt="Phone" style={imgStyles} />
      </a>
    </div>
  );
}
