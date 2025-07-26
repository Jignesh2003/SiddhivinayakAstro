import PostgresDb from "../config/postgresDb.js";

export async function getUserWalletBalance(userId) {
  if (!userId) return null;
  const id = typeof userId === "string" ? userId : userId.toString(); // Always string!
  const row = await PostgresDb('wallet')
    .where({ user_id: id })
    .first('balance');
  return row ? Number(row.balance) : null;
}
/**
 * Deducts an amount from user's wallet and logs the transaction with all audit fields.
 * Throws for insufficient funds.
 */
export async function deductFromWallet({
    userId,
    amount,
    businessType,   // string - eg: 'chat_session_advance'
    chatSessionId = null,
    description = '',
    platformFee = null,
    gstAmount = null,
    paymentGatewayFee = null,
    meta = {}
}) {
    if (!userId || !amount || amount <= 0) {
        return { success: false, error: "Invalid userId or amount" };
    }
    if (!businessType) {
        return { success: false, error: "Missing businessType" };
    }

    return await PostgresDb.transaction(async (trx) => {
        // 1. Get & lock wallet row
        const walletRow = await trx('wallet')
            .where({ user_id: userId })
            .first('id', 'balance')
            .forUpdate();

        if (!walletRow) throw new Error('Wallet not found');
        if (Number(walletRow.balance) < amount) throw new Error('Insufficient balance');
        const balanceAfter = Number(walletRow.balance) - Number(amount);

        // 2. Deduct balance
        await trx('wallet')
            .where({ user_id: userId })
            .update({ balance: balanceAfter, updated_at: trx.fn.now() });

        // 3. Log the transaction
        await trx('wallet_transaction').insert({
            wallet_id: walletRow.id,
            direction: 'debit',
            business_type: businessType,
            chat_session_id: chatSessionId,
            amount,
            status: 'completed',
            platform_fee: platformFee,
            gst_amount: gstAmount,
            payment_gateway_fee: paymentGatewayFee,
            description,
            balance_after: balanceAfter,
            meta: JSON.stringify(meta || {}),
            created_at: trx.fn.now()
        });

        return { success: true, balanceAfter };
    }).catch(e => ({ success: false, error: e.message }));
}
