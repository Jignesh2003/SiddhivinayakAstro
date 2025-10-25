// In your routes file or app.js
app.get('/keepalive', async (req, res) => {
    try {
        await PostgresDb.raw('SELECT 1');
        res.json({ status: 'alive', time: new Date() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
