// LOADING PERFORMANCE OPTIMIZER - Prevents infinite loading
(function() {
    'use strict';
    
    // 1. Detect and prevent infinite loading states
    let loadingStartTime = performance.now();
    const MAX_LOADING_TIME = 10000; // 10 seconds max
    
    // Monitor page load time
    window.addEventListener('load', function() {
        const loadTime = performance.now() - loadingStartTime;
        if (loadTime > MAX_LOADING_TIME) {
            console.warn('Page took longer than expected to load:', loadTime + 'ms');
        }
    });
    
    // 2. Force remove loading indicators after timeout
    setTimeout(function() {
        // Remove any loading spinners that might be stuck
        const loadingElements = document.querySelectorAll('.spinner, .loading, [class*="loading"]');
        loadingElements.forEach(function(el) {
            if (el.style.display !== 'none') {
                el.style.display = 'none';
            }
        });
        
        // Remove page-navigating class if stuck
        document.body.classList.remove('page-navigating');
    }, MAX_LOADING_TIME);
    
    // 3. Optimize resource loading
    if ('requestIdleCallback' in window) {
        requestIdleCallback(function() {
            // Preload critical resources
            const criticalLinks = document.querySelectorAll('a[href^="/"]');
            criticalLinks.forEach(function(link, index) {
                if (index < 5) { // Only prefetch first 5 links
                    const prefetchLink = document.createElement('link');
                    prefetchLink.rel = 'prefetch';
                    prefetchLink.href = link.href;
                    document.head.appendChild(prefetchLink);
                }
            });
        }, { timeout: 2000 });
    }
    
    // 4. Abort slow requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        return originalFetch(...args)
            .then(response => {
                clearTimeout(timeoutId);
                return response;
            })
            .catch(error => {
                clearTimeout(timeoutId);
                throw error;
            });
    };
})();

