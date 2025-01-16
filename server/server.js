console.log("Haskins House Records Server Starting...");
process.on('uncaughtException', (error) => {
    console.error('Critical Error:', error);
    // Notify admin
    process.exit(1);
});

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Client, Environment } = require('square');
const path = require('path');
const helmet = require('helmet');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const generateSecureSecret = require('./utils/generateSecret');

const app = express();

// Generate secure secrets if not in environment
const sessionSecret = process.env.SESSION_SECRET || generateSecureSecret();
const cookieSecret = process.env.COOKIE_SECRET || generateSecureSecret();

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
        scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://www.instagram.com", "https://platform.instagram.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "https://*.cdninstagram.com", "https://scontent.cdninstagram.com", "https://instagram.com", "https://www.instagram.com"],
        connectSrc: ["'self'", "https://connect.squareup.com", "https://api.instagram.com"],
        frameSrc: ["'self'", "https://www.instagram.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https://*.cdninstagram.com"],
        childSrc: ["'self'", "https://www.instagram.com"]
    },
}));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Session configuration
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Rate limiting with more secure configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
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

// Cookie parser with secure options
app.use(cookieParser(cookieSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
}));

// Inventory endpoint
app.get('/api/inventory', async(req, res) => {
    try {
        const items = await fetchInventory();
        res.json({ items });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Newsletter subscription endpoint
app.post('/subscribe', [
    body('email').isEmail().normalizeEmail()
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'support@haskinshouserecords.com',
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
app.post('/api/cart/add', (req, res) => {
    const { itemId, quantity = 1 } = req.body;
    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingItem = req.session.cart.find(item => item.id === itemId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        req.session.cart.push({ id: itemId, quantity });
    }

    res.json({ success: true, cart: req.session.cart });
});

app.get('/api/cart', (req, res) => {
    res.json({ cart: req.session.cart || [] });
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

// Environment validation
if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error('Square access token is required');
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are required');
}

// Contact form endpoint
app.post('/api/contact', [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().notEmpty(),
    body('subject').trim().notEmpty(),
    body('message').trim().notEmpty()
], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'support@haskinshouserecords.com',
        subject: `Contact Form: ${subject}`,
        text: `
            Name: ${name}
            Email: ${email}
            Subject: ${subject}

            Message:
            ${message}
        `,
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});