require('dotenv').config();
const { Client, Environment } = require('square');
const fs = require('fs');
const path = require('path');

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox // Change to Environment.Production for production
});

async function fetchInventory() {
  try {
    console.log('Fetching catalog items from Square...');
    const response = await squareClient.catalogApi.listCatalog(undefined, 'ITEM');
    
    console.log('API Response:', JSON.stringify(response, null, 2));

    if (!response.result || !response.result.objects) {
      console.log('No catalog items found or unexpected response structure.');
      return;
    }

    console.log(`Found ${response.result.objects.length} items in Square catalog`);

    const items = await Promise.all(response.result.objects.map(async (item) => {
      try {
        const inventoryResponse = await squareClient.inventoryApi.retrieveInventoryCount(item.id);
        const stockQuantity = inventoryResponse.result.counts[0]?.quantity || 0;

        return sanitizeItem({
          id: item.id,
          name: item.itemData.name,
          price: item.itemData.variations[0].itemVariationData.priceMoney.amount,
          description: item.itemData.description || '',
          imageUrl: item.itemData.imageIds ? `/image/${item.itemData.imageIds[0]}` : '',
          stockQuantity: stockQuantity,
          genre: item.itemData.categories ? item.itemData.categories[0] : '',
          releaseYear: item.itemData.releaseDate ? new Date(item.itemData.releaseDate).getFullYear() : '',
          format: 'Vinyl', // Assuming all items are vinyl
          artist: item.itemData.name.split(' - ')[0]
        });
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        return null;
      }
    }));

    const validItems = items.filter(item => item !== null);

    const inventoryData = { items: validItems };
    const inventoryPath = path.join(__dirname, 'inventory.json');
    try {
      fs.writeFileSync(inventoryPath, JSON.stringify(inventoryData, null, 2));
      console.log(`Saved ${validItems.length} items to inventory.json`);
    } catch (error) {
      console.error('Error writing inventory file:', error);
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    console.log('Error details:', error.result);
  }
}

function sanitizeItem(item) {
  return {
    ...item,
    name: item.name.replace(/[<>&'"]/g, ''),
    description: item.description.replace(/[<>&'"]/g, ''),
    // Add more fields as needed
  };
}

fetchInventory();
