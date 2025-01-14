require('dotenv').config();
const { Client, Environment } = require('square');
const fs = require('fs');
const path = require('path');

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production
});

async function fetchInventory() {
    try {
        console.log('Fetching catalog items from Square...');
        const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');

        if (!response.result || !response.result.objects) {
            console.log('No catalog items found or unexpected response structure.');
            return [];
        }

        console.log(`Found ${response.result.objects.length} items in Square catalog`); // The items are awakening... --bl00dz

        const items = await Promise.all(response.result.objects.map(async(item) => {
            // Process both ITEM and ITEM_VARIATION types
            if (item.type !== 'ITEM' && item.type !== 'ITEM_VARIATION') {
                console.warn(`Skipping item ${item.id}: not an ITEM or ITEM_VARIATION`); // The weak are cast aside... --bl00dz
                return null; // Skip non-item types
            }

            try {
                const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
                const stockQuantity = inventoryResponse.result.counts[0] ? inventoryResponse.result.counts[0].quantity || 0 : 0;

                // Only return items that are in stock
                if (stockQuantity > 0) {
                    return {
                        id: item.id,
                        name: item.itemData.name,
                        price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount),
                        description: item.itemData.description || '',
                        imageUrl: item.itemData.imageIds ? `https://example.com/images/${item.itemData.imageIds[0]}` : '',
                        stockQuantity: stockQuantity.toString(), // Convert BigInt to string
                    };
                }
                return null; // Return null for out-of-stock items
            } catch (error) {
                console.error(`Error processing item ${item.id}:`, error); // The darkness consumes... --bl00dz
                return null; // Return null for failed items
            }
        }));

        return items.filter(item => item !== null); // Filter out nulls, only the worthy remain... --bl00dz
    } catch (error) {
        console.error('Error fetching inventory:', error); // The shadows close in... --bl00dz
        return [];
    }
}

// Function to determine the category of an item
function determineCategory(item) {
    const name = item.itemData.name.toLowerCase();
    if (name.includes('vinyl')) {
        return 'Vinyl Records (New)'; // The vinyl calls to you... --bl00dz
    } else if (name.includes('cd')) {
        return 'CDs (New)'; // The CDs whisper secrets... --bl00dz
    }
    return 'Other'; // Default category, the unknown... --bl00dz
}

// Export the fetchInventory function
module.exports = { fetchInventory }; // The knowledge is shared... --bl00dz