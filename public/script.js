'use strict';

document.addEventListener('DOMContentLoaded', initializePageFunctionality);

async function initializePageFunctionality() {
    try {
        const response = await fetch('/api/catalog'); // Updated to use /api/catalog
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
        items.map(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.setAttribute('data-id', item.id);

            const img = document.createElement('img');
            img.src = item.imageUrl || '/images/default.png'; // Fallback image if none exists
            img.alt = item.name;
            img.className = 'item-image';

            const name = document.createElement('h3');
            name.textContent = item.name;

            const price = document.createElement('p');
            price.textContent = `Price: $${(item.price / 100).toFixed(2)}`;

            const stockQuantity = document.createElement('p');
            stockQuantity.className = 'stock-quantity';
            stockQuantity.textContent = `In Stock: ${item.stockQuantity}`;

            const button = document.createElement('button');
            button.textContent = item.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart';
            button.disabled = item.stockQuantity === 0;
            button.addEventListener('click', () => addToCart(item.id));

            itemDiv.appendChild(img);
            itemDiv.appendChild(name);
            itemDiv.appendChild(price);
            itemDiv.appendChild(stockQuantity);
            itemDiv.appendChild(button);

            return itemDiv.outerHTML;
        }).join('');
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