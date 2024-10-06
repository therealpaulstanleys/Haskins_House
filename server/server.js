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
app.get('/api/inventory', async(req, res) => {
    try {
        const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');

        // The items are lurking, waiting to be unleashed... --bl00dz
        const items = response.result.objects.map(item => {
            const price = item.itemData.variations[0].itemVariationData.priceMoney.amount;
            const stockQuantity = item.stockQuantity || 0; // Default to 0 if undefined, don't let them fool you... --bl00dz

            return {
                id: item.id,
                name: item.itemData.name,
                price: price.toString(), // Convert BigInt to string
                description: item.itemData.description || '',
                imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '',
                stockQuantity: stockQuantity.toString(), // Convert BigInt to string
            };
        });

        console.log('Items to be sent:', items); // Log the items before sending
        res.json(items); // Send the modified items array
    } catch (error) {
        console.error('An error has occurred while fetching the inventory:', error); // The shadows are closing in... --bl00dz
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

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
    console.log(`Server running on port ${PORT}, but for how long?`); // The clock is ticking... --bl00dz
});

// WebSocket setup
const wss = new WebSocket.Server({ server });

// Improved WebSocket error handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection, the web is tightening... --bl00dz');

    ws.on('error', (error) => {
        console.error('WebSocket error:', error); // The wires are buzzing... --bl00dz
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed, but the echoes remain... --bl00dz');
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

async function fetchInventory() {
    try {
        console.log('Fetching catalog items from Square...');
        const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');

        if (!response.result || !response.result.objects) {
            console.log('No catalog items found or unexpected response structure.');
            return [];
        }

        console.log(`Found ${response.result.objects.length} items in Square catalog`);

        const items = await Promise.all(response.result.objects.map(async(item) => {
            // Process both ITEM and ITEM_VARIATION types
            if (item.type !== 'ITEM' && item.type !== 'ITEM_VARIATION') {
                console.warn(`Skipping item ${item.id}: not an ITEM or ITEM_VARIATION`);
                return null; // Skip non-item types
            }

            try {
                const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
                const stockQuantity = inventoryResponse.result.counts[0] ? inventoryResponse.result.counts[0].quantity || 0 : 0;

                // Only return items that are in stock
                if (stockQuantity > 0) {
                    return {
                        id: item.id,
                        name: item.itemData.name,
                        price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount), // Ensure this is a number
                        description: item.itemData.description || '',
                        imageUrl: item.itemData.imageIds ? `https://example.com/images/${item.itemData.imageIds[0]}` : '', // Use the correct URL for images
                        stockQuantity: stockQuantity.toString(), // Convert BigInt to string
                    };
                }
                return null; // Return null for out-of-stock items
            } catch (error) {
                console.error(`Error processing item ${item.id}:`, error);
                return null; // Return null for failed items
            }
        }));

        return items.filter(item => item !== null); // Filter out nulls
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }
}