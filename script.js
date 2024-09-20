const API_BASE_URL = 'https://7734-198-54-130-91.ngrok-free.app';
const APP_ID = 'sandbox-sq0idb-xyfwMjNNL94zoBbn2Aswfw';
const LOCATION_ID = 'LYCJZ87TJ8EHY';

let items = [];
let cart = [];

// Initialize Square payment form
async function initializePaymentForm() {
    try {
        if (!window.Square) {
            throw new Error('Square.js failed to load properly');
        }

        const payments = window.Square.payments(APP_ID, LOCATION_ID);
        const card = await payments.card();
        await card.attach('#card-container');

        const cardButton = document.getElementById('card-button');
        cardButton.addEventListener('click', handlePayment);

        console.log('Payment form initialized successfully');
    } catch (error) {
        console.error('Payment form initialization error:', error);
        alert('Failed to initialize payment form. Please refresh and try again.');
    }
}

// Handle payment submission
async function handlePayment(event) {
    event.preventDefault();
    const card = await window.Square.payments(APP_ID, LOCATION_ID).card();
    const customerDetails = getCustomerDetails();

    try {
        const result = await card.tokenize();
        if (result.status === 'OK') {
            await processPayment(result.token, customerDetails);
        }
    } catch (e) {
        console.error('Payment tokenization failed:', e);
        alert('Payment failed. Please try again.');
    }
}

// Process payment using Square
async function processPayment(token, customerDetails) {
    try {
        const response = await fetch(`${API_BASE_URL}/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId: token,
                amount: calculateTotal() * 100,
                locationId: LOCATION_ID,
                idempotencyKey: uuidv4(),
                customerDetails: customerDetails
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
        console.error('Payment processing error:', error);
        alert('Payment failed. Please try again.');
    }
}

// Load inventory items from JSON file
async function loadInventory() {
    const inventoryList = document.getElementById('inventory-list');
    
    try {
        const response = await fetch('/api/inventory.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        items = await response.json();

        inventoryList.innerHTML = items.map(item => `
            <div class="inventory-item">
                <img src="${item.imageUrl || 'placeholder.jpg'}" alt="${item.name}" aria-label="${item.name}">
                <h3>${item.name}</h3>
                <p>$${item.price.toFixed(2)}</p>
                <button class="add-to-cart" data-id="${item.id}" aria-label="Add ${item.name} to cart">Add to Cart</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading inventory:', error);
        inventoryList.innerHTML = '<p>Error loading inventory. Please try again later.</p>';
    }
}

// Shopping cart functionality
function addToCart(itemId) {
    const item = items.find(item => item.id === itemId);
    if (item) {
        cart.push(item);
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const cartElement = document.getElementById('cart');
    cartElement.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)}</span>
        </div>
    `).join('');

    const total = calculateTotal();
    cartElement.innerHTML += `
        <div class="cart-total">Total: $${total.toFixed(2)}</div>
    `;
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
document.addEventListener('DOMContentLoaded', () => {
    initializePaymentForm();
    loadInventory();

    document.getElementById('inventory-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart')) {
            const itemId = event.target.getAttribute('data-id');
            addToCart(itemId);
        }
    });
});
