require('dotenv').config(); // Load environment variables from .env file // bl00dz

const express = require('express');
const { fetchInventory } = require('../../server/updateInventory'); // Corrected import path // bl00dz
const router = express.Router();

// Improved error handling
router.get('/', async(req, res) => {
    try {
        const items = await fetchInventory();
        if (!items || !items.length) return res.status(404).json({ error: 'No items found' });
        res.json({ items });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

module.exports = router; // Export the router // bl00dz