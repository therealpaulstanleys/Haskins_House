const express = require('express');
const router = express.Router();

// In-memory cart storage (for demonstration purposes)
let cartItems = [];

// Endpoint to get cart items
router.get('/', (req, res) => {
    res.json({ cart: cartItems });
});

// Endpoint to add item to cart
router.post('/add', (req, res) => {
    const { itemId } = req.body;
    const item = inventoryItems.find(i => i.id === itemId); // Assuming inventoryItems is accessible

    if (item) {
        const cartItem = cartItems.find(i => i.id === itemId);
        if (cartItem) {
            cartItem.quantity += 1; // Increment quantity if item already in cart
        } else {
            cartItems.push({...item, quantity: 1 }); // Add new item to cart
        }
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, message: 'Item not found' });
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