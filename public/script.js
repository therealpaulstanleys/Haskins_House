'use strict';

// Cart functionality
const cart = [];

const updateCartDisplay = () => {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) {
        return;
    }

    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.name} - $${item.price}</span>
            <button onclick="removeFromCart(${index})">Remove</button>
        </div>
    `).join('');

    updateCartTotal();
};

const updateCartTotal = () => {
    const total = getCartTotal();
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
        totalElement.textContent = `Total: $${total.toFixed(2)}`;
    }
};

const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
};

const clearCart = () => {
    cart.length = 0;
    updateCartDisplay();
};

const showError = (message) => {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
};

const showSuccess = (message) => {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Functionality
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.overlay');
    const navLinks = document.querySelectorAll('.mobile-nav__link');

    const toggleMenu = () => {
        mobileMenu.classList.toggle('active');
        mobileNav.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    };

    // Event Listeners for Mobile Menu
    mobileMenu.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    navLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // Square Integration
    const initializeSquare = async() => {
        try {
            const configResponse = await fetch('/api/square-config');
            const { appId, locationId } = await configResponse.json();

            const payments = Square.payments(appId, locationId);
            const card = await payments.card();
            await card.attach('#card-container');

            const paymentForm = document.getElementById('payment-form');
            if (paymentForm) {
                paymentForm.addEventListener('submit', async(event) => {
                    event.preventDefault();
                    try {
                        const result = await card.tokenize();
                        if (result.status === 'OK') {
                            await processPayment(result.token);
                        }
                    } catch (error) {
                        console.error('Payment Error:', error);
                        showError('Payment failed. Please try again.');
                    }
                });
            }
        } catch (error) {
            console.error('Square Initialization Error:', error);
        }
    };

    const processPayment = async(token) => {
        try {
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId: token,
                    amount: getCartTotal(),
                    currency: 'USD'
                })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('Payment successful!');
                clearCart();
            } else {
                showError('Payment failed. Please try again.');
            }
        } catch (error) {
            console.error('Payment Processing Error:', error);
            showError('Payment failed. Please try again.');
        }
    };

    // Initialize Square if we're on a page with payments
    if (document.getElementById('card-container')) {
        initializeSquare();
    }
});