'use strict';

const APP_ID = 'sandbox-sq0idb-xyfwMjNNL94zoBbn2Aswfw';
const LOCATION_ID = 'LYCJZ87TJ8EHY';

let items = [];
let cart = [];
let payments;

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('#inventory-list')) {
        loadInventory();
    }

    if (document.querySelector('#payment-form')) {
        initializePaymentForm();
    }

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', showPaymentForm);
    }
});

async function loadInventory() {
    try {
        const response = await fetch('/api/inventory');
        const data = await response.json();
        items = data.items;
        displayInventory(items);
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('loading-message').textContent = 'Error loading inventory. Please try again later.';
    }
}

function displayInventory(items) {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    inventoryList.innerHTML = items.length === 0 ? '<p>No items in inventory.</p>' : 
        items.map(item => `
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
    const cartTotal = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');
    
    if (cartItems && cartTotal) {
        cartItems.innerHTML = cart.map(item => `
            <div>${item.name} - $${(item.price / 100).toFixed(2)}</div>
        `).join('');
        cartTotal.textContent = `Total: $${calculateTotal().toFixed(2)}`;
        
        if (checkoutButton) {
            checkoutButton.style.display = cart.length > 0 ? 'block' : 'none';
        }
    }
}

function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price / 100, 0);
}

function showPaymentForm() {
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.style.display = 'block';
    }
}

async function initializePaymentForm() {
    if (!window.Square) {
        throw new Error('Square.js failed to load properly');
    }

    payments = window.Square.payments(APP_ID, LOCATION_ID);
    try {
        const card = await payments.card();
        await card.attach('#card-container');

        const paymentForm = document.getElementById('payment-form');
        paymentForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            try {
                const result = await card.tokenize();
                if (result.status === 'OK') {
                    await processPayment(result.token);
                }
            } catch (e) {
                console.error(e);
                displayPaymentResults('Payment Failed');
            }
        });
    } catch (e) {
        console.error('Initializing Card failed', e);
        displayPaymentResults('Initializing Card failed');
    }
}

async function processPayment(token) {
    const data = {
        token,
        amount: calculateTotal() * 100, // Convert to cents
        customerDetails: getCustomerDetails()
    };

    try {
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            displayPaymentResults('Payment Successful');
            clearCart();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        displayPaymentResults(`Payment Failed: ${error.message}`);
    }
}

function getCustomerDetails() {
    return {
        name: document.getElementById('card-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('shipping-address').value
    };
}

function displayPaymentResults(status) {
    const statusContainer = document.getElementById('payment-status-container');
    if (statusContainer) {
        statusContainer.textContent = status;
    }
}

function clearCart() {
    cart = [];
    updateCartDisplay();
}
