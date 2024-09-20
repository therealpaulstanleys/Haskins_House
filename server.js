const express = require('express');
const cors = require('cors');
const { Client, Environment } = require('square');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://xklc7vgb-8080.use.devtunnels.ms', 
      'http://localhost:8080',
      'https://7734-198-54-130-91.ngrok-free.app'  // New ngrok URL added here
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
});

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self';");
  next();
});

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox // or Environment.Production
});

app.get('/get-catalog-items', async (req, res) => {
  try {
    const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');
    res.json(response.result.objects);
  } catch (error) {
    console.error('Error fetching catalog items:', error);
    res.status(500).json({ error: 'Failed to fetch catalog items', details: error.message });
  }
});

app.post('/process-payment', async (req, res) => {
  try {
    const { sourceId, amount, locationId, idempotencyKey, customerDetails } = req.body;

    // Create or update customer
    let customerId;
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
        customerId = result.customers[0].id;
        // Update existing customer
        await squareClient.customersApi.updateCustomer(customerId, {
          givenName: customerDetails.name.split(' ')[0],
          familyName: customerDetails.name.split(' ').slice(1).join(' '),
          emailAddress: customerDetails.email,
          phoneNumber: customerDetails.phone,
          address: {
            addressLine1: customerDetails.address
          }
        });
      } else {
        // Create new customer
        const { result } = await squareClient.customersApi.createCustomer({
          givenName: customerDetails.name.split(' ')[0],
          familyName: customerDetails.name.split(' ').slice(1).join(' '),
          emailAddress: customerDetails.email,
          phoneNumber: customerDetails.phone,
          address: {
            addressLine1: customerDetails.address
          }
        });
        customerId = result.customer.id;
      }
    } catch (error) {
      console.error('Error creating/updating customer:', error);
    }

    // Process payment
    const paymentBody = {
      sourceId,
      amountMoney: {
        amount,
        currency: 'USD'
      },
      locationId,
      idempotencyKey
    };

    if (customerId) {
      paymentBody.customerId = customerId;
    }

    const { result } = await squareClient.paymentsApi.createPayment(paymentBody);

    res.json({ payment: result.payment });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

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
