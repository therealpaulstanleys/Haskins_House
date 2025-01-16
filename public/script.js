'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Load components
    loadComponent('header', '/components/header.html');
    loadComponent('footer', '/components/footer.html');

    initializePageFunctionality();
    flickerLights();

    // Newsletter subscription form handling
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }

    // Logo click animations
    const explodingLogo = document.getElementById('exploding-logo');
    if (explodingLogo) {
        explodingLogo.addEventListener('click', handleLogoClick);
    }
});

async function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const submitButton = e.target.querySelector('button');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing...';

    try {
        const response = await fetch('/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (data.success) {
            submitButton.textContent = 'Subscribed!';
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
            e.target.reset();
        } else {
            submitButton.textContent = 'Error - Try Again';
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
        }
    } catch (error) {
        console.error('Error:', error);
        submitButton.textContent = 'Error - Try Again';
        setTimeout(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 2000);
    }
}

function handleLogoClick() {
    this.classList.add('explode');
    setTimeout(() => {
        this.classList.remove('explode');
    }, 1500);
}

async function initializePageFunctionality() {
    try {
        const response = await fetch('/api/inventory');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const items = await response.json();
        displayInventory(items);
    } catch (error) {
        console.error('Error loading inventory:', error);
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = 'Error loading featured items. Please try again later.';
        }
    }
}

function displayInventory(items) {
    const container = document.getElementById('featured-items-container');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="no-items">No items available at this time.</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="item">
            <img src="${item.image || '/images/haskins-house-4.jpg'}" alt="${item.name}" loading="lazy">
            <h3>${item.name || 'Unnamed Item'}</h3>
            <p class="price">$${((item.price || 0) / 100).toFixed(2)}</p>
            <p class="condition">${item.condition || 'New'}</p>
            <button onclick="addToCart('${item.id}')" class="add-to-cart">Add to Cart</button>
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
        alert('Could not add item to cart. Please try again.');
    }
}

function flickerLights() {
    const body = document.body;
    const settings = {
        flickerDuration: 300,
        flickerCount: 10
    };

    const { flickerDuration, flickerCount } = settings;

    for (let i = 0; i < flickerCount; i++) {
        setTimeout(() => {
            body.style.backgroundColor = i % 2 === 0 ? '#fff' : '#f8f8f8';
        }, i * flickerDuration);
    }

    setTimeout(() => {
        body.style.backgroundColor = '#fff';
    }, flickerCount * flickerDuration);
}

async function loadComponent(id, path) {
    try {
        const response = await fetch(path);
        const html = await response.text();
        document.getElementById(id).innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
    }
}

// Store functionality
let inventory = [];
let cart = [];

async function initializeStore() {
    showLoading(true);
    try {
        const response = await fetch('/api/inventory');
        const data = await response.json();
        inventory = data.items;
        displayInventory(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showError('Failed to load inventory');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const container = document.getElementById('featured-items-container');
    if (container) {
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

function displayInventory(items) {
    const container = document.getElementById('featured-items-container');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="no-items">No items available at this time.</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="item" data-id="${item.id}">
            <img src="${item.imageUrl || '/images/placeholder.jpg'}" alt="${item.name}" loading="lazy">
            <h3>${item.name}</h3>
            <p class="price">$${(item.price / 100).toFixed(2)}</p>
            <p class="stock">In Stock: ${item.stockQuantity}</p>
            <button onclick="addToCart('${item.id}')" class="btn btn-primary">Add to Cart</button>
        </div>
    `).join('');
}

function filterByCategory() {
    const category = document.getElementById('category-select').value;
    const filtered = category === 'all' ?
        inventory :
        inventory.filter(item => item.category === category);
    displayInventory(filtered);
}

function sortItems() {
    const sortBy = document.getElementById('sort-select').value;
    const sorted = [...inventory].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return b.id.localeCompare(a.id); // newest first
        }
    });
    displayInventory(sorted);
}

async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
        const formData = {
            name: form.name.value,
            email: form.email.value,
            subject: form.subject.value,
            message: form.message.value
        };

        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            submitButton.textContent = 'Message Sent!';
            form.reset();
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error:', error);
        submitButton.textContent = 'Error - Try Again';
        setTimeout(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 2000);
    }
}