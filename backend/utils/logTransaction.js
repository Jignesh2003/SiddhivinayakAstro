// utils/logTransaction.js

import pool from '../config/postgres.js';

export async function logTransactionToPostgres(transactionData) {
  const {
    order_id,
    cf_order_id,
    cf_payment_id,
    status,
    amount,
    currency,
    payment_method,
    payment_time,
    email,
    phone,
    signature,
  } = transactionData;

  try {
    const query = `
      INSERT INTO transactions (
        order_id,
        cf_order_id,
        cf_payment_id,
        status,
        amount,
        currency,
        payment_method,
        payment_time,
        email,
        phone,
        signature
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (cf_payment_id)
      DO NOTHING
    `;

    const values = [
      order_id,
      cf_order_id || null,
      cf_payment_id,
      status,
      amount,
      currency,
      payment_method,
      payment_time,
      email,
      phone,
      signature,
    ];

    const res = await pool.query(query, values);

    if (res.rowCount === 0) {
      console.log(`ℹ️ Transaction already logged in Postgres: ${cf_payment_id}`);
    } else {
      console.log(`✅ Transaction logged to Postgres: ${cf_payment_id}`);
    }
  } catch (error) {
    console.error('❌ Error logging transaction to Postgres:', error);
    throw error;
  }
}
