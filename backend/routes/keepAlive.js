import express from 'express';
import PostgresDb from '../config/postgresDb.js';

const router = express.Router();

router.get('/keepalive', async (req, res) => {
    try {
        await PostgresDb.raw('SELECT 1');
        res.json({
            status: 'alive',
            message: 'Database is active',
            time: new Date()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router; // ✅ Add this line
