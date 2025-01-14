'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initializePageFunctionality();
    flickerLights();
    animateLogo();

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
            alert('Thank you for subscribing to our newsletter!');
            e.target.reset();
        } else {
            alert('Subscription failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
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
            <h3>${item.name || 'Unnamed Item'}</h3>
            <p class="price">$${((item.price || 0) / 100).toFixed(2)}</p>
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

function animateLogo() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    gsap.fromTo(logo, {
        scale: 0,
        opacity: 0
    }, {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: "bounce.out",
        onComplete: () => {
            gsap.to(logo, {
                scale: 1.2,
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }
    });
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