import { useState, useEffect } from 'react'

export default function GovTopBar({ tag = 'Official Community Portal', className = '' }) {
    const classes = ['gov-top-bar', className].filter(Boolean).join(' ')
    const [pstTime, setPstTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setPstTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const formatPST = (date) => {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila'
        }
        return new Intl.DateTimeFormat('en-US', options).format(date)
    }

    return (
        <div className={classes}>
            <div className="gov-top-bar-inner">
                <div className="gov-top-bar-left">
                    <svg className="gov-ph-flag" viewBox="0 0 28 14" aria-hidden="true">
                        <rect width="28" height="7" fill="#0038A8" />
                        <rect y="7" width="28" height="7" fill="#CE1126" />
                        <polygon points="0,0 14,7 0,14" fill="#FFFFFF" />
                        <circle cx="7" cy="7" r="2.5" fill="#FCD116" />
                        <circle cx="8.5" cy="7" r="2.5" fill="#0038A8" />
                    </svg>
                    <span className="gov-republic">Republic of the Philippines</span>
                    <span className="gov-separator" aria-hidden="true" />
                    <span className="gov-portal-tag">{tag}</span>
                </div>
                <div className="gov-top-bar-right">
                    <span className="gov-time-label">Philippine Standard Time:</span>
                    <span className="gov-time-value">{formatPST(pstTime)}</span>
                </div>
            </div>
        </div>
    )
}

