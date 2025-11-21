// NAVIGATION PERFORMANCE OPTIMIZER
(function() {
    'use strict';
    
    // 1. Prefetch links on hover for faster navigation
    let prefetchTimer;
    document.addEventListener('mouseover', function(e) {
        const link = e.target.closest('a[href]');
        if (!link || link.href.startsWith('javascript:') || link.href.startsWith('#')) return;
        
        // Only prefetch internal links
        if (link.href.startsWith(window.location.origin)) {
            clearTimeout(prefetchTimer);
            prefetchTimer = setTimeout(() => {
                const linkEl = document.createElement('link');
                linkEl.rel = 'prefetch';
                linkEl.href = link.href;
                document.head.appendChild(linkEl);
            }, 100); // Small delay to avoid prefetching on accidental hovers
        }
    }, { passive: true });
    
    // 2. Optimize page transitions
    let isNavigating = false;
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href]');
        if (!link || link.target === '_blank' || link.href.startsWith('javascript:') || link.href.startsWith('#')) return;
        
        // Only for internal navigation
        if (link.href.startsWith(window.location.origin)) {
            // Don't add page-navigating class immediately - let the page load normally
            // Only add it if navigation takes too long
            const navTimeout = setTimeout(function() {
                isNavigating = true;
                document.body.classList.add('page-navigating');
            }, 500); // Only add class if navigation takes more than 500ms
            
            // Clear timeout when page unloads
            window.addEventListener('beforeunload', function() {
                clearTimeout(navTimeout);
            }, { once: true });
        }
    }, { passive: true });
    
    // 3. Optimize browser back/forward navigation
    window.addEventListener('popstate', function() {
        isNavigating = true;
        document.body.classList.add('page-navigating');
    });
    
    // 4. Clean up when page is loaded - Multiple events to ensure cleanup
    function cleanupNavigation() {
        isNavigating = false;
        document.body.classList.remove('page-navigating');
        const auroraCanvas = document.querySelector('#aurora-background canvas');
        if (auroraCanvas) {
            auroraCanvas.style.opacity = '1';
        }
        const auroraBackground = document.getElementById('aurora-background');
        if (auroraBackground) {
            auroraBackground.style.opacity = '1';
        }
    }
    
    // Clean up on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(cleanupNavigation, 50);
        });
    } else {
        setTimeout(cleanupNavigation, 50);
    }
    
    // Also clean up on load event
    window.addEventListener('load', function() {
        setTimeout(cleanupNavigation, 100);
    });
    
    // Fallback: Force cleanup after 2 seconds to prevent stuck black screen
    setTimeout(function() {
        cleanupNavigation();
    }, 2000);
    
    // 5. Optimized: Only reduce animations, don't make page black
    const style = document.createElement('style');
    style.textContent = `
        .page-navigating * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
        }
        /* Don't make Aurora too dark - just slightly reduce */
        .page-navigating #aurora-background {
            opacity: 0.7 !important;
        }
        /* Ensure content is always visible */
        .page-navigating main,
        .page-navigating .navbar,
        .page-navigating footer {
            opacity: 1 !important;
            visibility: visible !important;
        }
    `;
    document.head.appendChild(style);
})();

