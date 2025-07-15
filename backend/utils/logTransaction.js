// utils/logTransaction.js
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
  paymentTime,    // ISO string from webhook
}) => {
  const query = `
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
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
    paymentTime,    // now bound correctly
  ];
  await pgPool.query(query, values);
};
