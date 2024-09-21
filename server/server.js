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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://sandbox.web.squarecdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://connect.squareupsandbox.com"],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://3789-198-54-130-155.ngrok-free.app'
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
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
}));

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

async function saveInventory() {
    try {
        await fs.writeFile(inventoryPath, JSON.stringify({ items: inventory }, null, 2));
        console.log('Inventory saved to file');
    } catch (error) {
        console.error('Error saving inventory:', error);
    }
}

loadInventory();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/get-catalog-items', (req, res) => {
    console.log(`Sending ${inventory.length} items to client`);
    res.json({ items: inventory });
});

app.get('/api/inventory', (req, res) => {
    res.json({ items: inventory });
});

app.post('/api/update-inventory', async (req, res) => {
    const { id, stockQuantity } = req.body;
    const item = inventory.find(item => item.id === id);
    if (item) {
        item.stockQuantity = stockQuantity;
        await saveInventory();
        res.json({ success: true, item });
    } else {
        res.status(404).json({ success: false, message: 'Item not found' });
    }
});

// Cart functionality
app.post('/api/cart/add', (req, res) => {
  const { itemId, quantity } = req.body;
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const existingItem = req.session.cart.find(item => item.id === itemId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const item = inventory.find(item => item.id === itemId);
    if (item) {
      req.session.cart.push({ id: itemId, quantity, price: item.price, name: item.name });
    }
  }
  
  res.json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/remove', (req, res) => {
  const { itemId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.id !== itemId);
  }
  res.json({ success: true, cart: req.session.cart });
});

app.get('/api/cart', (req, res) => {
  res.json({ cart: req.session.cart || [] });
});

app.post('/api/cart/clear', (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
});

// Server setup
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 1000);
  }
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

// Add an endpoint to serve images
app.get('/image/:imageId', async (req, res) => {
  try {
    const response = await squareClient.catalogApi.retrieveCatalogObject(req.params.imageId);
    const imageUrl = response.result.object.imageData.url;
    res.redirect(imageUrl);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(404).send('Image not found');
  }
});

// Add a new route to handle form submissions
app.post('/submit-form', async (req, res) => {
    const { name, email, message } = req.body;
    
    const submission = {
        name,
        email,
        message,
        timestamp: new Date().toISOString()
    };

    const filePath = path.join(__dirname, 'submissions.json');

    try {
        let submissions = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            submissions = JSON.parse(data);
        } catch (err) {
            // File doesn't exist or is empty, start with an empty array
        }
        submissions.push(submission);

        await fs.writeFile(filePath, JSON.stringify(submissions, null, 2));
        res.send('Thank you for your message. We will get back to you soon!');
    } catch (err) {
        console.error('Error saving submission:', err);
        res.status(500).send('An error occurred. Please try again later.');
    }
});

// Add a new route to handle newsletter subscription
app.post('/subscribe-newsletter', async (req, res) => {
    const { email } = req.body;
    
    const subscription = {
        email,
        timestamp: new Date().toISOString()
    };

    const filePath = path.join(__dirname, 'newsletter_subscriptions.json');

    try {
        let subscriptions = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            subscriptions = JSON.parse(data);
        } catch (err) {
            // File doesn't exist or is empty, start with an empty array
        }
        
        // Check if email already exists
        if (!subscriptions.some(sub => sub.email === email)) {
            subscriptions.push(subscription);

            await fs.writeFile(filePath, JSON.stringify(subscriptions, null, 2));
            res.send('Thank you for subscribing to our newsletter!');
        } else {
            res.send('You are already subscribed to our newsletter.');
        }
    } catch (err) {
        console.error('Error saving subscription:', err);
        res.status(500).send('An error occurred. Please try again later.');
    }
});

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Sandbox // Use Environment.Production for production
});

app.post('/process-payment', async (req, res) => {
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
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});
