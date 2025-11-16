// MAXIMUM EFFECTS AURORA - All Features Enabled, Optimized Performance
(function() {
    'use strict';
    
    console.log('🌌 MAXIMUM EFFECTS Aurora loading...');
    
    function createMaximumAurora() {
        const container = document.getElementById('aurora-background');
        if (!container) return;
        
        // Create all CSS layers (12 layers total!)
        const layers = [
            'aurora-layer-1',
            'aurora-layer-2', 
            'aurora-layer-3',
            'nebula-layer',
            'glow-orbs',
            'color-shift',
            'light-beams',
            'gradient-flow',
            'light-shimmer'
        ];
        
        layers.forEach(id => {
            const layer = document.createElement('div');
            layer.id = id;
            container.appendChild(layer);
        });
        
        // Optimized canvas
        const canvas = document.createElement('canvas');
        const dpr = Math.min(window.devicePixelRatio, 1.5);
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;mix-blend-mode:screen';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d', { 
            alpha: true, 
            desynchronized: true,
            willReadFrequently: false 
        });
        
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        function resizeCanvas() {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.scale(dpr, dpr);
        }
        resizeCanvas();
        
        // Particle container
        const particleContainer = document.createElement('div');
        particleContainer.id = 'aurora-particles';
        container.appendChild(particleContainer);
        
        // Debounced resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                width = window.innerWidth;
                height = window.innerHeight;
                resizeCanvas();
            }, 200);
        });
        const waves = [
            { amp: 115, freq: 0.0011, speed: 0.026, y: 0.20, c1: 'rgba(74,222,128,0.38)', c2: 'rgba(74,222,128,0.06)' },
            { amp: 92, freq: 0.0015, speed: 0.021, y: 0.30, c1: 'rgba(139,92,246,0.38)', c2: 'rgba(139,92,246,0.06)' },
            { amp: 135, freq: 0.0009, speed: 0.029, y: 0.40, c1: 'rgba(99,102,241,0.34)', c2: 'rgba(99,102,241,0.06)' },
            { amp: 78, freq: 0.0017, speed: 0.019, y: 0.50, c1: 'rgba(16,185,129,0.32)', c2: 'rgba(16,185,129,0.06)' },
            { amp: 105, freq: 0.0013, speed: 0.024, y: 0.60, c1: 'rgba(236,72,153,0.3)', c2: 'rgba(236,72,153,0.06)' },
            { amp: 88, freq: 0.0012, speed: 0.022, y: 0.70, c1: 'rgba(74,222,128,0.35)', c2: 'rgba(74,222,128,0.06)' },
            { amp: 98, freq: 0.0014, speed: 0.027, y: 0.80, c1: 'rgba(139,92,246,0.36)', c2: 'rgba(139,92,246,0.06)' },
            { amp: 110, freq: 0.0010, speed: 0.025, y: 0.90, c1: 'rgba(99,102,241,0.38)', c2: 'rgba(99,102,241,0.06)' }
        ];
        
        let time = 0;
        const step = 5;
        
        const gradients = waves.map(w => {
            const g = ctx.createLinearGradient(0, 0, 0, height);
            g.addColorStop(0, w.c2);
            g.addColorStop(0.35, w.c1);
            g.addColorStop(0.65, w.c1);
            g.addColorStop(1, w.c2);
            return g;
        });
        
        function drawWave(wave, gradient) {
            ctx.beginPath();
            ctx.moveTo(0, height);
            
            for (let x = 0; x <= width; x += step) {
                const y = height * wave.y + 
                    Math.sin(x * wave.freq + time * wave.speed) * wave.amp +
                    Math.sin(x * wave.freq * 2.4 - time * wave.speed * 0.7) * wave.amp * 0.38 +
                    Math.cos(x * wave.freq * 1.6 + time * wave.speed * 0.5) * wave.amp * 0.22;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        let lastTime = performance.now();
        let frameSkip = 0;
        
        function animate(currentTime) {
            if (document.hidden && frameSkip++ % 2 !== 0) {
                requestAnimationFrame(animate);
                return;
            }
            
            const elapsed = currentTime - lastTime;
            
            const targetFPS = document.hidden ? 30 : 60;
            const frameTime = 1000 / targetFPS;
            
            if (elapsed > frameTime) {
                ctx.clearRect(0, 0, width, height);
                
                waves.forEach((wave, idx) => {
                    drawWave(wave, gradients[idx]);
                });
                
                time += 0.42;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(animate);
        }
        
        requestAnimationFrame(animate);
        
        const maxParticles = 15;
        const particleShapes = ['circle', 'circle', 'circle', 'diamond', 'star'];
        const particleColors = [
            { c: 'rgba(74,222,128,0.75)', s: [2, 7] },
            { c: 'rgba(139,92,246,0.75)', s: [2, 7] },
            { c: 'rgba(99,102,241,0.75)', s: [2, 7] },
            { c: 'rgba(236,72,153,0.7)', s: [2, 6] },
            { c: 'rgba(16,185,129,0.7)', s: [2, 6] },
            { c: 'rgba(147,51,234,0.65)', s: [2, 5] }
        ];
        
        function createParticle() {
            if (particleContainer.children.length >= maxParticles) return;
            
            const p = document.createElement('div');
            const shape = particleShapes[Math.floor(Math.random() * particleShapes.length)];
            p.className = `aurora-particle particle-${shape}`;
            
            const colorData = particleColors[Math.floor(Math.random() * particleColors.length)];
            const size = Math.random() * (colorData.s[1] - colorData.s[0]) + colorData.s[0];
            
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.backgroundColor = colorData.c;
            p.style.color = colorData.c;
            
            const duration = Math.random() * 20 + 16;
            p.style.animationDuration = duration + 's';
            p.style.animationDelay = Math.random() * 2 + 's';
            
            particleContainer.appendChild(p);
            
            setTimeout(() => p.remove(), (duration + 2) * 1000);
        }
        
        for (let i = 0; i < maxParticles; i++) {
            setTimeout(() => createParticle(), i * 200);
        }
        
        setInterval(() => {
            if (!document.hidden && particleContainer.children.length < maxParticles) {
                createParticle();
            }
        }, 2500);
        
        function createShootingStar() {
            const s = document.createElement('div');
            const isComet = Math.random() > 0.7;
            s.className = isComet ? 'shooting-star comet' : 'shooting-star';
            s.style.left = Math.random() * width + 'px';
            s.style.top = Math.random() * (height * 0.35) + 'px';
            s.style.animationDuration = (Math.random() * 0.7 + 0.5) + 's';
            particleContainer.appendChild(s);
            setTimeout(() => s.remove(), 1400);
        }
        
        // Reduced shooting stars frequency
        setInterval(() => {
            if (Math.random() > 0.75 && !document.hidden) createShootingStar();
        }, 5000);
        
        // Removed comet burst for performance
        
        console.log('🌟✨ MAXIMUM EFFECTS Aurora ACTIVE! ✨🌟');
        console.log('📊 Features:');
        console.log('   • 20+ Stars in starfield (with bottom coverage)');
        console.log('   • Constellation patterns');
        console.log('   • 3 Aurora cloud layers');
        console.log('   • Nebula swirl effect');
        console.log('   • 5 Pulsing glow orbs');
        console.log('   • Color shifting gradients');
        console.log('   • Light beam rays');
        console.log('   • 2 Flowing gradient overlays');
        console.log('   • 8 Canvas wave layers (full viewport coverage)');
        console.log('   • 30 Particles (circles, diamonds, stars)');
        console.log('   • Shooting stars + comets');
        console.log('   • Enhanced vignette + bottom glow');
        console.log('   = 12+ CSS Layers + Canvas + Particles + WebGL!');

        // --- High-fidelity WebGL aurora layer (more accurate curtains) ---
        try {
            if (typeof OGL !== 'undefined') {
                const { Renderer, Program, Mesh, Triangle } = OGL;
                const renderer = new Renderer({ alpha: true, antialias: true, premultipliedAlpha: true });
                const gl = renderer.gl;
                gl.clearColor(0, 0, 0, 0);
                const oglCanvas = gl.canvas;
                oglCanvas.style.position = 'fixed';
                oglCanvas.style.top = '0';
                oglCanvas.style.left = '0';
                oglCanvas.style.width = '100%';
                oglCanvas.style.height = '100%';
                oglCanvas.style.pointerEvents = 'none';
                oglCanvas.style.zIndex = '3';
                oglCanvas.style.mixBlendMode = 'screen';
                container.appendChild(oglCanvas);

                const VERT = `#version 300 es
in vec2 position;
void main(){
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

                const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColors[4];

// 2D rotation
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c,-s,s,c);} 

// Simplex noise (2D)
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);} 
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod(i,289.0);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

float fbm(vec2 p){
  float f=0.0; float amp=0.5; mat2 m=rot(0.5);
  for(int i=0;i<5;i++){ f+=amp*snoise(p); p=m*p*2.0+0.1; amp*=0.5; }
  return f;
}

vec3 palette(float t){
  // 4-color gradient
  vec3 c0=uColors[0]; vec3 c1=uColors[1]; vec3 c2=uColors[2]; vec3 c3=uColors[3];
  vec3 a=mix(c0,c1,smoothstep(0.0,0.33,t));
  vec3 b=mix(c2,c3,smoothstep(0.33,1.0,t));
  return mix(a,b,smoothstep(0.25,0.75,t));
}

void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  // aspect-correct
  uv.x*=uResolution.x/uResolution.y;

  // Wind direction & curl distortion
  vec2 p=uv*2.0; p.y-=0.1; 
  float t=uTime*0.12; 
  float base=fbm(vec2(p.x*1.2 + t*0.6, t*0.2));
  float curtain=exp(-abs(p.y*1.4 - base*1.4)); // vertical curtain profile - wider spread
  // Add waviness with higher octave noise
  float waves=fbm(vec2(p.x*3.0 - t*0.9, p.y*0.6 + t*0.25));
  float intensity=clamp(curtain*0.8 + waves*0.35, 0.0, 1.0);

  // Horizontal color ramp
  vec3 col=palette(fract(uv.x*0.9 + t*0.05));
  col*=pow(intensity,1.2);

  // Soft horizon fade and sky falloff - extend to bottom
  float horizon=smoothstep(0.0,0.25,uv.y)*smoothstep(1.1,0.50,uv.y);
  float alpha=clamp(intensity*horizon*uIntensity*1.2,0.0,1.0);

  // Subtle grain dithering to reduce banding
  float d=fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453);
  col += (d-0.5)*0.01;

  fragColor=vec4(col, alpha*0.9);
}
`;

                const geometry = new Triangle(gl);
                const program = new Program(gl, {
                    vertex: VERT,
                    fragment: FRAG,
                    uniforms: {
                        uResolution: { value: [window.innerWidth, window.innerHeight] },
                        uTime: { value: 0 },
                        uIntensity: { value: 1.0 },
                        uColors: { value: [
                            [0.29,0.87,0.50], // green
                            [0.55,0.36,0.96], // purple
                            [0.39,0.40,0.95], // indigo
                            [0.62,0.84,0.98]  // icy blue
                        ] }
                    }
                });
                const mesh = new Mesh(gl, { geometry, program });

                function resize(){
                    const w = Math.floor(window.innerWidth);
                    const h = Math.floor(window.innerHeight);
                    renderer.setSize(w, h);
                    program.uniforms.uResolution.value = [w, h];
                }
                window.addEventListener('resize', resize);
                resize();

                const start = performance.now();
                let rafLastTime = 0;
                function raf(currentTime){
                    // Skip frames when page hidden
                    if (document.hidden) {
                        requestAnimationFrame(raf);
                        return;
                    }
                    
                    // Limit to 60fps
                    if (currentTime - rafLastTime > 16.67) {
                        const t = (performance.now() - start)*0.001;
                        program.uniforms.uTime.value = t;
                        renderer.render({ scene: mesh });
                        rafLastTime = currentTime;
                    }
                    requestAnimationFrame(raf);
                }
                raf();
                console.log('🎨 High-fidelity WebGL aurora layer ACTIVE');
            } else {
                console.warn('OGL not available, skipping high-fidelity layer');
            }
        } catch (e) {
            console.warn('Aurora OGL layer error:', e);
        }
        // --- end OGL layer ---
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createMaximumAurora);
    } else {
        createMaximumAurora();
    }
})();
