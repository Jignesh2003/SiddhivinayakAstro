// utils/logTransaction.js
import PostgresDb from '../config/postgresDb.js';

/**
 * Logs a payment transaction to Postgres using Knex.
 * If cf_payment_id already exists, does nothing (idempotent).
 * Optionally accepts a Knex transaction (`trx`); otherwise uses default PostgresDb.
 */
export async function logTransactionToPostgres(transactionData, trx = PostgresDb) {
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
    // Knex insert with conflict/ignore
    const res = await trx('productorders_transactions')
      .insert({
        order_id,
        cf_order_id: cf_order_id || null,
        cf_payment_id,
        status,
        amount,
        currency,
        payment_method,
        payment_time,
        email,
        phone,
        signature,
      })
      .onConflict('cf_payment_id')
      .ignore()
      .returning('*');

    if (res.length === 0) {
      console.log(`ℹ️ Transaction already logged in Postgres: ${cf_payment_id}`);
    } else {
      console.log(`✅ Transaction logged to Postgres: ${cf_payment_id}`);
    }
  } catch (error) {
    console.error('❌ Error logging transaction to Postgres:', error);
    throw error;
  }
}
