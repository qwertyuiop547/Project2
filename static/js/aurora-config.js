/**
 * Aurora Background Configuration
 * 
 * Customize your Aurora background by editing the values below.
 * After making changes, clear your browser cache and refresh the page.
 */

const AURORA_CONFIG = {
  // Color gradient stops (use hex color codes)
  // The aurora will smoothly transition between these colors
  colorStops: [
    '#4ade80',  // Green (left)
    '#8b5cf6',  // Purple (middle)
    '#6366f1'   // Indigo/Blue (right)
  ],

  // Blend amount (0.0 - 1.0)
  // Controls how smooth the color transitions are
  // Lower = sharper, Higher = smoother
  blend: 0.7,

  // Wave amplitude (0.0 - 2.0)
  // Controls the height/intensity of the aurora waves
  // Lower = subtle, Higher = dramatic
  amplitude: 1.8,

  // Animation speed (0.0 - 2.0)
  // Controls how fast the aurora moves
  // Lower = slower, Higher = faster
  speed: 0.4
};

// ============================================
// PRESET CONFIGURATIONS
// ============================================
// Uncomment one of these to use a preset,
// or create your own custom configuration above

// Preset 1: Ocean Breeze
// const AURORA_CONFIG = {
//   colorStops: ['#0077be', '#00d4ff', '#4ecdc4'],
//   blend: 0.6,
//   amplitude: 0.8,
//   speed: 0.2
// };

// Preset 2: Sunset Vibes
// const AURORA_CONFIG = {
//   colorStops: ['#ff6b6b', '#feca57', '#ee5a6f'],
//   blend: 0.7,
//   amplitude: 1.2,
//   speed: 0.4
// };

// Preset 3: Forest Dream
// const AURORA_CONFIG = {
//   colorStops: ['#2d4a2b', '#5eb663', '#8bc34a'],
//   blend: 0.5,
//   amplitude: 0.9,
//   speed: 0.3
// };

// Preset 4: Purple Haze
// const AURORA_CONFIG = {
//   colorStops: ['#5227FF', '#7cff67', '#5227FF'],
//   blend: 0.6,
//   amplitude: 1.0,
//   speed: 0.5
// };

// Preset 5: Neon Night
// const AURORA_CONFIG = {
//   colorStops: ['#FF0080', '#7928CA', '#FF0080'],
//   blend: 0.4,
//   amplitude: 1.3,
//   speed: 0.7
// };

// Preset 6: Calm Sky (Subtle)
// const AURORA_CONFIG = {
//   colorStops: ['#667eea', '#764ba2', '#667eea'],
//   blend: 0.8,
//   amplitude: 0.5,
//   speed: 0.2
// };

// Preset 7: Fire & Ice
// const AURORA_CONFIG = {
//   colorStops: ['#00d2ff', '#ff00e5', '#ff4d00'],
//   blend: 0.5,
//   amplitude: 1.4,
//   speed: 0.6
// };

// Preset 8: Mint Fresh
// const AURORA_CONFIG = {
//   colorStops: ['#11998e', '#38ef7d', '#11998e'],
//   blend: 0.6,
//   amplitude: 0.7,
//   speed: 0.3
// };

