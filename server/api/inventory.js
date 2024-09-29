const express = require('express');
const { Client, Environment } = require('square');
const router = express.Router();

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production,
});

// Endpoint to get inventory
router.get('/', async(req, res) => {
    try {
        const catalogResponse = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');
        const items = catalogResponse.result.objects.filter(item => item.type === 'ITEM');

        const inventoryPromises = items.map(async(item) => {
            const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
            const stockQuantity = inventoryResponse.result.counts[0] ? inventoryResponse.result.counts[0].quantity : 0;

            return {
                id: item.id,
                name: item.itemData.name,
                price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount),
                stockQuantity: stockQuantity.toString(),
                description: item.itemData.description || '',
                imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '',
            };
        });

        const inventoryItems = await Promise.all(inventoryPromises);
        res.json({ items: inventoryItems });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

module.exports = router; // Export the router