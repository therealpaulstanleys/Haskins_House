// Remove this line as we'll use relative URLs
// const API_BASE_URL = 'https://your-server-url.com';

const APP_ID = 'sandbox-sq0idb-xyfwMjNNL94zoBbn2Aswfw';
const LOCATION_ID = 'LYCJZ87TJ8EHY'; // Replace with your actual location ID

let items = [];
let cart = [];

// Initialize Square payment form
async function initializePaymentForm() {
    if (!Square) {
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
            }
        });
    } catch (e) {
        console.error('Initializing Card failed:', e);
    }
}

// Process payment using Square
async function processPayment(token) {
    try {
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId: token,
                amount: calculateTotal() * 100,
                locationId: LOCATION_ID,
                idempotencyKey: uuidv4(),
                customerDetails: getCustomerDetails()
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
        const response = await fetch('/api/inventory');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        items = data.items; // Store items globally
        displayInventory(data.items);
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventory-list').innerHTML = '<p>Error loading inventory. Please try again later.</p>';
    }
}

function displayInventory(items) {
    const inventoryList = document.getElementById('inventory-list');
    if (items.length === 0) {
        inventoryList.innerHTML = '<p>No items in inventory.</p>';
        return;
    }

    const itemsHtml = items.map(item => `
        <div class="inventory-item">
            <h3>${item.name}</h3>
            <p>Price: $${(item.price / 100).toFixed(2)}</p>
            <p>${item.description || 'No description available.'}</p>
            <button onclick="addToCart('${item.id}')">Add to Cart</button>
        </div>
    `).join('');

    inventoryList.innerHTML = itemsHtml;
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
document.addEventListener('DOMContentLoaded', function() {
    // Load catalog preview
    loadCatalogPreview();

    // Setup newsletter form
    setupNewsletterForm();

    // Load inventory if on the inventory page
    if (document.querySelector('#inventory-list')) {
        loadInventory();
    }

    // Initialize payment form if on the checkout page
    if (document.querySelector('#payment-form')) {
        initializePaymentForm();
    }
});

async function loadCatalogPreview() {
    try {
        const response = await fetch('/api/catalog-preview');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayCatalogPreview(data.items);
    } catch (error) {
        console.error('Error loading catalog preview:', error);
        document.getElementById('catalog-preview').innerHTML = '<p>Error loading preview. Please try again later.</p>';
    }
}

function displayCatalogPreview(items) {
    const previewContainer = document.getElementById('catalog-preview');
    if (!previewContainer) return;
    
    if (items.length === 0) {
        previewContainer.innerHTML = '<p>No items available for preview.</p>';
        return;
    }

    const itemsHtml = items.map(item => `
        <div class="preview-item">
            <img src="${item.imageUrl}" alt="${item.name}" class="preview-image">
            <h3>${item.name}</h3>
            <p>Price: $${(item.price / 100).toFixed(2)}</p>
        </div>
    `).join('');

    previewContainer.innerHTML = itemsHtml;
}

function setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            try {
                const response = await fetch('/api/newsletter-signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                alert(result.message); // Show success message
                form.reset(); // Clear the form
            } catch (error) {
                console.error('Error signing up for newsletter:', error);
                alert('There was an error signing up for the newsletter. Please try again later.');
            }
        });
    }
}

console.log('Script loaded successfully!');
