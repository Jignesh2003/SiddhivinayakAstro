import express from "express"
import Visitor from "../models/visitorSchema.js"
const router = express.Router();

// Save visitor information
export const visitorPost = async (req, res) => {

    try {
        const { fullName, phoneNumber } = req.body;

        console.log('✅ Extracted:', { fullName, phoneNumber }); // ← Add this

        // Validation
        if (!fullName || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Full name and phone number are required'
            });
        }

        // Check if visitor already exists by phone number
        const existingVisitor = await Visitor.findOne({ phoneNumber });

        if (existingVisitor) {
            // Update existing visitor
            existingVisitor.fullName = fullName;
            existingVisitor.lastVisit = Date.now();
            existingVisitor.visitCount += 1;
            await existingVisitor.save();


            return res.status(200).json({
                success: true,
                message: 'Welcome back!',
                data: existingVisitor
            });
        }

        // Create new visitor
        const visitor = new Visitor({
            fullName,
            phoneNumber,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        await visitor.save();

        res.status(201).json({
            success: true,
            message: 'Visitor information saved successfully',
            data: visitor
        });

    } catch (error) {
        console.error('❌ Error saving visitor:', error); // Already there but check logs

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: errors.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
}

// Check if visitor has already submitted (optional - for session management)
export const checkVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.findOne({ phoneNumber: req.params.phoneNumber });
        res.json({
            success: true,
            exists: !!visitor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking visitor'
        });
    }
}

