document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Functionality
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.overlay');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        mobileNav.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }

    // Event Listeners
    if (mobileMenu) {
        mobileMenu.addEventListener('click', toggleMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    document.querySelectorAll('.mobile-nav__link').forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // Add any other JavaScript functionality here
});