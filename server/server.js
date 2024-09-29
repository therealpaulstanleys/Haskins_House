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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

// Square client setup
const squareClient = new Client({
    environment: Environment.Sandbox, // Change to Production when ready
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

// Endpoint to get inventory
app.get('/api/inventory', async(req, res) => {
    try {
        const catalogResponse = await squareClient.catalogApi.listCatalog();
        const items = catalogResponse.result.objects.filter(item => item.type === 'ITEM');

        const inventoryPromises = items.map(async(item) => {
            const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
            const stockQuantity = inventoryResponse.result.counts[0] ? inventoryResponse.result.counts[0].quantity : 0;

            return {
                id: item.id,
                name: item.itemData.name,
                price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount), // Ensure price is a Number
                stockQuantity: stockQuantity.toString(), // Convert stockQuantity to string
                description: item.itemData.description || '',
                imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '',
            };
        });

        const inventoryItems = await Promise.all(inventoryPromises);

        // Send the response using JSON.stringify with the replacer
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ items: inventoryItems }, (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString(); // Convert BigInt to string
            }
            return value;
        }));
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