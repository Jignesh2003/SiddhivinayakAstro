import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);


  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      try {
        const walletRes = await axios.get(`${import.meta.env.VITE_PAYMENT_URL}/wallet/me`, {headers:{Authorization:`Bearer ${token}`}});
        setBalance(walletRes.data.balance);
        setCurrency(walletRes.data.currency);

        const txnsRes = await axios.get(`${import.meta.env.VITE_PAYMENT_URL}/wallet/transactions`, {headers : {Authorization :`Bearer ${token}`}});
        setTransactions(txnsRes.data);
      } catch (err) {
        console.error("Wallet error:", err);
        alert("Error loading wallet. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const handleAddMoney = () => {
    alert("Redirecting to payment...");
  };

  const handleWithdraw = () => {
    alert("Withdrawal flow coming soon!");
  };

  if (loading) return <div className="text-center mt-12 text-lg text-gray-500">Loading wallet...</div>;

  return (
    <div className="w-full max-w-md mx-auto mt-8 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">My Wallet</h2>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-semibold text-gray-900">
            {currency} {Number(balance.toFixed(2))}
          </div>
          <div className="text-sm text-gray-500">Available Balance</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAddMoney}
            className="px-4 py-2 rounded bg-green-500 text-white font-medium hover:bg-green-600 transition"
          >
            Add Money
          </button>
          <button
            onClick={handleWithdraw}
            className="px-4 py-2 rounded bg-blue-500 text-white font-medium hover:bg-blue-600 transition"
          >
            Withdraw
          </button>
        </div>
      </div>
      <hr className="my-4" />
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Recent Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="text-gray-600 bg-gray-100">
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2 text-right">Amount</th>
              <th className="py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4">
                  No transactions
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn.id} className="border-b last:border-b-0">
                  <td className="py-2 px-2">{new Date(txn.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-2">{txn.type}</td>
                  <td
                    className={`py-2 px-2 text-right ${
                      txn.type === "credit" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {currency} {txn.amount.toFixed(2)}
                  </td>
                  <td className="py-2 px-2">{txn.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Wallet;
