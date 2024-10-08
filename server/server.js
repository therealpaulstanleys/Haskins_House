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
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();

// Initialize Square client
const squareClient = new Client({
    environment: Environment.Production,
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1y',
    etag: false
}));

// Security headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://your-api-endpoint.com"],
    },
}));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'Outlook',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Inventory endpoint
app.get('/api/inventory', async(req, res) => {
    try {
        const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');
        const items = response.result.objects.map(item => ({
            id: item.id,
            name: item.itemData.name,
            price: item.itemData.variations[0].itemVariationData.priceMoney.amount.toString(),
            description: item.itemData.description || '',
            imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '',
            stockQuantity: (item.stockQuantity || 0).toString(),
        }));
        res.json(items);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Newsletter subscription endpoint
app.post('/subscribe', async(req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'realpaulstanley@outlook.com',
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

// Cart endpoints
let cart = [];
app.get('/api/cart', (req, res) => {
    res.json({ cart });
});

app.post('/api/cart/add', (req, res) => {
    const { itemId } = req.body;
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
        return res.json({ success: true, cart });
    }
    res.status(404).json({ success: false, message: 'Item not found' });
});

app.post('/api/cart/remove', (req, res) => {
    const { itemId } = req.body;
    if (!itemId) {
        return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    cart = cart.filter(item => item.id !== itemId);
    res.json({ success: true, cart });
});

// WebSocket setup
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

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

// Webhook endpoint
app.post('/api/webhooks', (req, res) => {
    const event = req.body;
    console.log('Received webhook event:', event);

    switch (event.type) {
        case 'payment.updated':
            // Handle payment update
            break;
        case 'payment.created':
            // Handle payment creation
            break;
        case 'payout.paid':
            console.log('Payout has been paid:', event.data);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send('Webhook received');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});