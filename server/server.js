console.log("Script started");
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Client, Environment, ApiError } = require('square');
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();

// Use helmet for additional security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://sandbox.web.squarecdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://connect.squareupsandbox.com"], // Add this line
      // Add other necessary directives here
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

app.use(express.json());

// Add this line if it's not already present
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Cache control headers
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Load inventory from JSON file
let inventory = [];
const inventoryPath = path.join(__dirname, 'inventory.json');

function loadInventory() {
    try {
        const data = fs.readFileSync(inventoryPath, 'utf8');
        inventory = JSON.parse(data).items;
        console.log(`Loaded ${inventory.length} items from inventory.json`);
    } catch (error) {
        console.error('Error loading inventory:', error);
        inventory = [];
    }
}

function saveInventory() {
    try {
        fs.writeFileSync(inventoryPath, JSON.stringify({ items: inventory }, null, 2));
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

app.post('/api/update-inventory', (req, res) => {
    const { id, stockQuantity } = req.body;
    const item = inventory.find(item => item.id === id);
    if (item) {
        item.stockQuantity = stockQuantity;
        saveInventory();
        res.json({ success: true, item });
    } else {
        res.status(404).json({ success: false, message: 'Item not found' });
    }
});

// ... (rest of the code remains the same)

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

// Remove this route as it's already handled by express.static
// app.get('/styles.css', (req, res) => {
//   res.setHeader('Content-Type', 'text/css');
//   res.sendFile(path.join(__dirname, '..', 'public', 'styles.css'));
// });

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
app.post('/submit-form', (req, res) => {
    const { name, email, message } = req.body;
    
    const submission = {
        name,
        email,
        message,
        timestamp: new Date().toISOString()
    };

    const filePath = path.join(__dirname, 'submissions.json');

    fs.readFile(filePath, (err, data) => {
        let submissions = [];
        if (!err) {
            submissions = JSON.parse(data);
        }
        submissions.push(submission);

        fs.writeFile(filePath, JSON.stringify(submissions, null, 2), (err) => {
            if (err) {
                console.error('Error saving submission:', err);
                res.status(500).send('An error occurred. Please try again later.');
            } else {
                res.send('Thank you for your message. We will get back to you soon!');
            }
        });
    });
});

// Add a new route to handle newsletter subscription
app.post('/subscribe-newsletter', (req, res) => {
    const { email } = req.body;
    
    const subscription = {
        email,
        timestamp: new Date().toISOString()
    };

    const filePath = path.join(__dirname, 'newsletter_subscriptions.json');

    fs.readFile(filePath, (err, data) => {
        let subscriptions = [];
        if (!err) {
            subscriptions = JSON.parse(data);
        }
        
        // Check if email already exists
        if (!subscriptions.some(sub => sub.email === email)) {
            subscriptions.push(subscription);

            fs.writeFile(filePath, JSON.stringify(subscriptions, null, 2), (err) => {
                if (err) {
                    console.error('Error saving subscription:', err);
                    res.status(500).send('An error occurred. Please try again later.');
                } else {
                    res.send('Thank you for subscribing to our newsletter!');
                }
            });
        } else {
            res.send('You are already subscribed to our newsletter.');
        }
    });
});

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Sandbox // Use Environment.Production for production
});

app.get('/api/inventory', (req, res) => {
    // This should return your inventory data
    // For now, we'll return a mock inventory
    const inventory = [
        { id: '1', name: 'Record 1', price: 1999, stockQuantity: 5, imageUrl: '/images/record1.jpg' },
        { id: '2', name: 'Record 2', price: 2499, stockQuantity: 3, imageUrl: '/images/record2.jpg' },
        // Add more items as needed
    ];
    res.json({ items: inventory });
});

app.post('/process-payment', async (req, res) => {
    const { token, amount, customerDetails } = req.body;

    try {
        const response = await squareClient.paymentsApi.createPayment({
            sourceId: token,
            amountMoney: {
                amount: amount,
                currency: 'USD'
            },
            idempotencyKey: new Date().toISOString()
        });

        res.json({ success: true, payment: response.result.payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});
