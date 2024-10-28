'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initializePageFunctionality();
    flickerLights();
    animateLogo();
    // Commented out until you have a valid Instagram API token
    // fetchInstagramImages();

    // Newsletter subscription form handling
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async(e) => {
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
                    alert('Subscription successful!');
                    newsletterForm.reset();
                } else {
                    alert('Subscription failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }

    // Add this JavaScript
    document.getElementById('exploding-logo').addEventListener('click', function() {
        this.classList.add('explode');

        // Reset animation after it completes
        setTimeout(() => {
            this.classList.remove('explode');
        }, 1500);
    });

    document.querySelector('.logo').addEventListener('click', function() {
        // First make the logo bigger
        this.style.transform = 'scale(1.5)';

        // Then change it to a heart shape
        setTimeout(() => {
            this.src = '/images/heart.png'; // Make sure you have a heart.png image!
        }, 500);

        // Make it float away
        setTimeout(() => {
            this.style.transform = 'scale(1.5) translateY(-100vh)';
            this.style.opacity = '0';
        }, 1000);

        // Reset the logo after animation
        setTimeout(() => {
            this.src = '/images/logo.png';
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
        }, 2000);
    });
});

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

    // Add loading state
    container.innerHTML = '<div>Loading...</div>';

    // If no items, show message
    if (!items || items.length === 0) {
        container.innerHTML = '<div>No items available at this time.</div>';
        return;
    }

    // Display items
    container.innerHTML = items.map(item => `
        <div class="item">
            <h3>${item.name || 'Unnamed Item'}</h3>
            <p>Price: $${((item.price || 0) / 100).toFixed(2)}</p>
            <button onclick="addToCart('${item.id}')">Add to Cart</button>
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

// Replace the GSAP-dependent animateLogo function with vanilla JS
function animateLogo() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    // Create particle effect
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        document.body.appendChild(particle);

        particle.style.cssText = `
            position: absolute;
            left: ${window.innerWidth / 2}px;
            top: ${window.innerHeight / 2}px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: hsl(${Math.random() * 360}, 100%, 50%);
            pointer-events: none;
        `;

        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 5;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;

        let opacity = 1;

        function animate() {
            const rect = particle.getBoundingClientRect();
            particle.style.left = rect.left + dx + 'px';
            particle.style.top = rect.top + dy + 'px';
            opacity -= 0.02;
            particle.style.opacity = opacity;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        }
        requestAnimationFrame(animate);
    }

    // Animate logo
    logo.style.transform = 'scale(1.5)';
    logo.style.opacity = '0';

    // Create particles
    setTimeout(() => {
        for (let i = 0; i < 50; i++) {
            createParticle();
        }
    }, 500);

    // Reset logo
    setTimeout(() => {
        logo.style.transform = 'scale(1)';
        logo.style.opacity = '1';
    }, 2000);
}

// Create a flickering lights effect
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

// Comment out or remove this function until you have a valid Instagram API token
/*
async function fetchInstagramImages() {
    try {
        const response = await fetch('https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url&access_token=YOUR_ACCESS_TOKEN');
        if (!response.ok) {
            throw new Error('Failed to fetch Instagram images');
        }
        const { data } = await response.json();
        displayInstagramImages(data);
    } catch (error) {
        console.error('Error fetching Instagram images:', error);
    }
}
*/

function displayInstagramImages(images) {
    const instagramContainer = document.getElementById('instagram-images');
    if (!instagramContainer) {
        return;
    }

    instagramContainer.innerHTML = images.map(image => `
        <div class="instagram-image">
            <img src="${image.media_url}" alt="${image.caption}" />
        </div>
    `).join('');
}