import express from "express"
import authMiddleware from "../middlewares/authMiddleware.js"
import { checkPaymentStatus, createCashfreeOrder } from "../controllers/cashFreeController.js"
import {  getWithdrawalRequests, initiateWalletTopupOrder, listWalletTransactions, myWallet, updateWithdrawalStatus, withdrawFundsFromWallet } from "../controllers/walletControllers.js";

const router = express.Router()

//orders related
router.post("/cashfree/create-order", authMiddleware, createCashfreeOrder);// Placing product orders
router.get("/cashfree/check-status", authMiddleware, checkPaymentStatus) // cecking cashfree status 

//Premium services Cashfree order
router.post("/premium/kundli" , authMiddleware, premiumKundliOrder)

//wallet related
router.get('/wallet/me', authMiddleware, myWallet)  //check wallet balance    
router.get('/wallet/transactions', authMiddleware, listWalletTransactions); // list of all wallet transactions   
// router.post('/wallet/add-money', authMiddleware, addMoneyToWallet); // add money to wallet manually for admin refund bonnus etc cases
router.post('/wallet/withdraw', authMiddleware, withdrawFundsFromWallet); // withdraw money from wallet
router.post('/wallet/initiateTopUp', authMiddleware, initiateWalletTopupOrder)

router.post("/admin/withdrawals/:id/update-status",authMiddleware, updateWithdrawalStatus) // admin withdrawl request response update 
router.get('/admin/withdrawals/requests', authMiddleware, getWithdrawalRequests); // admin list of withdrawls


export default router;