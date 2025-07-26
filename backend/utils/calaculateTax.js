function calculateWithdrawDetails(amount) {
  // You may move this to a config or DB table
  const payoutFeeFlat = 20; // e.g. INR 20 per payout
  const tdsPct = 0.05;      // e.g. 5% TDS, as per Indian regulations (if applicable)
  // GST on payout fee, if your payout provider adds (check your contract with Razorpay etc)
  const gstPct = 0.18;      // GST on payout fee, 18%

  const tds = amount * tdsPct;                     // 5% of withdrawal amount
  const payoutFee = payoutFeeFlat;                 
  const payoutFeeGst = payoutFee * gstPct;         
  const totalDeductions = tds + payoutFee + payoutFeeGst;
  const netPayout = amount - totalDeductions;

  return {
    tds,
    payoutFee,
    payoutFeeGst,
    totalDeductions,
    netPayout
  };
}

export default calculateWithdrawDetails;