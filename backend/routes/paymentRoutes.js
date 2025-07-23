import express from "express"
import authMiddleware from "../middlewares/authMiddleware.js"
import { checkPaymentStatus, createCashfreeOrder } from "../controllers/cashFreeController.js"
import { addMoneyToWallet, listWalletTransactions, myWallet, withrawFundsFromWallet } from "../controllers/walletControllers.js";

const router = express.Router()

//orders related
router.post("/cashfree/create-order", authMiddleware, createCashfreeOrder);
router.get("/cashfree/check-status", authMiddleware, checkPaymentStatus)

//wallet related
router.get('/api/wallet/me', authMiddleware, myWallet)  //check wallet balance    
router.get('/api/wallet/transactions', authMiddleware, listWalletTransactions); // list of all wallet transactions   
router.post('/api/wallet/add-money', authMiddleware, addMoneyToWallet); // add money to wallet
router.post('/api/wallet/withdraw', authMiddleware, withrawFundsFromWallet); // withdraw money from wallet

export default router;