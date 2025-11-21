// SCROLL PERFORMANCE OPTIMIZER
(function() {
    'use strict';
    
    // Optimized: Remove console.log for better performance
    // console.log('📜 Scroll optimizer loading...');
    
    let isScrolling = false;
    let scrollTimeout;
    let ticking = false;
    
    // Detect scrolling state
    function handleScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (!isScrolling) {
                    isScrolling = true;
                    document.body.classList.add('is-scrolling');
                }
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                    document.body.classList.remove('is-scrolling');
                }, 150);
                
                ticking = false;
            });
            
            ticking = true;
        }
    }
    
    // Add passive event listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Optimize scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Smooth scroll for anchor links
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a[href^="#"]');
        if (!target) return;
        
        const href = target.getAttribute('href');
        if (href === '#') return;
        
        const element = document.querySelector(href);
        if (!element) return;
        
        e.preventDefault();
        
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
    
    // Optimize images during scroll
    const images = document.querySelectorAll('img');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    images.forEach(img => {
        if (img.dataset.src) {
            imageObserver.observe(img);
        }
    });
    
    console.log('✅ Scroll optimizer active - Smooth scrolling enabled!');
})();

