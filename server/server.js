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
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Adjust as needed
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
app.get('/api/inventory', async(req, res) => {
    try {
        const catalogResponse = await squareClient.catalogApi.listCatalog(undefined, 'ITEM'); // Updated to use /catalog/list
        const items = catalogResponse.result.objects.filter(item => item.type === 'ITEM');

        const inventoryPromises = items.map(async(item) => {
            const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
            const stockQuantity = inventoryResponse.result.counts[0] ? inventoryResponse.result.counts[0].quantity : 0;

            return {
                id: item.id,
                name: item.itemData.name,
                price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount), // Ensure price is a Number
                stockQuantity: stockQuantity.toString(), // Convert stockQuantity to string
                description: item.itemData.description || '',
                imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '',
            };
        });

        const inventoryItems = await Promise.all(inventoryPromises);

        // Send the response using JSON.stringify with the replacer
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ items: inventoryItems }, (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString(); // Convert BigInt to string
            }
            return value;
        }));
    } catch (error) {
        // Improved error handling
        console.error('Error fetching inventory:', error.response ? error.response.body : error);
        res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
    }
});

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

const inventoryRoutes = require('./api/inventory'); // Import the inventory routes

// Middleware to use the inventory routes
app.use('/api/inventory', inventoryRoutes); // This will prefix all routes in inventory.js with /api/inventory

let cart = []; // In-memory cart for demonstration
let inventoryItems = []; // This should be populated with your inventory data

// Endpoint to get inventory
app.get('/api/inventory', async(req, res) => {
    // Fetch inventory logic here
    inventoryItems = await fetchInventory(); // Assuming fetchInventory is defined
    res.json({ items: inventoryItems });
});

// Endpoint to get cart items
app.get('/api/cart', (req, res) => {
    res.json({ cart });
});

// Endpoint to add item to cart
app.post('/api/cart/add', (req, res) => {
    const { itemId } = req.body;
    const item = inventoryItems.find(i => i.id === itemId);

    if (item) {
        const cartItem = cart.find(i => i.id === itemId);
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({...item, quantity: 1 });
        }
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, message: 'Item not found' });
});

// Endpoint to remove item from cart
app.post('/api/cart/remove', (req, res) => {
    const { itemId } = req.body;
    cart = cart.filter(item => item.id !== itemId);
    res.json({ success: true });
});