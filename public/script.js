'use strict';

document.addEventListener('DOMContentLoaded', initializePageFunctionality);

async function initializePageFunctionality() {
    try {
        const response = await fetch('/api/inventory');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const { items } = await response.json();
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
    if (!inventoryList) {
        return;
    }

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

async function addToCart(itemId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId })
        });

        if (!response.ok) {
            throw new Error('Failed to add item to cart');
        }

        const { success } = await response.json();
        if (success) {
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Could not add item to cart. Please try again.'); // User feedback
    }
}

async function updateCartDisplay() {
    try {
        const response = await fetch('/api/cart');
        const { cart } = await response.json();

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
                checkoutButton.style.display = cart.length > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Error updating cart display:', error);
    }
}