/**
 * Navbar Toggler Premium Effects
 * Enhanced interactions and animations
 */

document.addEventListener('DOMContentLoaded', function() {
    const toggler = document.querySelector('.navbar-toggler');
    
    if (!toggler) return;
    
    let clickCount = 0;
    let clickTimer = null;
    
    // Triple click for rainbow mode easter egg! 🌈
    toggler.addEventListener('click', function() {
        clickCount++;
        
        if (clickTimer) clearTimeout(clickTimer);
        
        if (clickCount === 3) {
            // Activate rainbow mode!
            this.classList.add('rainbow-mode');
            
            // Show fun message
            console.log('🌈 Rainbow Mode Activated! 🎉');
            
            // Deactivate after 5 seconds
            setTimeout(() => {
                this.classList.remove('rainbow-mode');
                clickCount = 0;
            }, 5000);
        }
        
        // Reset click count after 1 second
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1000);
    });
    
    // Magnetic cursor effect on hover
    toggler.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Subtle magnetic pull effect
        const moveX = x * 0.1;
        const moveY = y * 0.1;
        
        this.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.08) rotateX(${-y * 0.1}deg) rotateY(${x * 0.1}deg)`;
    });
    
    // Reset position when mouse leaves
    toggler.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
    
    // Haptic-like visual feedback on touch devices
    if ('ontouchstart' in window) {
        toggler.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        toggler.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
        });
    }
    
    // Add smooth transition for transform
    toggler.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    // Keyboard accessibility enhancement
    toggler.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            this.classList.add('keyboard-active');
            setTimeout(() => {
                this.classList.remove('keyboard-active');
            }, 300);
        }
    });
    
    // Add visual feedback for keyboard users
    const style = document.createElement('style');
    style.textContent = `
        .navbar-toggler.keyboard-active {
            transform: scale(0.95) !important;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.5) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Performance optimization: Reduce animations on slower devices
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        toggler.style.animation = 'none';
    }
    
    // Sound wave effect visualization on click
    toggler.addEventListener('click', function(e) {
        // Create ripple element
        const ripple = document.createElement('span');
        ripple.classList.add('click-ripple');
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.6) 0%, transparent 70%);
            pointer-events: none;
            animation: rippleExpand 0.6s ease-out;
        `;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
    
    // Add ripple animation
    if (!document.getElementById('ripple-animation')) {
        const rippleStyle = document.createElement('style');
        rippleStyle.id = 'ripple-animation';
        rippleStyle.textContent = `
            @keyframes rippleExpand {
                from {
                    transform: scale(0);
                    opacity: 1;
                }
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);
    }
    
    // Auto-hint animation on first page load (only once)
    if (!sessionStorage.getItem('navbar-hint-shown')) {
        setTimeout(() => {
            toggler.style.animation = 'float 3s ease-in-out infinite, neonBorderPulse 3s ease-in-out infinite, pulseHint 1s ease-in-out';
            sessionStorage.setItem('navbar-hint-shown', 'true');
        }, 1500);
    }
    
    console.log('✨ Navbar Toggler Premium Effects Loaded!');
    
    // ==========================================
    // NEXT-LEVEL ULTRA PREMIUM FEATURES 🚀
    // ==========================================
    
    // Particle System on Click! 🎆
    function createParticles(x, y) {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            
            const size = Math.random() * 8 + 4;
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = Math.random() * 100 + 50;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                box-shadow: 0 0 10px ${color};
                animation: particleFloat 1s ease-out forwards;
                --angle: ${angle};
                --velocity: ${velocity}px;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    // Add particle animation
    const particleStyle = document.createElement('style');
    particleStyle.textContent = `
        @keyframes particleFloat {
            0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(
                    calc(cos(var(--angle)) * var(--velocity)),
                    calc(sin(var(--angle)) * var(--velocity))
                ) scale(0);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(particleStyle);
    
    // Trigger particles on menu toggle
    toggler.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        createParticles(x, y);
    });
    
    // Confetti Celebration on Menu Open! 🎉
    function createConfetti() {
        const confettiCount = 30;
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            
            const size = Math.random() * 10 + 5;
            const left = Math.random() * window.innerWidth;
            const animationDuration = Math.random() * 3 + 2;
            const rotation = Math.random() * 360;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.style.cssText = `
                position: fixed;
                left: ${left}px;
                top: -20px;
                width: ${size}px;
                height: ${size * 1.5}px;
                background: ${color};
                opacity: 0.8;
                z-index: 9999;
                pointer-events: none;
                animation: confettiFall ${animationDuration}s linear forwards;
                transform: rotate(${rotation}deg);
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), animationDuration * 1000);
        }
    }
    
    // Confetti animation
    const confettiStyle = document.createElement('style');
    confettiStyle.textContent = `
        @keyframes confettiFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(confettiStyle);
    
    // Trigger confetti when menu opens
    toggler.addEventListener('click', function() {
        if (this.getAttribute('aria-expanded') === 'false') {
            setTimeout(() => createConfetti(), 100);
        }
    });
    
    // Mouse Trail Effect! ✨
    const trail = [];
    const maxTrailLength = 20;
    
    toggler.addEventListener('mouseenter', function() {
        document.addEventListener('mousemove', createTrailDot);
    });
    
    toggler.addEventListener('mouseleave', function() {
        document.removeEventListener('mousemove', createTrailDot);
    });
    
    function createTrailDot(e) {
        if (!toggler.matches(':hover')) return;
        
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        dot.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #667eea, transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            animation: trailFade 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(dot);
        trail.push(dot);
        
        if (trail.length > maxTrailLength) {
            const oldDot = trail.shift();
            if (oldDot && oldDot.parentNode) {
                oldDot.remove();
            }
        }
        
        setTimeout(() => dot.remove(), 800);
    }
    
    const trailStyle = document.createElement('style');
    trailStyle.textContent = `
        @keyframes trailFade {
            0% {
                transform: scale(1);
                opacity: 0.8;
            }
            100% {
                transform: scale(0);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(trailStyle);
    
    // Glow Pulse on Idle (breathe effect) 💨
    let idleTimer;
    const idleDelay = 5000; // 5 seconds
    
    function startIdleGlow() {
        toggler.classList.add('idle-glow');
    }
    
    function stopIdleGlow() {
        toggler.classList.remove('idle-glow');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(startIdleGlow, idleDelay);
    }
    
    ['mouseenter', 'click', 'touchstart'].forEach(event => {
        toggler.addEventListener(event, stopIdleGlow);
    });
    
    // Start idle timer
    idleTimer = setTimeout(startIdleGlow, idleDelay);
    
    const idleStyle = document.createElement('style');
    idleStyle.textContent = `
        @keyframes idleBreathe {
            0%, 100% {
                box-shadow: 
                    0 0 20px rgba(102, 126, 234, 0.4),
                    0 0 40px rgba(102, 126, 234, 0.2),
                    0 4px 15px rgba(0, 0, 0, 0.2);
                transform: scale(1);
            }
            50% {
                box-shadow: 
                    0 0 30px rgba(102, 126, 234, 0.6),
                    0 0 60px rgba(102, 126, 234, 0.4),
                    0 6px 20px rgba(0, 0, 0, 0.3);
                transform: scale(1.02);
            }
        }
        
        .navbar-toggler.idle-glow {
            animation: idleBreathe 3s ease-in-out infinite !important;
        }
    `;
    document.head.appendChild(idleStyle);
    
    // Shake animation when trying to close (fun micro-interaction)
    let shakeTimeout;
    toggler.addEventListener('click', function() {
        if (this.getAttribute('aria-expanded') === 'true') {
            this.classList.add('shake-close');
            clearTimeout(shakeTimeout);
            shakeTimeout = setTimeout(() => {
                this.classList.remove('shake-close');
            }, 500);
        }
    });
    
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shakeClose {
            0%, 100% { transform: rotate(180deg) translateX(0); }
            25% { transform: rotate(180deg) translateX(-3px); }
            75% { transform: rotate(180deg) translateX(3px); }
        }
        
        .navbar-toggler.shake-close {
            animation: shakeClose 0.3s ease-in-out !important;
        }
    `;
    document.head.appendChild(shakeStyle);
    
    // Progress indicator around button (circular progress)
    const progressCircle = document.createElement('div');
    progressCircle.className = 'progress-circle';
    progressCircle.innerHTML = `
        <svg width="60" height="60" style="position: absolute; top: -9px; left: -6px; pointer-events: none;">
            <circle cx="30" cy="30" r="28" fill="none" stroke="url(#gradient)" stroke-width="2" 
                    stroke-dasharray="176" stroke-dashoffset="176" class="progress-path"
                    style="transition: stroke-dashoffset 0.3s ease;" />
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
            </defs>
        </svg>
    `;
    
    // Add progress circle to button
    toggler.style.position = 'relative';
    toggler.appendChild(progressCircle);
    
    // Animate progress on hover
    toggler.addEventListener('mouseenter', function() {
        const path = this.querySelector('.progress-path');
        if (path) {
            path.style.strokeDashoffset = '0';
        }
    });
    
    toggler.addEventListener('mouseleave', function() {
        const path = this.querySelector('.progress-path');
        if (path) {
            path.style.strokeDashoffset = '176';
        }
    });
    
    // Success feedback animation on menu open
    toggler.addEventListener('click', function() {
        if (this.getAttribute('aria-expanded') === 'false') {
            // Create success checkmark
            const checkmark = document.createElement('div');
            checkmark.innerHTML = '✓';
            checkmark.style.cssText = `
                position: fixed;
                left: ${this.getBoundingClientRect().right + 10}px;
                top: ${this.getBoundingClientRect().top}px;
                font-size: 24px;
                color: #10b981;
                font-weight: bold;
                pointer-events: none;
                z-index: 9999;
                animation: checkmarkPop 0.6s ease-out forwards;
            `;
            document.body.appendChild(checkmark);
            setTimeout(() => checkmark.remove(), 600);
        }
    });
    
    const checkmarkStyle = document.createElement('style');
    checkmarkStyle.textContent = `
        @keyframes checkmarkPop {
            0% {
                transform: scale(0) rotate(0deg);
                opacity: 0;
            }
            50% {
                transform: scale(1.5) rotate(10deg);
                opacity: 1;
            }
            100% {
                transform: scale(0) rotate(20deg) translateY(-20px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(checkmarkStyle);
    
    console.log('🚀 ULTRA PREMIUM Features Activated!');
    console.log('🎆 Particle Effects: ON');
    console.log('🎉 Confetti: ON');
    console.log('✨ Mouse Trail: ON');
    console.log('💨 Idle Glow: ON');
    console.log('🎯 Progress Circle: ON');
    
    // ==========================================
    // 🌟 LEGENDARY ULTIMATE FEATURES 🌟
    // Sound Effects + Special Modes!
    // ==========================================
    
    // Web Audio API for Sound Effects! 🔊
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContext;
    
    function initAudio() {
        if (!audioContext) {
            audioContext = new AudioContext();
        }
    }
    
    // Create various sound effects
    function playSound(type) {
        initAudio();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different sounds for different actions
        switch(type) {
            case 'open':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                break;
            case 'close':
                oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                break;
            case 'hover':
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                break;
        }
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    // Add sound on hover
    let hoverSoundPlayed = false;
    toggler.addEventListener('mouseenter', function() {
        if (!hoverSoundPlayed) {
            playSound('hover');
            hoverSoundPlayed = true;
            setTimeout(() => hoverSoundPlayed = false, 200);
        }
    });
    
    // Add sound on click
    toggler.addEventListener('click', function() {
        if (this.getAttribute('aria-expanded') === 'false') {
            playSound('open');
        } else {
            playSound('close');
        }
    });
    
    // Lightning effect on click!
    toggler.addEventListener('click', function() {
        this.classList.add('lightning');
        setTimeout(() => {
            this.classList.remove('lightning');
        }, 500);
    });
    
    // Fireworks on special occasions! 🎆
    function createFirework(x, y) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const particles = 50;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / particles;
            const velocity = Math.random() * 200 + 100;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 6 + 2;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 0 10px ${color};
            `;
            
            document.body.appendChild(particle);
            
            // Animate particle
            const animation = particle.animate([
                {
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
            });
            
            animation.onfinish = () => particle.remove();
        }
    }
    
    // Mode cycling system - Press and hold for 2 seconds!
    let pressTimer;
    let currentMode = 'normal';
    const modes = ['normal', 'plasma', 'aurora', 'fire', 'ice', 'matrix', 'quantum', 'magnetic', 'dna'];
    
    toggler.addEventListener('mousedown', function() {
        pressTimer = setTimeout(() => {
            cycleMode();
        }, 2000);
    });
    
    toggler.addEventListener('mouseup', function() {
        clearTimeout(pressTimer);
    });
    
    toggler.addEventListener('mouseleave', function() {
        clearTimeout(pressTimer);
    });
    
    function cycleMode() {
        // Remove all mode classes
        modes.forEach(mode => {
            toggler.classList.remove(`${mode}-mode`);
        });
        
        // Get next mode
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        currentMode = modes[nextIndex];
        
        if (currentMode !== 'normal') {
            toggler.classList.add(`${currentMode}-mode`);
        }
        
        // Show mode name
        const modeIndicator = document.createElement('div');
        modeIndicator.textContent = currentMode.toUpperCase() + ' MODE';
        modeIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-size: 48px;
            font-weight: bold;
            color: white;
            text-shadow: 0 0 20px currentColor;
            pointer-events: none;
            z-index: 10000;
            animation: modeAnnounce 1.5s ease-out forwards;
        `;
        
        document.body.appendChild(modeIndicator);
        
        // Create fireworks
        createFirework(window.innerWidth / 2, window.innerHeight / 2);
        
        setTimeout(() => modeIndicator.remove(), 1500);
        
        console.log(`🎨 Mode Changed: ${currentMode.toUpperCase()}`);
    }
    
    // Mode announce animation
    const modeStyle = document.createElement('style');
    modeStyle.textContent = `
        @keyframes modeAnnounce {
            0% {
                transform: translate(-50%, -50%) scale(0) rotate(-180deg);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.2) rotate(10deg);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(0) rotate(180deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(modeStyle);
    
    // Konami code easter egg! 🎮
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', function(e) {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateGodMode();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
    
    function activateGodMode() {
        console.log('🎮 KONAMI CODE ACTIVATED! 🎮');
        console.log('🌟 GOD MODE ENABLED! 🌟');
        
        // Epic announcement
        const announcement = document.createElement('div');
        announcement.innerHTML = '🎮 GOD MODE ACTIVATED! 🎮';
        announcement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 64px;
            font-weight: bold;
            background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
            background-size: 400% 400%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: rainbowShift 1s ease infinite, godModeAnnounce 3s ease-out forwards;
            pointer-events: none;
            z-index: 10001;
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
        `;
        
        document.body.appendChild(announcement);
        
        // Create massive fireworks
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                createFirework(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight
                );
            }, i * 200);
        }
        
        // Activate all modes cycling
        let modeInterval = setInterval(() => {
            cycleMode();
        }, 1000);
        
        setTimeout(() => {
            clearInterval(modeInterval);
            announcement.remove();
            // Reset to normal
            modes.forEach(mode => toggler.classList.remove(`${mode}-mode`));
            currentMode = 'normal';
        }, 10000);
    }
    
    const godModeStyle = document.createElement('style');
    godModeStyle.textContent = `
        @keyframes rainbowShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        @keyframes godModeAnnounce {
            0% {
                transform: translate(-50%, -50%) scale(0) rotate(0deg);
                opacity: 0;
            }
            10% {
                transform: translate(-50%, -50%) scale(1.5) rotate(360deg);
                opacity: 1;
            }
            90% {
                transform: translate(-50%, -50%) scale(1) rotate(360deg);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(0) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(godModeStyle);
    
    // Shake device feature (if supported)
    if ('vibrate' in navigator) {
        toggler.addEventListener('click', function() {
            navigator.vibrate([50, 30, 50]);
        });
    }
    
    // Screen flash effect on special interactions
    function screenFlash(color = '#667eea') {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${color};
            opacity: 0.3;
            pointer-events: none;
            z-index: 9997;
            animation: flashFade 0.3s ease-out forwards;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    }
    
    const flashStyle = document.createElement('style');
    flashStyle.textContent = `
        @keyframes flashFade {
            0% { opacity: 0.5; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(flashStyle);
    
    // Flash on click
    toggler.addEventListener('click', function() {
        screenFlash('#667eea');
    });
    
    // Stats counter
    let clickCounter = 0;
    let hoverCounter = 0;
    
    toggler.addEventListener('click', function() {
        clickCounter++;
        if (clickCounter === 10) {
            console.log('🎉 Achievement Unlocked: Button Master! (10 clicks)');
            createFirework(this.getBoundingClientRect().left + 24, this.getBoundingClientRect().top + 21);
        }
        if (clickCounter === 50) {
            console.log('🏆 Achievement Unlocked: Button Legend! (50 clicks)');
            activateGodMode();
        }
    });
    
    toggler.addEventListener('mouseenter', function() {
        hoverCounter++;
        if (hoverCounter === 20) {
            console.log('✨ Achievement Unlocked: Hover Enthusiast! (20 hovers)');
        }
    });
    
    // Secret: Hold Shift + Click for instant God Mode
    toggler.addEventListener('click', function(e) {
        if (e.shiftKey) {
            activateGodMode();
        }
    });
    
    console.log('');
    console.log('🌟 ================================ 🌟');
    console.log('🎮 LEGENDARY FEATURES ACTIVATED! 🎮');
    console.log('🌟 ================================ 🌟');
    console.log('');
    console.log('🔊 Sound Effects: ON');
    console.log('⚡ Lightning Effect: ON');
    console.log('🎆 Fireworks System: ON');
    console.log('🎨 9 Special Modes: AVAILABLE');
    console.log('🎮 Konami Code: ENABLED');
    console.log('📊 Achievement System: ACTIVE');
    console.log('');
    console.log('💡 TIPS:');
    console.log('  • Hold button for 2 sec = Cycle modes');
    console.log('  • Shift + Click = Instant God Mode');
    console.log('  • Triple Click = Rainbow Mode');
    console.log('  • Konami Code = Epic Surprise!');
    console.log('  • 50 clicks = Auto God Mode');
    console.log('');
    console.log('Available Modes:');
    console.log('  🌈 Plasma • Aurora • Fire • Ice');
    console.log('  💚 Matrix • Quantum • Magnetic • DNA');
    console.log('');
});

