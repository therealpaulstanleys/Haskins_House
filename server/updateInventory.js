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

        console.log(`Found ${response.result.objects.length} items in Square catalog`);

        const items = await Promise.all(response.result.objects.map(async(item) => {
            try {
                const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
                const stockQuantity = inventoryResponse.result.counts[0] ? inventoryResponse.result.counts[0].quantity || 0 : 0;

                return {
                    id: item.id,
                    name: item.itemData.name,
                    price: Number(item.itemData.variations[0].itemVariationData.priceMoney.amount), // Convert to Number
                    description: item.itemData.description || '',
                    imageUrl: item.itemData.imageIds ? `/images/${item.itemData.imageIds[0]}` : '',
                    stockQuantity,
                    genre: item.itemData.categories ? item.itemData.categories[0] : '',
                    releaseYear: item.itemData.releaseDate ? new Date(item.itemData.releaseDate).getFullYear() : '',
                    format: 'Vinyl',
                    artist: item.itemData.name.split(' - ')[0]
                };
            } catch (error) {
                console.error(`Error processing item ${item.id}:`, error);
                return null;
            }
        }));

        return items.filter(item => item !== null);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }
}

// Call this function to fetch and return the inventory
fetchInventory().then(items => {
    const inventoryPath = path.join(__dirname, 'inventory.json');
    fs.writeFileSync(inventoryPath, JSON.stringify({ items }, null, 2));
    console.log(`Saved ${items.length} items to inventory.json`);
});