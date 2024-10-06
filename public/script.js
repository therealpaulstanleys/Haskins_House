'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initializePageFunctionality();
    flickerLights(); // Call flicker lights on page load
});

async function initializePageFunctionality() {
    try {
        const response = await fetch('/api/inventory'); // Call the inventory endpoint
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const items = await response.json();
        displayInventory(items); // Call the function to display items
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

// Function to animate the logo into an explosion effect, forming a beating heart
function animateLogo() {
    const logo = document.querySelector('.logo');
    gsap.fromTo(logo, {
        scale: 1,
        opacity: 1
    }, {
        scale: 1.5,
        opacity: 0,
        duration: 0.5,
        ease: "power1.in",
        onComplete: () => {
            // Create particles for explosion effect
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
            // Create heart shape after explosion
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
            }, 1000); // Delay heart appearance
        }
    });
}

// Function to create a flickering lights effect
function flickerLights() {
    const body = document.body;
    const flickerDuration = 300; // Duration of flicker in milliseconds
    const flickerCount = 10; // Number of flickers

    for (let i = 0; i < flickerCount; i++) {
        setTimeout(() => {
            body.style.backgroundColor = (i % 2 === 0) ? '#fff' : '#f8f8f8'; // Toggle background color
        }, i * flickerDuration);
    }

    // Reset background color after flickering
    setTimeout(() => {
        body.style.backgroundColor = '#fff'; // Final background color
    }, flickerCount * flickerDuration);
}

// Import and initialize Three.js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a 3D record model and animate it
const recordGeometry = new THREE.CylinderGeometry(5, 5, 0.2, 32);
const recordMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const record = new THREE.Mesh(recordGeometry, recordMaterial);
scene.add(record);

function animateRecord() {
    requestAnimationFrame(animateRecord);
    record.rotation.x += 0.01;
    record.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animateRecord();

// Import and initialize Anime.js
import anime from 'animejs/lib/anime.es.js';

// Animate record covers on hover
const recordCovers = document.querySelectorAll('.record-cover');
recordCovers.forEach(cover => {
    cover.addEventListener('mouseenter', () => {
        anime({
            targets: cover,
            scale: 1.1,
            duration: 500,
            easing: 'easeOutQuad'
        });
    });
    cover.addEventListener('mouseleave', () => {
        anime({
            targets: cover,
            scale: 1,
            duration: 500,
            easing: 'easeOutQuad'
        });
    });
});