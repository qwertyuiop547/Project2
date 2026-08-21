import { useState, useRef, useEffect } from 'react'
import {
    Download, X, Smartphone, ShieldCheck, Zap, WifiOff,
    CheckCircle2, Share2, PlusSquare, MoreVertical, Laptop,
    Sparkles, ArrowRight
} from 'lucide-react'
import gsap from 'gsap'
import { usePWA } from '../lib/usePWA'
import BarangaySeal from './BarangaySeal'
import './PwaInstallModal.css'

export default function PwaInstallModal() {
    const {
        isModalOpen,
        closeModal,
        hasNativePrompt,
        promptInstall,
        isIOS,
        isAndroid,
        isAppInstalled,
    } = usePWA()

    const [isInstalling, setIsInstalling] = useState(false)
    const backdropRef = useRef(null)
    const cardRef = useRef(null)
    const sealRef = useRef(null)

    useEffect(() => {
        if (!isModalOpen || !cardRef.current) return

        const ctx = gsap.context(() => {
            const tl = gsap.timeline()

            tl.fromTo(
                backdropRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.25, ease: 'power2.out' }
            )

            tl.fromTo(
                cardRef.current,
                {
                    scale: 0.8,
                    y: 40,
                    opacity: 0,
                    rotateX: 10,
                    transformPerspective: 800,
                },
                {
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    rotateX: 0,
                    duration: 0.5,
                    ease: 'back.out(1.8)',
                    clearProps: 'transformPerspective',
                },
                '-=0.15'
            )

            if (sealRef.current) {
                tl.fromTo(
                    sealRef.current,
                    { scale: 0.5, rotate: -15 },
                    { scale: 1, rotate: 0, duration: 0.4, ease: 'back.out(2)' },
                    '-=0.3'
                )
            }

            tl.fromTo(
                '.pwa-benefit-item',
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, stagger: 0.08, duration: 0.35, ease: 'power2.out' },
                '-=0.2'
            )
        }, cardRef)

        return () => ctx.revert()
    }, [isModalOpen])

    if (!isModalOpen) return null

    const handleClose = () => {
        if (cardRef.current && backdropRef.current) {
            gsap.to(cardRef.current, {
                scale: 0.85,
                y: 30,
                opacity: 0,
                duration: 0.22,
                ease: 'power2.in',
            })
            gsap.to(backdropRef.current, {
                opacity: 0,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: closeModal,
            })
        } else {
            closeModal()
        }
    }

    const handleNativeInstall = async () => {
        setIsInstalling(true)
        try {
            await promptInstall()
        } finally {
            setIsInstalling(false)
        }
    }

    return (
        <div ref={backdropRef} className="pwa-modal-backdrop" onClick={handleClose}>
            <div ref={cardRef} className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    type="button"
                    className="pwa-modal-close"
                    onClick={handleClose}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Modal Header */}
                <div className="pwa-modal-header">
                    <div ref={sealRef} className="pwa-seal-wrap">
                        <BarangaySeal className="pwa-modal-seal" />
                        <span className="pwa-modal-badge">
                            <ShieldCheck size={14} /> Official PWA
                        </span>
                    </div>

                    <h2>Barangay Burgos Official App</h2>
                    <p className="pwa-modal-subtitle">
                        I-install nang direkta sa iyong cellphone o computer — walang kailangang Google Play o App Store download!
                    </p>
                </div>

                {/* Key Benefits Grid */}
                <div className="pwa-benefits-grid">
                    <div className="pwa-benefit-item">
                        <div className="benefit-icon bg-emerald">
                            <Zap size={18} />
                        </div>
                        <div>
                            <strong>Instant Access</strong>
                            <span>1-tap buksan mula sa iyong Home Screen</span>
                        </div>
                    </div>

                    <div className="pwa-benefit-item">
                        <div className="benefit-icon bg-blue">
                            <WifiOff size={18} />
                        </div>
                        <div>
                            <strong>Offline Hotlines</strong>
                            <span>Tingnan ang 911 at Tanod desk kahit walang internet</span>
                        </div>
                    </div>

                    <div className="pwa-benefit-item">
                        <div className="benefit-icon bg-amber">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <strong>Magagaan & Mabilis</strong>
                            <span>Mababa sa 1MB, hindi makakapuno ng memory</span>
                        </div>
                    </div>
                </div>

                {/* Installation Method / Instructions */}
                <div className="pwa-install-action-section">
                    {isAppInstalled ? (
                        <div className="pwa-installed-banner">
                            <CheckCircle2 size={24} className="text-emerald-600" />
                            <div>
                                <strong>Naka-install na ang App!</strong>
                                <p>Tingnan ang "Brgy Burgos" icon sa iyong device Home Screen o App Drawer.</p>
                            </div>
                        </div>
                    ) : hasNativePrompt ? (
                        <button
                            type="button"
                            className="pwa-primary-install-btn"
                            onClick={handleNativeInstall}
                            disabled={isInstalling}
                        >
                            <Download size={20} />
                            <span>{isInstalling ? 'Inihahanda ang Pag-install...' : 'I-install ang App Ngayon (1-Click)'}</span>
                        </button>
                    ) : isIOS ? (
                        /* iOS / Safari Step-by-Step Guide */
                        <div className="pwa-step-guide ios-guide">
                            <div className="guide-title">
                                <Smartphone size={18} />
                                <span>Paano i-install sa iPhone / iPad (Safari):</span>
                            </div>
                            <ol className="pwa-steps-list">
                                <li>
                                    Pindutin ang <strong className="guide-pill"><Share2 size={13} /> Share button</strong> sa ibaba ng Safari browser.
                                </li>
                                <li>
                                    Mag-scroll pababa at piliin ang <strong className="guide-pill"><PlusSquare size={13} /> Add to Home Screen</strong>.
                                </li>
                                <li>
                                    Pindutin ang <strong>"Add"</strong> sa kanang itaas para malagay sa iyong Home Screen!
                                </li>
                            </ol>
                        </div>
                    ) : (
                        /* Android / Chrome Manual Guide */
                        <div className="pwa-step-guide android-guide">
                            <div className="guide-title">
                                <Smartphone size={18} />
                                <span>Paano i-install sa Android / Chrome:</span>
                            </div>
                            <ol className="pwa-steps-list">
                                <li>
                                    Pindutin ang <strong className="guide-pill"><MoreVertical size={13} /> 3 Dots Menu</strong> sa kanang itaas ng browser.
                                </li>
                                <li>
                                    Piliin ang <strong className="guide-pill"><Download size={13} /> Install app</strong> o <strong>Add to Home screen</strong>.
                                </li>
                                <li>
                                    Kumpirmahin ang pag-install para lumitaw ang Barangay Burgos App icon!
                                </li>
                            </ol>
                        </div>
                    )}
                </div>

                {/* Footer note */}
                <div className="pwa-modal-footer">
                    <span>Protektado ng Republic Act No. 10173 • Pamahalaang Barangay Burgos</span>
                </div>
            </div>
        </div>
    )
}
