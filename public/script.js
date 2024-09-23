'use strict';

// Use environment variables for sensitive information
const APP_ID = process.env.APP_ID; // Set this in your .env file
const LOCATION_ID = process.env.LOCATION_ID; // Set this in your .env file

let items = [];
let payments;

document.addEventListener('DOMContentLoaded', initializePageFunctionality);

function initializePageFunctionality() {
    const {
        inventoryList,
        paymentForm,
        checkoutButton,
        cartItems,
        cartTotal,
        logo
    } = {
        inventoryList: document.querySelector('#inventory-list'),
        paymentForm: document.querySelector('#payment-form'),
        checkoutButton: document.getElementById('checkout-button'),
        cartItems: document.getElementById('cart-items'),
        cartTotal: document.getElementById('cart-total'),
        logo: document.querySelector('.logo')
    };

    if (inventoryList) {
        loadInventory();
    }
    if (paymentForm) {
        initializePaymentForm();
    }
    if (checkoutButton) {
        checkoutButton.addEventListener('click', showPaymentForm);
    }
    if (cartItems && cartTotal) {
        updateCartDisplay();
    }
    if (logo) {
        logo.addEventListener('click', dissipateLogo);
    }
}

async function loadInventory() {
    try {
        const response = await fetch('/api/inventory');
        items = (await response.json()).items;
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
            body: JSON.stringify({ itemId, quantity: 1 })
        });
        const { success } = await response.json();
        if (success) {
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function removeFromCart(itemId) {
    try {
        const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId })
        });
        const { success } = await response.json();
        updateCartDisplay();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

async function updateCartDisplay() {
    try {
        const response = await fetch('/api/cart');
        const { cart } = await response.json();

        const { cartItems, cartTotal, checkoutButton } = {
            cartItems: document.getElementById('cart-items'),
            cartTotal: document.getElementById('cart-total'),
            checkoutButton: document.getElementById('checkout-button')
        };

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

function showPaymentForm() {
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.style.display = 'block';
    }
}

async function initializePaymentForm() {
    if (!window.Square) {
        console.error('Square.js failed to load properly');
        return;
    }

    try {
        payments = window.Square.payments(APP_ID, LOCATION_ID);
        const card = await payments.card();
        await card.attach('#card-container');

        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
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
        }
    } catch (e) {
        console.error('Initializing Card failed', e);
        displayPaymentResults('Initializing Card failed');
    }
}

async function processPayment(token) {
    const data = {
        token,
        customerDetails: getCustomerDetails()
    };

    try {
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    const { value: name } = document.getElementById('card-name');
    const { value: email } = document.getElementById('customer-email');
    const { value: phone } = document.getElementById('customer-phone');
    const { value: address } = document.getElementById('shipping-address');

    return { name, email, phone, address };
}

function displayPaymentResults(status) {
    const statusContainer = document.getElementById('payment-status-container');
    if (statusContainer) {
        statusContainer.textContent = status;
    }
}

async function clearCart() {
    try {
        await fetch('/api/cart/clear', { method: 'POST' });
        updateCartDisplay();
    } catch (error) {
        console.error('Error clearing cart:', error);
    }
}

function createParticles(element, particleCount) {
    const rect = element.getBoundingClientRect();
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * rect.width + rect.left}px`;
        particle.style.top = `${Math.random() * rect.height + rect.top}px`;
        document.body.appendChild(particle);
        particles.push(particle);
    }
    return particles;
}

function animateParticles(particles, toHeart) {
    const heartCenterX = window.innerWidth / 2;
    const heartCenterY = window.innerHeight / 2;
    const heartRadius = 100;

    particles.forEach((particle, index) => {
        const angle = (index / particles.length) * 2 * Math.PI;
        const endX = toHeart ? heartCenterX + heartRadius * Math.cos(angle) : Math.random() * window.innerWidth;
        const endY = toHeart ? heartCenterY + heartRadius * Math.sin(angle) - heartRadius / 2 : Math.random() * window.innerHeight;

        particle.style.setProperty('--end-x', `${endX - parseFloat(particle.style.left)}px`);
        particle.style.setProperty('--end-y', `${endY - parseFloat(particle.style.top)}px`);
        particle.style.animation = `particleAnimation 2s ease-out forwards`;
        particle.style.opacity = toHeart ? '1' : '0';
    });

    if (toHeart) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.style.left = `${heartCenterX - 5}px`;
            heart.style.top = `${heartCenterY - 5}px`;
            document.body.appendChild(heart);
            heart.style.animation = 'heartAnimation 1s ease-out forwards, fadeOut 1s ease-out 2s forwards';

            // Remove the heart after animation completes
            setTimeout(() => {
                heart.remove();
            }, 3000);
        }, 2000);
    }
}

// sourcery skip: use-braces
function dissipateLogo() {
    console.log('Dissipating logo');
    const logo = document.querySelector('.logo');
    if (logo) {
        const particles = createParticles(logo, 100);
        console.log('Created particles:', particles.length);
        logo.style.opacity = '0';
        setTimeout(() => {
            logo.style.display = 'none';
            animateParticles(particles, true);
        }, 1000);

        // Remove particles after animation
        setTimeout(() => {
            particles.forEach(p => p.remove());
        }, 4000);
    } else {
        console.error('Logo element not found');
    }
}

function restoreLogo() {
    const logo = document.querySelector('.logo');
    if (logo && logo.style.display === 'none') {
        // Remove any existing particles or hearts
        document.querySelectorAll('.particle, .heart').forEach(el => el.remove());

        const particles = createParticles(document.body, 100);
        animateParticles(particles, false);
        setTimeout(() => {
            logo.style.display = '';
            logo.style.opacity = '1';
            particles.forEach(p => p.remove());
        }, 2000);
    }
}

// Update the event listener to toggle between dissipate and restore
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    const logoContainer = document.querySelector('.logo-container');
    console.log('Logo container:', logoContainer);
    if (logoContainer) {
        logoContainer.addEventListener('click', () => {
            console.log('Logo container clicked');
            const logo = document.querySelector('.logo');
            console.log('Logo element:', logo);
            if (logo.style.display === 'none') {
                restoreLogo();
            } else {
                dissipateLogo();
            }
        });
    } else {
        console.error('Logo container not found');
    }
});