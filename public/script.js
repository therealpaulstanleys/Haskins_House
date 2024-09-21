// Remove this line as we'll use relative URLs
// const API_BASE_URL = 'https://your-server-url.com';

const APP_ID = 'sandbox-sq0idb-xyfwMjNNL94zoBbn2Aswfw';
const LOCATION_ID = 'LYCJZ87TJ8EHY'; // Replace with your actual location ID
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

let items = [];
let cart = [];
let socket;

function setupWebSocket() {
  socket = new WebSocket(WS_URL);
  
  socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'inventory_update') {
      updateItemInDisplay(data.item);
    }
  };

  socket.onclose = function(event) {
    console.log('WebSocket connection closed. Reconnecting...');
    setTimeout(setupWebSocket, 3000);
  };
}

function updateItemInDisplay(updatedItem) {
  const itemElement = document.querySelector(`.inventory-item[data-id="${updatedItem.id}"]`);
  if (itemElement) {
    if (updatedItem.stockQuantity !== undefined) {
      const stockQuantityElement = itemElement.querySelector('.stock-quantity');
      if (stockQuantityElement) {
        stockQuantityElement.textContent = `In Stock: ${updatedItem.stockQuantity}`;
      }
      const addButton = itemElement.querySelector('button');
      if (addButton) {
        if (updatedItem.stockQuantity === 0) {
          addButton.disabled = true;
          addButton.textContent = 'Out of Stock';
        } else {
          addButton.disabled = false;
          addButton.textContent = 'Add to Cart';
        }
      }
    }
    // Update other properties if they're provided in the updatedItem object
    if (updatedItem.name !== undefined) {
      const nameElement = itemElement.querySelector('h3');
      if (nameElement) {
        nameElement.textContent = updatedItem.name;
      }
    }
    if (updatedItem.price !== undefined) {
      const priceElement = itemElement.querySelector('p:nth-of-type(1)');
      if (priceElement) {
        priceElement.textContent = `Price: $${(updatedItem.price / 100).toFixed(2)}`;
      }
    }
    if (updatedItem.imageUrl !== undefined) {
      const imageElement = itemElement.querySelector('img');
      if (imageElement) {
        imageElement.src = updatedItem.imageUrl;
        imageElement.alt = updatedItem.name || 'Product image';
      }
    }
  }
}

async function initializePaymentForm() {
    if (typeof Square === 'undefined') {
        console.error('Square.js failed to load properly');
        return;
    }

    const payments = Square.payments(APP_ID, LOCATION_ID);

    try {
        const card = await payments.card();
        await card.attach('#card-container');

        const form = document.getElementById('payment-form');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            try {
                const result = await card.tokenize();
                if (result.status === 'OK') {
                    console.log(`Payment token is ${result.token}`);
                    await processPayment(result.token);
                }
            } catch (e) {
                console.error('Tokenization failed:', e);
                showError('Payment tokenization failed. Please try again.');
            }
        });
    } catch (e) {
        console.error('Initializing Card failed:', e);
        showError('Failed to initialize payment form. Please refresh the page and try again.');
    }
}

async function processPayment(token) {
    try {
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId: token,
                amount: calculateTotal() * 100,
                locationId: LOCATION_ID,
                idempotencyKey: generateUniqueId(),
                customerDetails: getCustomerDetails()
            }),
        });
        const result = await response.json();
        if (result.payment && result.payment.status === 'COMPLETED') {
            showSuccess('Payment successful!');
            clearCart();
        } else {
            throw new Error('Payment failed');
        }
    } catch (error) {
        console.error(error);
        showError('Payment failed. Please try again.');
    }
}

async function loadInventory() {
    try {
        console.log('Fetching catalog items...');
        const response = await fetch('/get-catalog-items');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received inventory data:', data);
        
        items = data.items;
        console.log('Number of items:', items.length);
        displayInventory(items);
    } catch (error) {
        console.error('Error loading inventory:', error);
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = 'Error loading inventory. Please try again later.';
        }
    }
}

function displayInventory(items) {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    if (items.length === 0) {
        inventoryList.innerHTML = '<p>No items in inventory.</p>';
        return;
    }

    const itemsHtml = items.map(item => `
        <div class="inventory-item" data-id="${item.id}">
            <img src="${item.imageUrl}" alt="${item.name}" class="item-image">
            <h3>${item.name}</h3>
            <p>Price: $${(item.price / 100).toFixed(2)}</p>
            <p class="stock-quantity">In Stock: ${item.stockQuantity}</p>
            <button onclick="addToCart('${item.id}')" ${item.stockQuantity === 0 ? 'disabled' : ''}>
                ${item.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    `).join('');

    inventoryList.innerHTML = itemsHtml;
}

function addToCart(itemId) {
    const item = items.find(i => i.id === itemId);
    if (item) {
        cart.push(item);
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = cart.map(item => `
        <div>${item.name} - $${(item.price / 100).toFixed(2)}</div>
    `).join('');

    const cartTotal = document.getElementById('cart-total');
    cartTotal.textContent = `Total: $${calculateTotal().toFixed(2)}`;
}

function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price / 100, 0);
}

function clearCart() {
    cart = [];
    updateCartDisplay();
}

function getCustomerDetails() {
    return {
        name: document.getElementById('card-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('shipping-address').value
    };
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showError(message) {
    // Implement a user-friendly error display method
    console.error(message);
    // For example, update a designated error message element on the page
}

function showSuccess(message) {
    // Implement a user-friendly success message display method
    console.log(message);
    // For example, update a designated success message element on the page
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('#inventory-list')) {
        loadInventory();
    }

    if (document.querySelector('#payment-form')) {
        initializePaymentForm();
    }

    setupWebSocket();
});

console.log('Script loaded successfully!');
