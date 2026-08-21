import { useState, useEffect } from 'react'

// Custom event to trigger PWA install modal from anywhere in the app
const PWA_MODAL_EVENT = 'open-pwa-install-modal'

export function openPwaInstallModal() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PWA_MODAL_EVENT))
    }
}

export function usePWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isAppInstalled, setIsAppInstalled] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
    const [dismissed, setDismissed] = useState(() => {
        return typeof localStorage !== 'undefined' && localStorage.getItem('pwa-install-dismissed') === 'true'
    })

    // Detect Platform
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    useEffect(() => {
        // Check standalone display mode (already installed PWA)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
        setIsAppInstalled(isStandalone)

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)

            // Auto-trigger prompt for mobile & desktop if not installed and not dismissed in this session
            const autoPromptSession = sessionStorage.getItem('pwa-autoprompt-triggered')
            if (!autoPromptSession && !isStandalone) {
                sessionStorage.setItem('pwa-autoprompt-triggered', 'true')
                setTimeout(() => {
                    setIsModalOpen(true)
                }, 1600)
            }
        }

        const handleAppInstalled = () => {
            setIsAppInstalled(true)
            setIsInstallable(false)
            setDeferredPrompt(null)
            setIsModalOpen(false)
        }

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        const handleOpenModal = () => {
            setIsModalOpen(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        window.addEventListener(PWA_MODAL_EVENT, handleOpenModal)

        // Fallback auto-prompt for iOS / mobile browsers where beforeinstallprompt doesn't fire natively
        const isMobileDevice = /iPad|iPhone|iPod|Android/.test(navigator.userAgent)
        const mobilePromptSession = sessionStorage.getItem('pwa-mobile-guide-triggered')
        if (isMobileDevice && !isStandalone && !mobilePromptSession) {
            sessionStorage.setItem('pwa-mobile-guide-triggered', 'true')
            setTimeout(() => {
                const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true'
                if (!isDismissed) {
                    setIsModalOpen(true)
                }
            }, 2500)
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener(PWA_MODAL_EVENT, handleOpenModal)
        }
    }, [])

    const promptInstall = async () => {
        if (!deferredPrompt) {
            // If no native deferred prompt, open the dedicated install guide modal
            setIsModalOpen(true)
            return false
        }
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setIsInstallable(false)
            setDeferredPrompt(null)
            setIsModalOpen(false)
            return true
        }
        return false
    }

    const dismissInstall = () => {
        setDismissed(true)
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('pwa-install-dismissed', 'true')
        }
    }

    const openModal = () => setIsModalOpen(true)
    const closeModal = () => setIsModalOpen(false)

    return {
        isInstallable: isInstallable && !dismissed && !isAppInstalled,
        hasNativePrompt: !!deferredPrompt,
        isAppInstalled,
        isOnline,
        isModalOpen,
        isIOS,
        isAndroid,
        isSafari,
        promptInstall,
        dismissInstall,
        openModal,
        closeModal,
    }
}
