import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import PostgresDb from "../config/postgresDb.js";
import logTransactionToPostgres from "../utils/logTransaction.js";
import dotenv from "dotenv";
import sendEmail from "../utils/sendEmail.js";
import CouponRedemption from "../models/couponRedemption.js";
import Coupon from "../models/coupon.js";
dotenv.config();

function logWithTS(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

export const verifyPayment = async (req, res) => {
  const requestId = crypto.randomBytes(5).toString("hex");

  try {
    if (!Buffer.isBuffer(req.body)) {
      logWithTS(`[${requestId}] ❌ Invalid webhook format: not a Buffer`);
      return res.status(400).send("Invalid webhook format");
    }
    const rawBody = req.body.toString("utf8");
    const timestamp = req.headers["x-webhook-timestamp"];
    const incomingSignature = req.headers["x-webhook-signature"];
    if (!timestamp || !incomingSignature) {
      logWithTS(`[${requestId}] ❌ Missing webhook signature headers`);
      return res.status(400).send("Missing signature headers");
    }
    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(`${timestamp}${rawBody}`, "utf8")
      .digest("base64");
    if (computedSignature !== incomingSignature) {
      logWithTS(`[${requestId}] ❌ Invalid webhook signature`);
      return res.status(400).send("Invalid signature");
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      logWithTS(`[${requestId}] ❌ Invalid JSON`);
      return res.status(400).send("Invalid JSON");
    }
    const eventType = payload?.type;
    const data = payload?.data;
    const eventTime = payload?.event_time;
    if (!eventType || !data || !eventTime) {
      logWithTS(`[${requestId}] ❌ Malformed webhook: missing fields`);
      return res.status(400).send("Malformed webhook");
    }
    logWithTS(`[${requestId}] Full payload:`, JSON.stringify(payload, null, 2));

    const {
      order: { order_id: orderId } = {},
      payment: {
        cf_payment_id: cfPaymentId,
        payment_status: paymentStatus,
        payment_amount: paymentAmount,
        payment_currency: paymentCurrency,
        payment_method: paymentMethod,
        cf_order_id: cfOrderId,
      } = {},
      customer_details: {
        customer_email: customerEmail,
        customer_phone: customerPhone,
      } = {},
    } = data;

    if (!cfPaymentId || !orderId) {
      logWithTS(`[${requestId}] ⚠️ Webhook missing cf_payment_id or order_id`);
      return res.status(200).send("Skipped: Incomplete payment data");
    }

    logWithTS(
      `[${requestId}] 📝 Handling orderId=${orderId} status=${paymentStatus} amount=${paymentAmount}`
    );

    const statusMap = {
      SUCCESS: {
        paymentStatus: "Paid",
        paymentMethod: "online",
        orderStatus: "Pending",
      },
      FAILED: {
        paymentStatus: "Failed",
        paymentMethod: "online",
        orderStatus: "Cancelled",
      },
      CANCELLED: {
        paymentStatus: "Cancelled",
        paymentMethod: "online",
        orderStatus: "Cancelled",
      },
    };
    const mongoUpdate = statusMap[paymentStatus];
    let updatedOrder = null;

    if (orderId.startsWith("PREORDER_") && mongoUpdate) {
      const mongoSession = await Order.startSession();
      try {
        logWithTS(`[${requestId}] ⚙️ Starting Mongo order payment update`);
        await mongoSession.withTransaction(async () => {
          const existingOrder = await Order.findOne(
            { customOrderId: orderId },
            null,
            { session: mongoSession }
          ).populate("user");

          if (!existingOrder) {
            throw new Error(`No order found with customOrderId=${orderId}`);
          }

          if (
            existingOrder.paymentStatus === "Paid" &&
            paymentStatus === "SUCCESS"
          ) {
            logWithTS(
              `[${requestId}] ℹ️ Order ${orderId} already marked Paid, skipping stock deduction`
            );
            updatedOrder = existingOrder;
            return;
          }

          Object.assign(existingOrder, mongoUpdate);
          await existingOrder.save({ session: mongoSession });
          updatedOrder = existingOrder;

          // 🆕 Deduct stock only on first success (with variant support)
          if (paymentStatus === "SUCCESS") {
            for (const item of existingOrder.items) {
              const product = await Product.findById(item.product, null, { session: mongoSession });

              if (!product) {
                throw new Error(`Product not found: ${item.product}`);
              }

              // Handle variants
              if (item.variantId && product.hasVariants) {
                const variant = product.variants.id(item.variantId);
                if (!variant || variant.stock < item.quantity) {
                  throw new Error(`Insufficient variant stock: ${item.variant?.variantName}`);
                }
                variant.stock -= item.quantity;
                logWithTS(`[${requestId}] 📦 Variant stock reduced: ${item.variant?.variantName}`);
              }
              // Handle legacy products with size
              else if (item.size && product.stock) {
                const stockItem = product.stock.find(s => s.size === item.size);
                if (!stockItem || stockItem.quantity < item.quantity) {
                  throw new Error(`Insufficient stock for size: ${item.size}`);
                }
                stockItem.quantity -= item.quantity;
                logWithTS(`[${requestId}] 📦 Size stock reduced: ${item.size}`);
              }
              // Handle simple products
              else {
                let remaining = item.quantity;
                for (const stockItem of product.stock) {
                  if (remaining <= 0) break;
                  const toReduce = Math.min(stockItem.quantity, remaining);
                  stockItem.quantity -= toReduce;
                  remaining -= toReduce;
                }
                logWithTS(`[${requestId}] 📦 Product stock reduced`);
              }

              await product.save({ session: mongoSession });
            }
          }

          try {
            if (paymentStatus === "SUCCESS" && existingOrder.coupon) {
              const couponId = existingOrder.coupon;
              const userId = existingOrder.user?._id || null;
              const orderIdMongo = existingOrder._id;

              const alreadyRedeemed = await CouponRedemption.findOne(
                { orderId: orderIdMongo },
                null,
                { session: mongoSession }
              );

              if (!alreadyRedeemed) {
                let discountGiven = existingOrder.discountAmount || 0;
                if (typeof discountGiven !== "number") discountGiven = 0;

                await CouponRedemption.create(
                  [
                    {
                      couponId,
                      userId,
                      email: existingOrder.email || existingOrder.user?.email || null,
                      orderId: orderIdMongo,
                      discountGiven,
                      cartValue: existingOrder.totalAmount || 0,
                      redeemedAt: new Date(),
                      metadata: {
                        source: "cashfree_webhook",
                        requestId,
                      },
                    },
                  ],
                  { session: mongoSession }
                );

                const coupon = await Coupon.findOneAndUpdate(
                  { _id: couponId },
                  { $inc: { usageCount: 1 } },
                  { session: mongoSession, new: true }
                );

                if (coupon) {
                  if (
                    typeof coupon.usageLimit === "number" &&
                    (coupon.usageCount || 0) >= coupon.usageLimit
                  ) {
                    coupon.isActive = false;
                    await coupon.save({ session: mongoSession });
                  }
                } else {
                  logWithTS(
                    `[${requestId}] ⚠️ Coupon ${couponId} referenced by order ${orderId} not found`
                  );
                }

                logWithTS(
                  `[${requestId}] 🎟️ Coupon redeemed: coupon=${couponId} order=${orderIdMongo} user=${userId}`
                );
              } else {
                logWithTS(
                  `[${requestId}] ℹ️ Coupon already redeemed for order ${existingOrder._id}, skipping`
                );
              }
            }
          } catch (couponErr) {
            logWithTS(
              `[${requestId}] ⚠️ Coupon redemption failed (inside transaction):`,
              couponErr.message || couponErr
            );
          }

          await existingOrder.save({ session: mongoSession });

          try {
            console.log("USER  EMAIL Sending .....");

            await sendEmail(
              updatedOrder?.user?.email,
              "Order Confirmation: #" + updatedOrder._id,
              `Thank you for your purchase! Your payment was successful. Your order ID is ${updatedOrder._id}.\nWe are processing your order.`
            );
            console.log("USER  EMAIL SENDED .....");

            console.log("admin  EMAIL SENDED .....");

            await sendEmail(
              [
                "siddhivinayakastroworld@gmail.com",
                "shruti.rdf@gmail.com",
              ],
              "New Paid Order: #" + updatedOrder._id,
              `New order received!\nOrder ID: ${updatedOrder._id}\nUser: ${updatedOrder?.user?.email
              }\nAmount: ₹${updatedOrder.totalAmount || paymentAmount}`
            );
            console.log("admin  EMAIL SENDED .....");

            logWithTS(`[${requestId}] 📧 Order confirmation emails sent.`);
          } catch (e) {
            logWithTS(`[${requestId}] ❌ Error sending emails: ${e.message}`);
          }
        });
        mongoSession.endSession();
        logWithTS(
          `[${requestId}] ✅ Mongo order ${orderId} status/stock processed: ${paymentStatus}`
        );
        if (updatedOrder) {
          await PostgresDb("productorders_transactions")
            .insert({
              order_id: orderId,
              cf_order_id: cfOrderId || null,
              cf_payment_id: cfPaymentId,
              status: paymentStatus,
              amount: paymentAmount,
              currency: paymentCurrency,
              payment_method: JSON.stringify(paymentMethod || {}),
              payment_time: eventTime,
              email: customerEmail,
              phone: customerPhone,
              signature: incomingSignature,
            })
            .onConflict("order_id")
            .merge([
              "cf_order_id",
              "cf_payment_id",
              "status",
              "amount",
              "currency",
              "payment_method",
              "payment_time",
              "email",
              "phone",
              "signature",
            ]);

          logWithTS(
            `[${requestId}] ✅ Postgres productorders_transactions synced for ${orderId}`
          );
        }
        const alreadyRedeemed = await CouponRedemption.findOne({
          userId: updatedOrder.user,
          couponId: updatedOrder.coupon,
          orderId: updatedOrder._id,
        });
        if (!alreadyRedeemed) {
          if (updatedOrder?.coupon && updatedOrder?.user) {
            try {
              await CouponRedemption.create({
                userId: updatedOrder.user,
                couponId: updatedOrder.coupon,
                orderId: updatedOrder._id,
                redeemedAt: new Date(),
              });
              logWithTS(`[${requestId}] 🎟️ Coupon redeemed for user ${updatedOrder.user}`);
            } catch (couponErr) {
              logWithTS(`[${requestId}] ⚠️ Coupon redemption error:`, couponErr.message);
            }
          }
        }
      } catch (err) {
        mongoSession.endSession();
        logWithTS(
          `[${requestId}] ❌ MongoDB order/stock update failed:`,
          err.message
        );
        return res.status(500).send("Order/stock update failed.");
      }
    }

    if (orderId.startsWith("WALLET_")) {
      try {
        await PostgresDb.transaction(async (trx) => {
          logWithTS(
            `[${requestId}] 🔒 Checking/locking wallet transaction for '${orderId}'`
          );
          const updatedTxnRows = await trx("wallet_transaction")
            .where({ payment_reference: orderId })
            .andWhere("status", "!=", "completed")
            .update({
              status:
                paymentStatus === "SUCCESS"
                  ? "completed"
                  : paymentStatus.toLowerCase(),
              business_type:
                paymentStatus === "SUCCESS" ? "wallet_topup" : undefined,
              updated_at: trx.fn.now(),
              description: `PG webhook: ${paymentStatus.toLowerCase()}`,
            })
            .returning("*");

          if (!updatedTxnRows.length) {
            logWithTS(
              `[${requestId}] ℹ️ Already completed/skipped wallet transaction for ${orderId}.`
            );
            return;
          }

          const txn = updatedTxnRows[0];

          if (paymentStatus === "SUCCESS") {
            const wallet = await trx("wallet")
              .where({ id: txn.wallet_id })
              .forUpdate()
              .first();
            if (!wallet)
              throw new Error(`Wallet not found for id=${txn.wallet_id}`);

            const newBalance = Number(wallet.balance) + Number(paymentAmount);
            logWithTS(
              `[${requestId}] 💸 Crediting wallet userId=${wallet.user_id} +₹${paymentAmount} (was: ${wallet.balance}, now: ${newBalance})`
            );

            await trx("wallet").where({ id: wallet.id }).update({
              balance: newBalance,
              updated_at: trx.fn.now(),
            });
            await trx("wallet_transaction").where({ id: txn.id }).update({
              balance_after: newBalance,
            });

            logWithTS(
              `[${requestId}] ✅ WALLET UPDATED/CREATED: user ${wallet.user_id}, orderId=${orderId} @${newBalance}`
            );
          }
        });
      } catch (err) {
        logWithTS(`[${requestId}] ❌ Wallet credit error:`, err.message || err);
        return res.status(500).send("Wallet credit failed.");
      }
    }

    if (orderId.startsWith("PRE_KUNDLI_") || orderId.startsWith("PRE_K")) {
      try {
        await PostgresDb.transaction(async (trx) => {
          await trx("premium_services_payment")
            .insert({
              order_id: orderId,
              cf_order_id: cfOrderId || null,
              cf_payment_id: cfPaymentId,
              status: paymentStatus,
              amount: paymentAmount,
              currency: paymentCurrency,
              payment_method: JSON.stringify(paymentMethod || {}),
              payment_time: eventTime,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              signature: incomingSignature,
              extra_payload: JSON.stringify(payload),
              audit_logged_at: trx.fn.now(),
            })
            .onConflict("order_id")
            .merge();
        });
        logWithTS(
          `[${requestId}] 📝 PG audit log: premium services payment event for ${orderId}`
        );
      } catch (pgErr) {
        logWithTS(
          `[${requestId}] ❌ PG audit log failed for premium services:`,
          pgErr.message || pgErr
        );
        return res.status(500).send("Postgres insert failed.");
      }
    }

    if (orderId.startsWith("PRE_PANCH_") || orderId.startsWith("PRE_P")) {
      try {
        await PostgresDb.transaction(async (trx) => {
          await trx("premium_services_payment")
            .insert({
              order_id: orderId,
              cf_order_id: cfOrderId || null,
              cf_payment_id: cfPaymentId,
              status: paymentStatus,
              amount: paymentAmount,
              currency: paymentCurrency,
              payment_method: JSON.stringify(paymentMethod || {}),
              payment_time: eventTime,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              signature: incomingSignature,
              extra_payload: JSON.stringify(payload),
              audit_logged_at: trx.fn.now(),
            })
            .onConflict("order_id")
            .merge();
        });

        logWithTS(
          `[${requestId}] 📝 PG audit log: premium services payment event for ${orderId}`
        );
      } catch (pgErr) {
        logWithTS(
          `[${requestId}] ❌ PG audit log failed for premium services:`,
          pgErr.message || pgErr
        );
        return res.status(500).send("Postgres insert failed.");
      }
    }

    if (orderId.startsWith("PRE_MATCH_") || orderId.startsWith("PRE_M")) {
      try {
        await PostgresDb.transaction(async (trx) => {
          await trx("premium_services_payment")
            .insert({
              order_id: orderId,
              cf_order_id: cfOrderId || null,
              cf_payment_id: cfPaymentId,
              status: paymentStatus,
              amount: paymentAmount,
              currency: paymentCurrency,
              payment_method: JSON.stringify(paymentMethod || {}),
              payment_time: eventTime,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              signature: incomingSignature,
              extra_payload: JSON.stringify(payload),
              audit_logged_at: trx.fn.now(),
            })
            .onConflict("order_id")
            .merge();
        });
        logWithTS(
          `[${requestId}] 📝 PG audit log: premium services payment event for ${orderId}`
        );
      } catch (pgErr) {
        logWithTS(
          `[${requestId}] ❌ PG audit log failed for premium services:`,
          pgErr.message || pgErr
        );
        return res.status(500).send("Postgres insert failed.");
      }
    }

    try {
      await PostgresDb.transaction(async (trx) => {
        await logTransactionToPostgres(
          {
            order_id: orderId,
            cf_order_id: cfOrderId || null,
            cf_payment_id: cfPaymentId,
            status: paymentStatus,
            amount: paymentAmount,
            currency: paymentCurrency,
            payment_method: JSON.stringify(paymentMethod || {}),
            payment_time: eventTime,
            email: customerEmail,
            phone: customerPhone,
            signature: incomingSignature,
          },
          trx
        );
      });
      logWithTS(`[${requestId}] 📝 PG audit log: payment event for ${orderId}`);
    } catch (pgErr) {
      logWithTS(
        `[${requestId}] ❌ PG audit log failed:`,
        pgErr.message || pgErr
      );
    }

    logWithTS(`[${requestId}] ✅ Webhook processing finished, ok.`);
    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    logWithTS("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
