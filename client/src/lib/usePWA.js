import { useState, useEffect } from 'react'

export function usePWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isAppInstalled, setIsAppInstalled] = useState(false)
    const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
    const [dismissed, setDismissed] = useState(() => {
        return localStorage.getItem('pwa-install-dismissed') === 'true'
    })

    useEffect(() => {
        // Check if already running in standalone mode (installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
        setIsAppInstalled(isStandalone)

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }

        const handleAppInstalled = () => {
            setIsAppInstalled(true)
            setIsInstallable(false)
            setDeferredPrompt(null)
        }

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const promptInstall = async () => {
        if (!deferredPrompt) {
            return false
        }
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setIsInstallable(false)
            setDeferredPrompt(null)
            return true
        }
        return false
    }

    const dismissInstall = () => {
        setDismissed(true)
        localStorage.setItem('pwa-install-dismissed', 'true')
    }

    return {
        isInstallable: isInstallable && !dismissed && !isAppInstalled,
        isAppInstalled,
        isOnline,
        promptInstall,
        dismissInstall,
    }
}
