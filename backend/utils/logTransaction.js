import pgPool from "../config/postgresDb.js";

export const logTransactionToPostgres = async ({
  orderId,
  cfOrderId,
  cfPaymentId,
  status,
  amount,
  currency,
  method,
  signature,
  email,
  phone,
  paymentTime,
}) => {
  try {
    // 🔁 Check if payment already exists
    const checkQuery = `SELECT 1 FROM transactions WHERE cf_payment_id = $1 LIMIT 1`;
    const checkResult = await pgPool.query(checkQuery, [cfPaymentId]);

    if (checkResult.rowCount > 0) {
      console.log("ℹ️ Transaction already logged in Postgres:", cfPaymentId);
      return;
    }

    const insertQuery = `
      INSERT INTO transactions (
        order_id,
        cf_order_id,
        cf_payment_id,
        status,
        amount,
        currency,
        payment_method,
        email,
        phone,
        signature,
        payment_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    const values = [
      orderId,
      cfOrderId,
      cfPaymentId,
      status,
      amount,
      currency,
      method,
      email,
      phone,
      signature,
      paymentTime || new Date().toISOString(),
    ];

    await pgPool.query(insertQuery, values);
    console.log("✅ Transaction logged to Postgres:", cfPaymentId);

  } catch (err) {
    console.error("❌ Error logging transaction to Postgres:", err);
    throw err; // Let caller handle the failure
  }
};
