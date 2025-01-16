const express = require('express');
const router = express.Router();

// GET /api/inventory
router.get('/', async (req, res) => {
    try {
        // TODO: Implement inventory listing
        res.json({ message: 'Inventory endpoint' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
