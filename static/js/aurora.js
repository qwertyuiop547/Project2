// Aurora Background Component using OGL
const VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                            \\
  for (int i = 0; i < 2; i++) {                               \\
     ColorStop currentColor = colors[i];                    \\
     bool isInBetween = currentColor.position <= factor;    \\
     index = int(mix(float(index), float(i), float(isInBetween))); \\
  }                                                         \\
  ColorStop currentColor = colors[index];                   \\
  ColorStop nextColor = colors[index + 1];                  \\
  float range = nextColor.position - currentColor.position; \\
  float lerpFactor = (factor - currentColor.position) / range; \\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

class AuroraBackground {
  constructor(container, options = {}) {
    this.container = container;
    this.colorStops = options.colorStops || ['#3A29FF', '#FF94B4', '#FF3232'];
    this.amplitude = options.amplitude || 1.0;
    this.blend = options.blend || 0.5;
    this.speed = options.speed || 0.5;
    
    this.init();
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
  }

  init() {
    const { Renderer, Program, Mesh, Triangle } = OGL;

    this.renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    });

    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = 'transparent';
    gl.canvas.style.position = 'fixed';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.pointerEvents = 'none';

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = this.colorStops.map(hex => {
      const c = this.hexToRgb(hex);
      return [c.r, c.g, c.b];
    });

    this.program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: this.amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [window.innerWidth, window.innerHeight] },
        uBlend: { value: this.blend }
      }
    });

    this.mesh = new Mesh(gl, { geometry, program: this.program });
    this.container.appendChild(gl.canvas);

    this.resize();
    this.startTime = Date.now();
    this.animate();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    if (this.program) {
      this.program.uniforms.uResolution.value = [width, height];
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const time = (Date.now() - this.startTime) * 0.001;
    this.program.uniforms.uTime.value = time * this.speed * 0.1;
    
    this.renderer.render({ scene: this.mesh });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.resize);
    const gl = this.renderer.gl;
    if (this.container && gl.canvas.parentNode === this.container) {
      this.container.removeChild(gl.canvas);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

// Initialize Aurora background when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const auroraContainer = document.getElementById('aurora-background');
  if (auroraContainer && typeof OGL !== 'undefined') {
    // Use configuration from aurora-config.js if available, otherwise use defaults
    const config = typeof AURORA_CONFIG !== 'undefined' ? AURORA_CONFIG : {
      colorStops: ['#4ade80', '#8b5cf6', '#6366f1'],
      blend: 0.7,
      amplitude: 1.8,
      speed: 0.4
    };
    
    console.log('🌈 Aurora Background initialized with config:', config);
    window.auroraBackground = new AuroraBackground(auroraContainer, config);
  } else if (!auroraContainer) {
    console.error('❌ Aurora container not found!');
  } else if (typeof OGL === 'undefined') {
    console.error('❌ OGL library not loaded!');
  }
});

