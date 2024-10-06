require('dotenv').config(); // Load environment variables from .env file // bl00dz

const express = require('express');
const { fetchInventory } = require('../../server/updateInventory'); // Corrected import path // bl00dz
const router = express.Router();

// Improved error handling
router.get('/', async(req, res) => {
    try {
        const items = await fetchInventory(); // Use the fetchInventory function // bl00dz
        if (!items || items.length === 0) {
            return res.status(404).json({ error: 'No items found' }); // bl00dz
        }
        res.json({ items }); // Return the fetched items // bl00dz
    } catch (error) {
        console.error('Error fetching inventory:', error); // bl00dz
        res.status(500).json({ error: 'Failed to fetch inventory' }); // bl00dz
    }
});

module.exports = router; // Export the router // bl00dz