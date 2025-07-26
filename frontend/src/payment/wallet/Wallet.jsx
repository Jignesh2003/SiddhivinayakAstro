import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal state for Add Money
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Cashfree SDK
  const [cashfreeInstance, setCashfreeInstance] = useState(null);

  const token = useAuthStore((state) => state.token);

  // Load Cashfree SDK (ONE TIME)
  useEffect(() => {
    if (window.Cashfree) {
      setCashfreeInstance(window.Cashfree({ mode: "sandbox" }));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        setCashfreeInstance(window.Cashfree({ mode: "sandbox" }));
      }
    };
    script.onerror = () => alert("Failed to load Cashfree SDK");
    document.body.appendChild(script);
  }, []);

  // Fetch wallet & txns
  async function fetchWalletData() {
    setLoading(true);
    try {
      const [walletRes, txnsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_PAYMENT_URL}/wallet/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_PAYMENT_URL}/wallet/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setBalance(walletRes.data.wallet?.balance ?? 0);
      setCurrency(walletRes.data.wallet?.currency ?? "INR");
      setTransactions(txnsRes.data.transactions ?? []);
    } catch (err) {
      console.error("Wallet error:", err);
      alert("Error loading wallet. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchWalletData();
  }, [token]);

  // Add money UI
  const handleOpenAddModal = () => {
    setAddAmount("");
    setShowAddModal(true);
  };

  // Add money flow
  const handleSubmitAddMoney = async (e) => {
    e.preventDefault();
    const amount = Number(addAmount);
    if (!amount || amount < 1) {
      alert("Minimum amount is ₹1");
      return;
    }
    setAddLoading(true);
    try {
      // Backend starts top-up order and returns payment session ID
      const res = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/wallet/initiateTopUp`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { payment_session_id } = res.data;
      setShowAddModal(false);

      if (!payment_session_id || !cashfreeInstance) throw new Error("Payment environment not ready");

      // Start Cashfree checkout
      cashfreeInstance.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
        onSuccess: () => {
          // User completed payment (optional: poll for confirmation)
          fetchWalletData();
        },
        onFailure: () => {
          alert("Payment cancelled or failed.");
        }
      });

      // NOTE: Your server/webhook must update wallet, and the UI can poll/refetch after user returns
      setTimeout(fetchWalletData, 7000); // Poll for payment result after a few seconds

    } catch (err) {
      alert(err.response?.data?.message || "Failed to initiate top-up");
      console.error("Add money error:", err);
    } finally {
      setAddLoading(false);
    }
  };

  // Withdraw: future flow
  const handleWithdraw = () => {
    alert("Withdrawal flow coming soon!");
  };

  // Helper for transaction label and color
  function txnLabel(txn) {
    if (!txn) return "";
    // Prefer business_type if present, otherwise fallback to direction
    if (txn.business_type)
      return txn.business_type.replaceAll("_", " ");
    return txn.direction || txn.type || "";
  }
  function txnClass(txn) {
    // 'credit' = money in, green; 'debit' = out, red
    return txn.direction === "credit" ? "text-green-600" : "text-red-500";
  }
  function txnSign(txn) {
    return txn.direction === "credit" ? "+" : "-";
  }

  // loading state
  if (loading)
    return (
      <div className="text-center mt-12 text-lg text-gray-500">Loading wallet...</div>
    );

  return (
    <div className="w-full max-w-md mx-auto mt-8 bg-white rounded-lg shadow-md p-6 relative">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">My Wallet</h2>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-semibold text-gray-900">
            {currency} {Number(balance).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Available Balance</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenAddModal}
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

      {/* Add Money Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-6 min-w-[300px]">
            <h4 className="text-lg font-bold mb-2">Add Money to Wallet</h4>
            <form onSubmit={handleSubmitAddMoney}>
              <label className="block mb-2">Amount (INR)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="border rounded px-3 py-2 w-full mb-4"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                required
                disabled={addLoading}
                placeholder="Enter amount (e.g. 100)"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-50"
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={addLoading}
                >
                  {addLoading ? "Processing..." : "Proceed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <hr className="my-4" />
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Recent Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="text-gray-600 bg-gray-100">
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Label</th>
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
                  <td className="py-2 px-2">
                    {new Date(txn.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-2 px-2">
                    <span className="capitalize">{txnLabel(txn)}</span>
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${txnClass(txn)}`}>
                    {txnSign(txn)} {currency} {Number(txn.amount).toFixed(2)}
                  </td>
                  <td className="py-2 px-2 capitalize">
                    {txn.status}
                  </td>
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
