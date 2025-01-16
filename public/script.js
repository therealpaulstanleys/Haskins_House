'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Remove dynamic header/footer loading
    document.querySelectorAll('#header, #footer').forEach(el => el.remove());
});