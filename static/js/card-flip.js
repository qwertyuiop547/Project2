// OPTIMIZED 3D CARD FLIP HANDLER - Fixed Version
(function() {
    'use strict';
    
    console.log('🎴 Card flip effects initializing...');
    
    function initializeCardFlips() {
        // Simple 3D hover effect for feature cards (no content removal)
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card) => {
            // Just add hardware acceleration, don't modify content
            card.style.transform = 'translateZ(0)';
            card.style.willChange = 'transform';
            card.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            // Add hover listener for 3D effect
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-15px) rotateX(8deg) scale(1.02) translateZ(0)';
                this.style.boxShadow = '0 25px 60px rgba(102, 126, 234, 0.4)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) rotateX(0) scale(1) translateZ(0)';
                this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            });
        });
        
        // Simple 3D hover for stat cards
        const statCards = document.querySelectorAll('.stat-card');
        
        statCards.forEach((card) => {
            card.style.transform = 'translateZ(0)';
            card.style.willChange = 'transform';
            card.style.transition = 'all 0.3s ease';
            
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-12px) scale(1.03) translateZ(0)';
                this.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.3)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1) translateZ(0)';
                this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            });
        });
        
        console.log(`✅ 3D hover effects active on ${featureCards.length} feature cards and ${statCards.length} stat cards!`);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCardFlips);
    } else {
        initializeCardFlips();
    }
})();
