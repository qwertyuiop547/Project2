// GLOBAL PERFORMANCE OPTIMIZER - Zero Code Removal, Maximum Speed
(function() {
    'use strict';
    
    // Optimized: Remove console.log for better performance
    // console.log('⚡ Performance Optimizer loading...');
    
    // 1. Throttle resize events globally
    let resizeTimer;
    const debouncedResize = new Event('debouncedResize');
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            window.dispatchEvent(debouncedResize);
        }, 150);
    }, { passive: true });
    
    // 2. Detect if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
    }
    
    // 3. Page Visibility API - pause animations when tab not visible
    let isPageVisible = !document.hidden;
    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        document.documentElement.classList.toggle('page-hidden', !isPageVisible);
    }, { passive: true });
    
    // 4. Intersection Observer for lazy animation
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-viewport');
            } else {
                entry.target.classList.remove('in-viewport');
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // Observe cards and heavy elements
    setTimeout(() => {
        document.querySelectorAll('.feature-card, .stat-card, .announcement-card').forEach(el => {
            animationObserver.observe(el);
        });
    }, 500);
    
    // 5. Intelligent FPS limiting based on performance
    let lastFrameTime = performance.now();
    let fps = 60;
    let frameCount = 0;
    let fpsCheckTime = performance.now();
    
    window.requestOptimizedFrame = function(callback) {
        return requestAnimationFrame((time) => {
            frameCount++;
            
            // Calculate FPS every second
            if (time - fpsCheckTime > 1000) {
                fps = frameCount;
                frameCount = 0;
                fpsCheckTime = time;
                
                // Adjust quality based on FPS
                if (fps < 30) {
                    document.documentElement.classList.add('low-performance');
                } else if (fps < 45) {
                    document.documentElement.classList.add('medium-performance');
                } else {
                    document.documentElement.classList.remove('low-performance', 'medium-performance');
                }
            }
            
            // Skip frames if needed (target 60fps)
            const elapsed = time - lastFrameTime;
            if (elapsed > 16.67 || fps < 30) {
                lastFrameTime = time;
                callback(time);
            } else {
                requestAnimationFrame(callback);
            }
        });
    };
    
    // 6. Optimize images
    if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
        });
    }
    
    // 7. Passive scroll listener (smooth, no interruption)
    let scrollTimeout;
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            // Don't add class that interrupts animations
        }
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    }, { passive: true });
    
    // 8. Gentle performance adjustments (no blinking!)
    const style = document.createElement('style');
    style.textContent = `
        /* Smooth transitions - no blinking */
        * {
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Reduce effects when page hidden (smooth fade) */
        .page-hidden #aurora-background canvas,
        .page-hidden #aurora-particles {
            opacity: 0;
            transition: opacity 0.5s ease-out;
        }
        
        /* Performance-based optimizations (gradual) */
        .low-performance #aurora-background::before,
        .low-performance #aurora-background::after {
            animation-duration: 40s !important;
        }
        
        .low-performance .aurora-particle {
            filter: blur(2px) !important;
        }
        
        .medium-performance .aurora-background {
            backdrop-filter: blur(25px) !important;
        }
        
        /* Only animate elements in viewport (smooth) */
        .feature-card:not(.in-viewport),
        .stat-card:not(.in-viewport) {
            opacity: 0.8;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .feature-card.in-viewport,
        .stat-card.in-viewport {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
    `;
    document.head.appendChild(style);
    
    // 9. Memory cleanup
    window.addEventListener('beforeunload', () => {
        animationObserver.disconnect();
    });
    
    // Optimized: Remove console.log for better performance
    // console.log('✅ Performance Optimizer ACTIVE!');
    // console.log('📊 Features: FPS limiting, Visibility detection, Scroll optimization, Lazy animations');
    
})();

