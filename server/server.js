console.log("Script started");
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

require('dotenv').config();

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
    'https://c5f5-198-54-130-91.ngrok-free.app' // Update this with your new ngrok URL
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
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Set this in your .env file
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Ensure secure cookies in production
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Load inventory from JSON file
let inventory = [];
const inventoryPath = path.join(__dirname, 'inventory.json');

async function loadInventory() {
    try {
        const data = await fs.readFile(inventoryPath, 'utf8');
        inventory = JSON.parse(data).items;
        console.log(`Loaded ${inventory.length} items from inventory.json`);
    } catch (error) {
        console.error('Error loading inventory:', error);
        inventory = [];
    }
}

loadInventory();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Other routes...

// Square client setup
const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN, // Set this in your .env file
    environment: Environment.Sandbox // Use Environment.Production for production
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

        res.json({ success: true, payment: response.result.payment });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, error: error.message });
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

// Add this route to your existing server.js file
app.get('/api/square-config', (req, res) => {
    res.json({
        appId: process.env.APP_ID,
        locationId: process.env.LOCATION_ID
    });
});

// Add webhook endpoint
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
            // Add more cases as needed
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Respond with a 200 status to acknowledge receipt
    res.status(200).send('Webhook received');
});