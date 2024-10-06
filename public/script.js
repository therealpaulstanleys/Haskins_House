'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initializePageFunctionality(); // Initialize page functionality on load
});

let allItems = []; // Store all items globally

async function initializePageFunctionality() {
    try {
        const response = await fetch('/api/inventory'); // Fetch inventory from the server
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        allItems = await response.json(); // Store all items
        displayStoreItems(allItems); // Display all items initially
    } catch (error) {
        console.error('Error loading store items:', error);
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = 'Error loading store items. Please try again later.';
        }
    }
}

function filterByCategory() {
    const selectedCategory = document.getElementById('category-select').value;
    const filteredItems = selectedCategory === 'all' ? allItems : allItems.filter(item => item.category === selectedCategory);
    displayStoreItems(filteredItems); // Update displayed items based on selected category
}

function displayStoreItems(items) {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) {
        return; // Exit if inventory list is not found
    }

    inventoryList.innerHTML = items.length === 0 ? '<p>No items in store.</p>' :
        items.map(item => {
            return `
                <div class="store-item">
                    <img src="${item.imageUrl || '/images/default.png'}" alt="${item.name}" class="item-image">
                    <h3>${item.name}</h3>
                    <p>Price: $${(item.price / 100).toFixed(2)}</p>
                    <p>In Stock: ${item.stockQuantity}</p>
                    <button onclick="addToCart('${item.id}')" ${item.stockQuantity === 0 ? 'disabled' : ''}>
                        ${item.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            `;
        }).join(''); // Populate inventory list with items
}

async function addToCart(itemId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId }) // Send item ID to the server
        });

        if (!response.ok) {
            throw new Error('Failed to add item to cart');
        }

        const { success } = await response.json();
        if (success) {
            updateCartDisplay(); // Update cart display if item was added successfully
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Could not add item to cart. Please try again.'); // User feedback
    }
}

async function updateCartDisplay() {
    try {
        const response = await fetch('/api/cart');
        const { cart } = await response.json(); // Fetch current cart items

        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const checkoutButton = document.getElementById('checkout-button');

        if (cartItems && cartTotal) {
            cartItems.innerHTML = cart.map(item => `
                <div>${item.name} - $${(item.price / 100).toFixed(2)} x ${item.quantity}
                    <button onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
            `).join('');

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity) / 100, 0);
            cartTotal.textContent = `Total: $${total.toFixed(2)}`;

            if (checkoutButton) {
                checkoutButton.style.display = cart.length > 0 ? 'block' : 'none'; // Show or hide checkout button
            }
        }
    } catch (error) {
        console.error('Error updating cart display:', error);
    }
}

// Function to update inventory display on page load
async function updateInventoryDisplay() {
    try {
        const response = await fetch('/api/inventory');
        const { items } = await response.json(); // Ensure this matches your API response structure

        const inventoryList = document.getElementById('inventory-list');
        inventoryList.innerHTML = items.map(item => `
            <div>
                <h3>${item.name}</h3>
                <p>Price: $${(item.price / 100).toFixed(2)}</p>
                <p>Stock: ${item.stockQuantity}</p>
                <button onclick="addToCart('${item.id}')">Add to Cart</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating inventory display:', error);
    }
}

// Call this function on page load
window.onload = updateInventoryDisplay; // Ensure inventory is displayed when the store page loads