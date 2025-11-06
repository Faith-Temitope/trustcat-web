document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.main-nav');
    
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            
            // Prevent scrolling when menu is open
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                nav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});