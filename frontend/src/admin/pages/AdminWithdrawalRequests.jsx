import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore"; // Or your admin/session auth hook

function AdminWithdrawalRequests() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState(""); // ""=all, "pending", "completed", etc
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(30);
  const [error, setError] = useState("");

  const token = useAuthStore((s) => s.token);

  // Fetch withdrawals with filters
  async function fetchWithdrawals() {
    setLoading(true);
    setError("");
    try {
      const params = {
        limit,
        offset: page * limit,
      };
      if (status) params.status = status;
      const res = await axios.get(
        `${import.meta.env.VITE_PAYMENT_URL}/admin/withdrawals/requests`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setWithdrawals(res.data.withdrawals || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // On status change or paging
  useEffect(() => {
    if (token) fetchWithdrawals();
    // eslint-disable-next-line
  }, [token, page, status]);

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white rounded shadow-xl p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-indigo-700">Wallet Withdrawal Requests</h1>
        <div className="flex gap-2 items-center">
          <label>Status:</label>
          <select
            className="border px-2 py-1 rounded"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <button
            onClick={fetchWithdrawals}
            className="ml-4 px-3 py-1 rounded bg-gray-100 hover:bg-indigo-100 text-indigo-600 border"
          >
            Refresh
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-12 text-lg">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 mb-4">{error}</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm text-left border">
            <thead>
              <tr className="bg-indigo-50">
                <th className="px-3 py-2">Txn ID</th>
                <th className="px-3 py-2">User ID</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Meta (breakdown)</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-gray-400">
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                withdrawals.map((wd) => (
                  <tr key={wd.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-3 py-2">{wd.id}</td>
                    <td className="px-3 py-2">{wd.from_user_id}</td>
                    <td className="px-3 py-2 font-mono">₹{Number(wd.amount).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className={
                        wd.status === "pending"
                          ? "text-orange-500 font-medium"
                          : wd.status === "completed"
                          ? "text-green-600 font-medium"
                          : "text-gray-700"
                      }>
                        {wd.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {new Date(wd.created_at).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2">{wd.description || "-"}</td>
                    <td className="px-3 py-2 max-w-xs truncate">
                      <details>
                        <summary className="text-blue-700 cursor-pointer select-none">View</summary>
                        <pre className="whitespace-pre-wrap break-all text-xs mt-1 bg-gray-50 p-2 rounded">
                          {JSON.stringify(wd.meta, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage(Math.max(page - 1, 0))}
              disabled={page === 0}
              className="px-3 py-1 rounded bg-gray-100 border text-gray-700 mr-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-gray-700 font-semibold">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={withdrawals.length < limit}
              className="px-3 py-1 rounded bg-gray-100 border text-gray-700 ml-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWithdrawalRequests;
