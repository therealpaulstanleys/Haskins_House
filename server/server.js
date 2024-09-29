// Add this at the top of your server.js file
BigInt.prototype.toJSON = function() {
    return this.toString();
};

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

const app = express();

// Use helmet for additional security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'https://haskinshouserecords.com',
    'https://www.haskinshouserecords.com'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '1mb' }));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError) {
        console.error('Invalid JSON:', err);
        return res.status(400).send({ error: 'Invalid JSON' });
    }
    next();
});

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-default-secret', // Ensure this is set in your .env file
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Ensure secure cookies in production
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Square client setup
const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN, // Ensure this is set in your .env file
    environment: Environment.Production // Use Production for production
});

// Payment processing route
app.post('/process-payment', async(req, res) => {
    const { token, customerDetails } = req.body;
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    try {
        const response = await squareClient.paymentsApi.createPayment({
            sourceId: token,
            amountMoney: {
                amount: totalAmount,
                currency: 'USD'
            },
            idempotencyKey: new Date().toISOString()
        });

        // Clear the cart after successful payment
        req.session.cart = [];

        const responseData = {
            inventoryCount: totalAmount.toString(), // Convert totalAmount to string
            // ... other properties ...
        };

        res.json(responseData); // Send the response
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, error: 'Payment processing failed. Please try again.' });
    }
});

// Endpoint to get inventory
app.get('/api/inventory', async(req, res) => {
    try {
        const response = await squareClient.catalogApi.listCatalog();
        const items = response.result.objects.filter(item => item.type === 'ITEM').map(item => {
            return {
                ...item,
                price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount), // Convert BigInt to Number
                // Ensure any BigInt values are converted to strings if necessary
            };
        });
        res.json({ items });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket setup should come after the server is initialized
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