const API_BASE_URL = 'https://your-server-url.com';
const APP_ID = 'your-square-app-id';
const LOCATION_ID = 'your-square-location-id';

let items = [];
let cart = [];

// Initialize Square payment form
async function initializePaymentForm() {
    if (!window.Square) {
        throw new Error('Square.js failed to load properly');
    }

    const payments = window.Square.payments(APP_ID, LOCATION_ID);
    const card = await payments.card();
    await card.attach('#card-container');

    const cardButton = document.getElementById('card-button');
    cardButton.addEventListener('click', async function(event) {
        event.preventDefault();

        try {
            const result = await card.tokenize();
            if (result.status === 'OK') {
                await processPayment(result.token);
            }
        } catch (e) {
            console.error(e);
            alert('Payment failed. Please try again.');
        }
    });
}

// Process payment using Square
async function processPayment(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId: token,
                amount: calculateTotal() * 100,
                locationId: LOCATION_ID
            }),
        });
        const result = await response.json();
        if (result.payment && result.payment.status === 'COMPLETED') {
            alert('Payment successful!');
            clearCart();
        } else {
            throw new Error('Payment failed');
        }
    } catch (error) {
        console.error(error);
        alert('Payment failed. Please try again.');
    }
}

// Load inventory items from JSON file
async function loadInventory() {
    try {
        const response = await fetch('/api/inventory.json');
        const data = await response.json();
        displayInventory(data.inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventory-list').innerHTML = '<p>Error loading inventory. Please try again later.</p>';
    }
}

function displayInventory(items) {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = items.map(item => `
        <div class="inventory-item">
            <h3>${item.title}</h3>
            <p>${item.artist}</p>
            <p>$${item.price.toFixed(2)}</p>
            <button onclick="addToCart('${item.id}')">Add to Cart</button>
        </div>
    `).join('');
}

// Shopping cart functionality
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
        <div>${item.title} - $${item.price.toFixed(2)}</div>
    `).join('');

    const cartTotal = document.getElementById('cart-total');
    cartTotal.textContent = `Total: $${calculateTotal().toFixed(2)}`;
}

function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price, 0);
}

function clearCart() {
    cart = [];
    updateCartDisplay();
}

// Helper functions
function getCustomerDetails() {
    return {
        name: document.getElementById('card-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('shipping-address').value
    };
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadInventory();
    await initializePaymentForm();
});
