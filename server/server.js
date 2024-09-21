console.log("Script started");
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

const express = require('express');
const cors = require('cors');
const { Client, Environment, ApiError } = require('square');
require('dotenv').config();
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

app.post('/process-payment', async (req, res) => {
  try {
    const { sourceId, amount, locationId, idempotencyKey, customerDetails } = req.body;

    // Create or update customer
    let customerId = await createOrUpdateCustomer(customerDetails);

    // Process payment
    const paymentBody = {
      sourceId,
      amountMoney: {
        amount,
        currency: 'USD'
      },
      locationId,
      idempotencyKey,
      customerId
    };

    const { result } = await squareClient.paymentsApi.createPayment(paymentBody);

    res.json({ payment: result.payment });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.post('/api/newsletter-signup', (req, res) => {
  const { email } = req.body;
  // TODO: Implement actual newsletter signup logic
  console.log(`Newsletter signup: ${email}`);
  res.json({ message: 'Thank you for signing up for our newsletter!' });
});

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Helper function for customer management
async function createOrUpdateCustomer(customerDetails) {
  try {
    const { result } = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: customerDetails.email
          }
        }
      }
    });

    if (result.customers && result.customers.length > 0) {
      const customerId = result.customers[0].id;
      await squareClient.customersApi.updateCustomer(customerId, {
        givenName: customerDetails.name.split(' ')[0],
        familyName: customerDetails.name.split(' ').slice(1).join(' '),
        emailAddress: customerDetails.email,
        phoneNumber: customerDetails.phone,
        address: {
          addressLine1: customerDetails.address
        }
      });
      return customerId;
    } else {
      const { result } = await squareClient.customersApi.createCustomer({
        givenName: customerDetails.name.split(' ')[0],
        familyName: customerDetails.name.split(' ').slice(1).join(' '),
        emailAddress: customerDetails.email,
        phoneNumber: customerDetails.phone,
        address: {
          addressLine1: customerDetails.address
        }
      });
      return result.customer.id;
    }
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    throw error;
  }
}

// Webhook handler
app.post('/', express.raw({type: 'application/json'}), (req, res) => {
    const signature = req.get('X-Square-Signature');
    const body = req.body;

    // Verify the webhook signature
    const hash = crypto.createHmac('sha256', process.env.SQUARE_WEBHOOK_SIGNATURE_KEY)
                       .update(body.toString('utf8'))
                       .digest('base64');

    if (hash !== signature) {
        console.error('Invalid webhook signature');
        return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(body.toString('utf8'));

    console.log('Received webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
        case 'inventory.count.updated':
            handleInventoryUpdate(event.data.object);
            break;
        case 'catalog.version.updated':
            handleCatalogUpdate(event.data.object);
            break;
        case 'customer.created':
        case 'customer.updated':
        case 'customer.deleted':
            handleCustomerEvent(event.type, event.data.object);
            break;
        case 'order.created':
        case 'order.updated':
        case 'order.fulfillment.updated':
            handleOrderEvent(event.type, event.data.object);
            break;
        case 'payment.created':
        case 'payment.updated':
            handlePaymentEvent(event.type, event.data.object);
            break;
        case 'refund.created':
        case 'refund.updated':
            handleRefundEvent(event.type, event.data.object);
            break;
        case 'subscription.created':
        case 'subscription.updated':
            handleSubscriptionEvent(event.type, event.data.object);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.sendStatus(200);
});

// Event handlers
async function handleInventoryUpdate(data) {
    console.log('Inventory updated:', data);
    const { catalog_object_id, quantity } = data.counts[0];
    
    const item = inventory.find(item => item.id === catalog_object_id);
    if (item) {
        item.stockQuantity = quantity;
        saveInventory();
        
        // Broadcast the update to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'inventory_update',
                    item: { id: catalog_object_id, stockQuantity: quantity }
                }));
            }
        });
    }
}

async function handleCatalogUpdate(data) {
    console.log('Catalog updated:', data);
    // Notify all connected clients to refresh their inventory
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'catalog_update',
                message: 'Catalog has been updated. Please refresh.'
            }));
        }
    });
}

function handleCustomerEvent(type, data) {
    console.log(`Customer event (${type}):`, data);
    // Implement customer event logic
    // This might involve updating a customer database or sending notifications
}

function handleOrderEvent(type, data) {
    console.log(`Order event (${type}):`, data);
    // Implement order event logic
    // This might involve updating order status in your system
    // or triggering fulfillment processes
}

function handlePaymentEvent(type, data) {
    console.log(`Payment event (${type}):`, data);
    // Implement payment event logic
    // This might involve updating payment status in your system
    // or triggering order fulfillment
}

function handleRefundEvent(type, data) {
    console.log(`Refund event (${type}):`, data);
    // Implement refund event logic
    // This might involve updating order status or inventory
}

function handleSubscriptionEvent(type, data) {
    console.log(`Subscription event (${type}):`, data);
    // Implement subscription event logic
    // This might involve updating subscription status in your system
}

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

app.get('/styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, '..', 'public', 'styles.css'));
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
