const API_BASE_URL = 'https://7734-198-54-130-91.ngrok-free.app';

// Initialize Square payment form
async function initializePaymentForm() {
    const appId = 'sandbox-sq0idb-xyfwMjNNL94zoBbn2Aswfw'; // Your provided app ID
    const locationId = 'LYCJZ87TJ8EHY'; // Replace with your actual location ID

    try {
        if (!window.Square) {
            throw new Error('Square.js failed to load properly');
        }

        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();
        await card.attach('#card-container');

        const cardButton = document.getElementById('card-button');
        const cardNameInput = document.getElementById('card-name');
        const customerEmailInput = document.getElementById('customer-email');
        const customerPhoneInput = document.getElementById('customer-phone');
        const shippingAddressInput = document.getElementById('shipping-address');

        cardButton.addEventListener('click', async function(event) {
            event.preventDefault();

            try {
                const result = await card.tokenize();
                if (result.status === 'OK') {
                    console.log('Payment token generated:', result.token);
                    // Call your backend to process the payment
                    await processPayment(result.token, {
                        name: cardNameInput.value,
                        email: customerEmailInput.value,
                        phone: customerPhoneInput.value,
                        address: shippingAddressInput.value
                    });
                }
            } catch (e) {
                console.error('Payment tokenization failed:', e);
                alert('Payment failed. Please try again.');
            }
        });

        console.log('Payment form initialized successfully');
    } catch (error) {
        console.error('Payment form initialization error:', error);
        alert('Failed to initialize payment form. Please refresh and try again.');
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
                amount: calculateTotal() * 100, // Make sure this function exists and returns the correct amount
                locationId: 'LYCJZ87TJ8EHY',
                idempotencyKey: uuidv4(), // Make sure this function exists
                customerDetails: customerDetails
            }),
        });
        const result = await response.json();
        if (result.payment && result.payment.status === 'COMPLETED') {
            alert('Payment successful!');
            clearCart(); // Make sure this function exists
        } else {
            throw new Error('Payment failed');
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        alert('Payment failed. Please try again.');
    }
}

// Load inventory items from Square Catalog API
async function loadInventory() {
    const inventoryList = document.getElementById('inventory-list');
    
    try {
        const response = await fetch(`${API_BASE_URL}/get-catalog-items`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(items)) {
            throw new Error('Invalid data format: expected an array of items');
        }

        inventoryList.innerHTML = items.map(item => `
            <div class="inventory-item">
                <img src="${item.imageUrl || 'placeholder.jpg'}" alt="${item.itemData.name}" aria-label="${item.itemData.name}">
                <h3>${item.itemData.name}</h3>
                <p>$${(item.itemData.variations[0].itemVariationData.priceMoney.amount / 100).toFixed(2)}</p>
                <button class="add-to-cart" data-id="${item.id}" aria-label="Add ${item.itemData.name} to cart">Add to Cart</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading inventory:', error);
        inventoryList.innerHTML = '<p>Error loading inventory. Please try again later.</p>';
    }
}

// Shopping cart functionality
let cart = [];

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

// Generate UUID for idempotency key
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// Remove console.log statements for production
