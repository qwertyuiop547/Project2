import { useState } from 'react'
import { Download, X, WifiOff, Smartphone, ShieldCheck } from 'lucide-react'
import { usePWA } from '../lib/usePWA'
import './PwaInstallBanner.css'

export default function PwaInstallBanner() {
    const { isInstallable, isOnline, promptInstall, dismissInstall } = usePWA()
    const [installing, setInstalling] = useState(false)

    const handleInstallClick = async () => {
        setInstalling(true)
        try {
            await promptInstall()
        } finally {
            setInstalling(false)
        }
    }

    return (
        <>
            {/* Offline Alert Bar */}
            {!isOnline && (
                <aside className="pwa-offline-bar" role="status" aria-live="polite">
                    <div className="pwa-offline-content">
                        <WifiOff className="pwa-offline-icon" size={18} />
                        <span>
                            <strong>Offline Ka Muna:</strong> Naka-enable ang cached mode. Maaari mo pa ring tingnan ang mga naka-save na emergency hotlines at announcements.
                        </span>
                    </div>
                </aside>
            )}

            {/* Install Promotion Banner */}
            {isInstallable && (
                <aside className="pwa-install-banner" aria-label="Install Barangay App">
                    <div className="pwa-install-container">
                        <div className="pwa-install-left">
                            <div className="pwa-install-icon-wrapper">
                                <img src="/pwa-icon.svg" alt="Brgy Seal" className="pwa-app-icon" />
                                <span className="pwa-verified-badge" title="Official Barangay App">
                                    <ShieldCheck size={12} />
                                </span>
                            </div>
                            <div className="pwa-install-text">
                                <div className="pwa-install-title">
                                    <Smartphone size={16} className="pwa-mobile-icon" />
                                    I-install ang Barangay Burgos App
                                </div>
                                <div className="pwa-install-desc">
                                    Mabilisang access sa Emergency Hotlines, Reklamo, at E-Services nang direkta sa Home Screen!
                                </div>
                            </div>
                        </div>

                        <div className="pwa-install-actions">
                            <button
                                type="button"
                                className="pwa-btn-install"
                                onClick={handleInstallClick}
                                disabled={installing}
                            >
                                <Download size={15} />
                                <span>{installing ? 'Nag-iinstall...' : 'I-install App'}</span>
                            </button>
                            <button
                                type="button"
                                className="pwa-btn-close"
                                onClick={dismissInstall}
                                aria-label="Dismiss banner"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </aside>
            )}
        </>
    )
}
