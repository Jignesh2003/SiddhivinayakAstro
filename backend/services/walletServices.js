import PostgresDb from "../config/postgresDb.js";

/**
 * Fetches user's wallet balance (as a Number) by userId.
 * Returns the wallet balance or null if wallet doesn't exist.
 */
export async function getUserWalletBalance(userId) {
    const row = await PostgresDb('wallet')
        .where({ user_id: userId })
        .first('balance');
    return row ? Number(row.balance) : null;
}

/**
 * Deducts an amount from user's wallet and logs the transaction with all audit fields.
 * - Throws for insufficient funds or wallet not found.
 * - Uses transaction and row lock for consistency.
 * - Returns {success, balanceAfter} or {success: false, error}
 */
export async function deductFromWallet({
    userId,
    amount,
    businessType,          // string: 'chat_session_minute', 'withdrawal', etc.
    chatSessionId = null,  // string|ObjectId: optional session reference
    description = '',
    platformFee = null,
    gstAmount = null,
    paymentGatewayFee = null,
    totalPlatformFee = null, // (optional: add if using this fee breakdown)
    paymentReference = null, // (optional: add if you want to store payout tx ref)
    meta = {}
}) {
    if (!userId || !amount || amount <= 0) {
        return { success: false, error: "Invalid userId or amount" };
    }
    if (!businessType) {
        return { success: false, error: "Missing businessType" };
    }

    try {
        return await PostgresDb.transaction(async (trx) => {
            // 1. Lock and fetch wallet row
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

            // 3. Log the transaction with all available metadata/auditing fields
            await trx('wallet_transaction').insert({
                wallet_id: walletRow.id,
                direction: 'debit',
                business_type: businessType,
                chat_session_id: chatSessionId,
                amount,
                status: 'completed',
                description,
                platform_fee: platformFee,
                gst_amount: gstAmount,
                payment_gateway_fee: paymentGatewayFee,
                total_platform_fee: totalPlatformFee,
                payment_reference: paymentReference,
                balance_after: balanceAfter,
                meta: JSON.stringify(meta || {}),
                created_at: trx.fn.now(),
            });

            return { success: true, balanceAfter };
        });
    } catch (e) {
        return { success: false, error: e.message };
    }
}
