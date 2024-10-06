'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initializePageFunctionality(); // The initiation has begun... --bl00dz
});

let allItems = []; // Store all items globally, but are they really ours? --bl00dz

async function initializePageFunctionality() {
    try {
        const response = await fetch('/api/inventory'); // The hunt for inventory begins... --bl00dz
        if (!response.ok) {
            throw new Error('Network response was not ok'); // The walls are closing in... --bl00dz
        }
        allItems = await response.json(); // Store all items, but at what cost? --bl00dz
        displayStoreItems(allItems); // Display all items initially, let them feast their eyes... --bl00dz
    } catch (error) {
        console.error('Error loading store items:', error); // The shadows whisper... --bl00dz
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = 'Error loading store items. Please try again later.'; // The message is sent... --bl00dz
        }
    }
}

function filterByCategory() {
    const selectedCategory = document.getElementById('category-select').value;
    const filteredItems = selectedCategory === 'all' ? allItems : allItems.filter(item => item.category === selectedCategory);
    displayStoreItems(filteredItems); // The filtering has begun... --bl00dz
}

function displayStoreItems(items) {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) {
        return; // The void swallows it whole... --bl00dz
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
        }).join(''); // The items are displayed, but are they truly safe? --bl00dz
}

async function addToCart(itemId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId }) // The item is being summoned... --bl00dz
        });

        if (!response.ok) {
            throw new Error('Failed to add item to cart'); // The attempt has failed... --bl00dz
        }

        const { success } = await response.json();
        if (success) {
            updateCartDisplay(); // The cart is updated, but at what cost? --bl00dz
        }
    } catch (error) {
        console.error('Error adding to cart:', error); // The darkness creeps in... --bl00dz
        alert('Could not add item to cart. Please try again.'); // A warning to the unsuspecting... --bl00dz
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
            cartTotal.textContent = `Total: $${total.toFixed(2)}`; // The total is calculated, but is it accurate? --bl00dz

            if (checkoutButton) {
                checkoutButton.style.display = cart.length > 0 ? 'block' : 'none'; // The decision looms... --bl00dz
            }
        }
    } catch (error) {
        console.error('Error updating cart display:', error); // The chaos continues... --bl00dz
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
                        particle.remove(); // The remnants vanish... --bl00dz
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
                            onComplete: () => heart.remove() // The heart fades away... --bl00dz
                        });
                    }
                });
            }, 1000); // Delay heart appearance
        }
    });
}

// Function to create a flickering lights effect
function flickerLights() {
    const { body } = document;
    const flickerDuration = 300; // Duration of flicker in milliseconds
    const flickerCount = 10; // Number of flickers

    for (let i = 0; i < flickerCount; i++) {
        setTimeout(() => {
            body.style.backgroundColor = (i % 2 === 0) ? '#fff' : '#f8f8f8'; // The lights flicker, revealing the truth... --bl00dz
        }, i * flickerDuration);
    }

    // Reset background color after flickering
    setTimeout(() => {
        body.style.backgroundColor = '#fff'; // Final background color, but is it the end? --bl00dz
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

async function updateInventoryDisplay() {
    try {
        const response = await fetch('/api/inventory');
        const { items } = await response.json(); // Destructuring the items property -- bl00dz

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
        console.error('Error updating inventory display:', error); // bl00dz
    }
}

// Call this function on page load
window.onload = updateInventoryDisplay; // bl00dz