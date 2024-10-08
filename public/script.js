'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initializePageFunctionality();
    flickerLights();
    animateLogo();
    fetchInstagramImages();
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
    if (!container) {
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="item">
            <h3>${item.name}</h3>
            <p>Price: $${(item.price / 100).toFixed(2)}</p>
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

// Animate the logo into an explosion effect, forming a beating heart
function animateLogo() {
    const logo = document.querySelector('.logo');
    if (!logo) {
        return;
    }

    gsap.fromTo(logo, {
        scale: 1,
        opacity: 1
    }, {
        scale: 1.5,
        opacity: 0,
        duration: 0.5,
        ease: "power1.in",
        onComplete: () => {
            for (let i = 0; i < 100; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                document.body.appendChild(particle);
                gsap.set(particle, {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    opacity: 1
                });
                gsap.to(particle, {
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    scale: Math.random() * 2,
                    duration: 1,
                    onComplete: () => {
                        particle.remove();
                    }
                });
            }
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart';
                document.body.appendChild(heart);
                gsap.fromTo(heart, {
                    scale: 0,
                    opacity: 0
                }, {
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    ease: "bounce.out",
                    onComplete: () => {
                        gsap.to(heart, {
                            scale: 0,
                            duration: 1,
                            onComplete: () => heart.remove()
                        });
                    }
                });
            }, 1000);
        }
    });
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

window.onload = updateInventoryDisplay;

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