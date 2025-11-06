function wireMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.main-nav');
    if (menuBtn && nav) {
        console.log('[mobile-menu] Hamburger menu JS loaded and attached.');
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                nav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    } else {
        // Try again in 200ms if header not yet injected
        setTimeout(wireMobileMenu, 200);
    }
}
wireMobileMenu();