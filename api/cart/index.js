const express = require('express');
const router = express.Router();
const { fetchInventory } = require('../../server/updateInventory'); // Import the fetchInventory function

// Endpoint to get cart items
router.get('/', (req, res) => {
    res.json({ cart: req.session.cart || [] });
});

// Endpoint to add item to cart
router.post('/add', async(req, res) => {
    try {
        const { itemId, quantity = 1 } = req.body;
        const inventory = await fetchInventory();
        const item = inventory.find(i => i.id === itemId);

        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (!req.session.cart) req.session.cart = [];

        const cartItem = req.session.cart.find(i => i.id === itemId);
        if (cartItem) {
            cartItem.quantity += quantity;
        } else {
            req.session.cart.push({...item, quantity });
        }

        res.json({ success: true, cart: req.session.cart });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Endpoint to remove item from cart
router.post('/remove', (req, res) => {
    const { itemId } = req.body;
    const index = cartItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
        cartItems.splice(index, 1); // Remove item from cart
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, message: 'Item not found in cart' });
});

module.exports = router; // Export the router