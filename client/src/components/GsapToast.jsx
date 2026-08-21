import { useEffect, useRef } from 'react'
import { resolveValue, toast } from 'react-hot-toast'
import gsap from 'gsap'
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react'
import './GsapToast.css'

export default function GsapToast({ t }) {
    const toastRef = useRef(null)
    const iconRef = useRef(null)

    useEffect(() => {
        if (!toastRef.current) return

        if (t.visible) {
            // GSAP 3 Elastic Spring Bounce Entrance
            const ctx = gsap.context(() => {
                const tl = gsap.timeline()
                
                tl.fromTo(
                    toastRef.current,
                    {
                        y: -60,
                        scale: 0.75,
                        opacity: 0,
                        rotateX: -25,
                        transformPerspective: 800,
                    },
                    {
                        y: 0,
                        scale: 1,
                        opacity: 1,
                        rotateX: 0,
                        duration: 0.55,
                        ease: 'back.out(2)', // Signature GSAP dynamic spring bounce
                        clearProps: 'transformPerspective',
                    }
                )

                if (iconRef.current) {
                    tl.fromTo(
                        iconRef.current,
                        {
                            scale: 0,
                            rotate: -45,
                        },
                        {
                            scale: 1,
                            rotate: 0,
                            duration: 0.35,
                            ease: 'back.out(2.5)',
                        },
                        '-=0.35'
                    )
                }
            }, toastRef)

            return () => ctx.revert()
        } else {
            // GSAP Smooth Exit
            gsap.to(toastRef.current, {
                y: -25,
                scale: 0.85,
                opacity: 0,
                rotateX: 15,
                duration: 0.25,
                ease: 'power3.in',
            })
        }
    }, [t.visible])

    const getIcon = () => {
        if (t.type === 'success') {
            return (
                <div ref={iconRef} className="toast-icon-wrap icon-success">
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                </div>
            )
        }
        if (t.type === 'error') {
            return (
                <div ref={iconRef} className="toast-icon-wrap icon-error">
                    <AlertCircle size={18} strokeWidth={2.5} />
                </div>
            )
        }
        if (t.type === 'loading') {
            return (
                <div ref={iconRef} className="toast-icon-wrap icon-loading">
                    <Loader2 size={18} className="animate-spin" />
                </div>
            )
        }
        return (
            <div ref={iconRef} className="toast-icon-wrap icon-info">
                <Info size={18} strokeWidth={2.5} />
            </div>
        )
    }

    return (
        <div
            ref={toastRef}
            className={`gsap-toast-container toast-type-${t.type} ${t.className || ''}`}
            onClick={() => toast.dismiss(t.id)}
            role="alert"
        >
            <div className="gsap-toast-body">
                {t.icon ? <span className="toast-custom-icon">{t.icon}</span> : getIcon()}
                <div className="gsap-toast-text">
                    {resolveValue(t.message, t)}
                </div>
            </div>

            <button
                type="button"
                className="gsap-toast-close"
                onClick={(e) => {
                    e.stopPropagation()
                    toast.dismiss(t.id)
                }}
                aria-label="Close notification"
            >
                <X size={14} />
            </button>
        </div>
    )
}
