require('dotenv').config();
const { Client, Environment } = require('square');
const fs = require('fs');
const path = require('path');

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production // Ensure this is set to Production
});

async function fetchInventory() {
    try {
        console.log('Fetching catalog items from Square...');
        const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');

        if (!response.result || !response.result.objects) {
            console.log('No catalog items found or unexpected response structure.');
            return [];
        }

        console.log(`Found ${response.result.objects.length} items in Square catalog`);

        const items = await Promise.all(response.result.objects.map(async(item) => {
            // Process both ITEM and ITEM_VARIATION types
            if (item.type !== 'ITEM' && item.type !== 'ITEM_VARIATION') {
                console.warn(`Skipping item ${item.id}: not an ITEM or ITEM_VARIATION`);
                return null; // Skip non-item types
            }

            try {
                const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
                const stockQuantity = inventoryResponse.result.counts[0] ? inventoryResponse.result.counts[0].quantity || 0 : 0;

                return {
                    id: item.id,
                    name: item.itemData.name,
                    price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount), // Ensure this is a number
                    description: item.itemData.description || '',
                    imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '',
                    stockQuantity: stockQuantity.toString(), // Convert BigInt to string
                };
            } catch (error) {
                console.error(`Error processing item ${item.id}:`, error);
                return null; // Return null for failed items
            }
        }));

        return items.filter(item => item !== null); // Filter out nulls
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }
}

// Export the fetchInventory function
module.exports = { fetchInventory };