import React from "react";
import { useLocation } from "react-router-dom";

const MatchingCompatiblityResult = () => {
  const location = useLocation();
  const data = location.state?.result;

  if (!data) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        ❌ No data found. Please go back and try again.
      </div>
    );
  }

  const matchData = data?.data || {};
  const ashta = matchData?.ashta_koota || {};

  const total = ashta?.total_points || 0;
  const max = ashta?.max_points || 36;

  let verdict = "Poor Match ❌";
  if (total >= 30) verdict = "Excellent Match 💯";
  else if (total >= 24) verdict = "Good Match 👍";
  else if (total >= 18) verdict = "Average Match ⚖️";

  return (
    <div style={{ padding: "20px" }}>
      <h2>💑 Kundli Matching Result</h2>

      <h3>
        Score: {total} / {max}
      </h3>

      <p>
        <strong>Verdict:</strong> {verdict}
      </p>

      <h3>Details:</h3>
      <pre>{JSON.stringify(matchData, null, 2)}</pre>
    </div>
  );
};

export default MatchingCompatiblityResult;