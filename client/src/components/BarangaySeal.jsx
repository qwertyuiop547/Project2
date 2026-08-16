import './BarangaySeal.css'

export default function BarangaySeal({ className = '', compact = false }) {
    // Dynamic viewBox to zoom into the inner seal when compact
    const viewBox = compact ? "35 35 130 130" : "0 0 200 200"

    return (
        <svg
            className={`barangay-seal-svg ${compact ? 'compact' : ''} ${className}`}
            viewBox={viewBox}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Barangay Burgos official seal"
            role="img"
        >
            <defs>
                {/* Premium Metallic Gold Gradient */}
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="25%" stopColor="#FFFDD0" />
                    <stop offset="50%" stopColor="#AA771C" />
                    <stop offset="75%" stopColor="#FDF6C7" />
                    <stop offset="100%" stopColor="#8B6508" />
                </linearGradient>

                {/* Inner Circle Radial Gradient */}
                <radialGradient id="innerCircleFill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="70%" stopColor="#fafafa" />
                    <stop offset="100%" stopColor="#f3f1e8" />
                </radialGradient>

                {/* Outer Ring Background Gradient */}
                <linearGradient id="outerRingFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f7f9f8" />
                </linearGradient>

                {/* Center Shield Diagonal Split Gradient */}
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f2c94c" />
                    <stop offset="49%" stopColor="#f2c94c" />
                    <stop offset="51%" stopColor="#0f6b45" />
                    <stop offset="100%" stopColor="#0f6b45" />
                </linearGradient>

                {/* Invisible Circular Paths for Text Alignment */}
                {/* Clockwise top half path for "BARANGAY BURGOS" */}
                <path
                    id="topTextPath"
                    d="M 28 100 A 72 72 0 0 1 172 100"
                    fill="none"
                />
                {/* Counter-clockwise bottom half path for "OFFICIAL SEAL" */}
                <path
                    id="bottomTextPath"
                    d="M 28 100 A 72 72 0 0 0 172 100"
                    fill="none"
                />
            </defs>

            {/* Render outer components only if not in compact mode */}
            {!compact && (
                <>
                    {/* Outer Gold Ring Border */}
                    <circle cx="100" cy="100" r="95" fill="none" stroke="url(#goldGrad)" strokeWidth="5" />
                    <circle cx="100" cy="100" r="91" fill="none" stroke="url(#goldGrad)" strokeWidth="1" />

                    {/* Outer Ring White Background */}
                    <circle cx="100" cy="100" r="91" fill="url(#outerRingFill)" />

                    {/* Decorative Dividers (Gold Stars) */}
                    <g transform="translate(26, 100)">
                        <path d="M 0,-4 L 1.2,-1.2 L 4,-1.2 L 1.8,0.8 L 2.6,3.6 L 0,1.8 L -2.6,3.6 L -1.8,0.8 L -4,-1.2 L -1.2,-1.2 Z" fill="url(#goldGrad)" />
                    </g>
                    <g transform="translate(174, 100)">
                        <path d="M 0,-4 L 1.2,-1.2 L 4,-1.2 L 1.8,0.8 L 2.6,3.6 L 0,1.8 L -2.6,3.6 L -1.8,0.8 L -4,-1.2 L -1.2,-1.2 Z" fill="url(#goldGrad)" />
                    </g>

                    {/* Curved Typography */}
                    <text className="barangay-seal-text top-text">
                        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
                            BARANGAY BURGOS
                        </textPath>
                    </text>
                    <text className="barangay-seal-text bottom-text">
                        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
                            OFFICIAL SEAL
                        </textPath>
                    </text>
                </>
            )}

            {/* Inner Ring Separator (shows as outer edge in compact mode) */}
            <circle cx="100" cy="100" r="63" fill="none" stroke="url(#goldGrad)" strokeWidth="3" />

            {/* Four-Color Quadrant Ring (representing official colors) */}
            {/* Top-Right: Blue */}
            <path d="M 100 100 L 162 100 A 62 62 0 0 0 100 38 Z" fill="#1e5f8a" />
            {/* Bottom-Right: Yellow */}
            <path d="M 100 100 L 162 100 A 62 62 0 0 1 100 162 Z" fill="#f2c94c" />
            {/* Bottom-Left: Green */}
            <path d="M 100 100 L 100 162 A 62 62 0 0 1 38 100 Z" fill="#0f6b45" />
            {/* Top-Left: Red */}
            <path d="M 100 100 L 38 100 A 62 62 0 0 1 100 38 Z" fill="#c82333" />

            {/* Inner Circle Border & Fill */}
            <circle cx="100" cy="100" r="45" fill="url(#innerCircleFill)" stroke="url(#goldGrad)" strokeWidth="2" />

            {/* Center Shield */}
            <path
                className="barangay-seal-shield-svg"
                d="M 82 82 L 100 85 L 118 82 L 118 100 C 118 112 100 122 100 122 C 100 122 82 112 82 100 Z"
                fill="url(#shieldGrad)"
                stroke="url(#goldGrad)"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />

            {/* White Star inside Shield */}
            <g transform="translate(100, 93)">
                <path d="M 0,-4.5 L 1.3,-1.3 L 4.5,-1.3 L 2,0.9 L 2.9,4 L 0,2 L -2.9,4 L -2,0.9 L -4.5,-1.3 L -1.3,-1.3 Z" fill="#ffffff" />
            </g>

            {/* Neoclassical Government Hall inside Shield */}
            <g className="barangay-seal-hall-svg">
                {/* Roof */}
                <polygon points="100,97 90,103 110,103" fill="#ffffff" />
                {/* Architrave */}
                <rect x="91" y="103" width="18" height="1.8" fill="#ffffff" />
                {/* Pillars */}
                <rect x="93.5" y="104.8" width="1.5" height="6.5" fill="#ffffff" />
                <rect x="97.5" y="104.8" width="1.5" height="6.5" fill="#ffffff" />
                <rect x="101" y="104.8" width="1.5" height="6.5" fill="#ffffff" />
                <rect x="105" y="104.8" width="1.5" height="6.5" fill="#ffffff" />
                {/* Foundation Base */}
                <rect x="90.5" y="111.3" width="19" height="1.8" fill="#ffffff" />
            </g>
        </svg>
    )
}
