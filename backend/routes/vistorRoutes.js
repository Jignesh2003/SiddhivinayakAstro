import express from "express"
import {checkVisitor, visitorPost} from "../controllers/vistorController.js"
const router = express.Router()

router.post('/visitors',visitorPost)
router.get('/visitors/check/:phoneNumber',checkVisitor)

export default router;