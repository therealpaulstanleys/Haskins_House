console.log("Script started");
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

const fs = require('fs');
const fsPromises = fs.promises;
const express = require('express');
const cors = require('cors');
const { Client, Environment, ApiError } = require('square');
require('dotenv').config();
const https = require('https');
const path = require('path');
const helmet = require('helmet');

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
  'http://localhost:3000'
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

// Square client initialization
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox // Change to Environment.Production for production
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/get-catalog-items', async (req, res) => {
  try {
    const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');
    const items = response.result.objects.map(item => ({
      name: item.itemData.name,
      price: item.itemData.variations[0].itemVariationData.priceMoney.amount,
      imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '/images/default-image.jpg'
    }));
    res.json({ items });
  } catch (error) {
    console.error('Error fetching catalog items:', error);
    res.status(500).json({ error: 'Failed to fetch catalog items' });
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

app.get('/api/inventory', async (req, res) => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, 'api', 'inventory.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading inventory:', error);
    res.status(500).json({ error: 'Failed to load inventory' });
  }
});

app.get('/api/catalog-preview', async (req, res) => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, 'api', 'inventory.json'), 'utf8');
    const inventory = JSON.parse(data);
    const previewItems = inventory.items.slice(0, 3);
    res.json({ items: previewItems });
  } catch (error) {
    console.error('Error reading catalog preview:', error);
    res.status(500).json({ error: 'Failed to load catalog preview' });
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

// We'll remove the HTTPS server setup for now, as it's not needed for localhost

app.get('/styles.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, '..', 'public', 'styles.css'));
});
