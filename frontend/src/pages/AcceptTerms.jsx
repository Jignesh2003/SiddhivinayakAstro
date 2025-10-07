import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const AcceptTerms = () => {
    const navigate = useNavigate();
    const { token } = useAuthStore.getState();

    const handleAccept = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/accept-terms`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate("/products");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-semibold mb-4">Please Accept Terms & Conditions</h2>
            <button
                onClick={handleAccept}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded"
            >
                I Agree
            </button>
        </div>
    );
};

export default AcceptTerms;
