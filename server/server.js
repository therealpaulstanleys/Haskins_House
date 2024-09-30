console.log("Script started");
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

require('dotenv').config();
console.log('Session Secret:', process.env.SESSION_SECRET); // Debugging line

const express = require('express');
const cors = require('cors');
const { Client, Environment } = require('square');
const path = require('path');
const helmet = require('helmet');
const WebSocket = require('ws');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();

// Initialize variables
let cart = []; // Initialize cart as an empty array
let inventoryItems = []; // Initialize inventoryItems as an empty array

// Middleware to use the inventory routes
console.log('Before importing inventory routes');
console.log('Current working directory:', process.cwd()); // Debugging line
const inventoryRoutes = require(path.resolve(__dirname, '../api/inventory/inventory.js')); // Use absolute path
console.log('After importing inventory routes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helmet middleware for security headers
app.use(helmet());

// Set Content Security Policy
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"], // Removed 'unsafe-eval'
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://your-api-endpoint.com"], // Adjust as needed
    },
}));

// Square client setup
const squareClient = new Client({
    environment: Environment.Production, // Ensure this is set to Production
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'Outlook', // Use Outlook as the email service
    auth: {
        user: process.env.EMAIL_USER, // Your Outlook email
        pass: process.env.EMAIL_PASS, // Your Outlook email password
    },
});

// Endpoint to get inventory
// Removed duplicate inventory endpoint
// app.get('/api/inventory', async(req, res) => {
//     // Fetch inventory logic here
//     inventoryItems = await fetchInventory(); // Assuming fetchInventory is defined
//     res.json({ items: inventoryItems });
// });

// Middleware to use the inventory routes
app.use('/api/catalog', inventoryRoutes); // Changed from /api/inventory to /api/catalog

// Endpoint to handle newsletter subscription
app.post('/subscribe', async(req, res) => {
    const { email } = req.body;

    // Validate email
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: 'realpaulstanley@outlook.com', // Recipient address
        subject: 'New Newsletter Subscription',
        text: `New subscription: ${email}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Subscription successful!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket setup
const wss = new WebSocket.Server({ server });

// Improved WebSocket error handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Square configuration route
app.get('/api/square-config', (req, res) => {
    res.json({
        appId: process.env.APP_ID,
        locationId: process.env.LOCATION_ID
    });
});

// Webhook endpoint
app.post('/api/webhooks', (req, res) => {
    const event = req.body;

    // Log the event for debugging
    console.log('Received webhook event:', event);

    // Handle the event based on its type
    switch (event.type) {
        case 'payment.updated':
            // Handle payment update
            break;
        case 'payment.created':
            // Handle payment creation
            break;
        case 'payout.paid':
            // Handle payout paid event
            console.log('Payout has been paid:', event.data);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Respond with a 200 status to acknowledge receipt
    res.status(200).send('Webhook received');
});

// Endpoint to get cart items
app.get('/api/cart', (req, res) => {
    res.json({ cart });
});

// Endpoint to add item to cart
app.post('/api/cart/add', (req, res) => {
    const { itemId } = req.body;

    // Validate itemId
    if (!itemId) {
        return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    const item = inventoryItems.find(i => i.id === itemId);

    if (item) {
        const cartItem = cart.find(i => i.id === itemId);
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({...item, quantity: 1 });
        }
        return res.json({ success: true, cart }); // Return updated cart
    }
    res.status(404).json({ success: false, message: 'Item not found' });
});

// Endpoint to remove item from cart
app.post('/api/cart/remove', (req, res) => {
    const { itemId } = req.body;

    // Validate itemId
    if (!itemId) {
        return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    cart = cart.filter(item => item.id !== itemId);
    res.json({ success: true, cart }); // Return updated cart
});