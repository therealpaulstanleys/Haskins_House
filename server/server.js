console.log("Haskins House Records Server Starting...");
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const generateSecureSecret = require('./utils/generateSecret');

// Import routes
const authRouter = require('../api/auth');
const cartRouter = require('../api/cart');
const inventoryRouter = require('../api/inventory/inventory');
const ordersRouter = require('../api/orders');
const paymentsRouter = require('../api/payments');
const subscribeRouter = require('../api/subscribe');

const app = express();

// Generate secure secrets
const sessionSecret = process.env.SESSION_SECRET || generateSecureSecret();
const cookieSecret = process.env.COOKIE_SECRET || generateSecureSecret();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(cookieParser(cookieSecret));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://www.instagram.com", "https://platform.instagram.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "https://*.cdninstagram.com", "https://scontent.cdninstagram.com"],
            connectSrc: ["'self'", "https://connect.squareup.com", "https://api.instagram.com"],
            frameSrc: ["'self'", "https://www.instagram.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "https://*.cdninstagram.com"],
            childSrc: ["'self'", "https://www.instagram.com"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// Session configuration
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Static files
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1y',
    etag: false
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/subscribe', subscribeRouter);

// WebSocket setup
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    ws.on('error', console.error);
    ws.on('close', () => console.log('WebSocket connection closed'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ?
            'Internal server error' :
            err.message
    });
});

// Environment validation
const requiredEnvVars = [
    'SQUARE_ACCESS_TOKEN',
    'EMAIL_USER',
    'EMAIL_PASS'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is missing`);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Critical Error:', error);
    process.exit(1);
});