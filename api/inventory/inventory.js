require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const { fetchInventory } = require('../updateInventory'); // Import the fetchInventory function
const router = express.Router();

// Improved error handling
router.get('/', async(req, res) => {
    try {
        const items = await fetchInventory(); // Use the fetchInventory function
        if (!items || items.length === 0) {
            return res.status(404).json({ error: 'No items found' });
        }
        res.json({ items }); // Return the fetched items
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

module.exports = router; // Export the router