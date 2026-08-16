import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../lib/auth'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2, UserCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import BarangaySeal from '../components/BarangaySeal'
import GovTopBar from '../components/GovTopBar'
import './Auth.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const { login, isLoading } = useAuthStore()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const handleSubmit = async (e) => {
        e.preventDefault()

        const result = await login(email, password)

        if (result.success) {
            queryClient.clear()
            toast.success('Maligayang pagbabalik sa Barangay Burgos Portal!')
            navigate('/dashboard')
        } else {
            toast.error(result.error || 'Hindi magkatugma ang email o password.')
        }
    }

    // Quick demo autofill helper
    const handleQuickFill = (demoEmail, demoPass) => {
        setEmail(demoEmail)
        setPassword(demoPass)
        toast.success(`Na-autofill ang credentials para sa ${demoEmail}`)
    }

    const highContrast = localStorage.getItem('gov-high-contrast') === 'true'

    return (
        <div className={`auth-page ${highContrast ? 'accessibility-high-contrast' : ''}`}>
            <GovTopBar className="auth-top-bar" tag="Official Barangay Portal" />

            <header className="auth-site-header">
                <div className="auth-site-header-inner">
                    <Link to="/" className="auth-site-brand">
                        <BarangaySeal className="auth-site-seal" />
                        <div>
                            <strong>Barangay Burgos</strong>
                            <span>Official Barangay Portal</span>
                        </div>
                    </Link>
                    <Link to="/register" className="auth-site-nav-link">Magparehistro</Link>
                </div>
            </header>

            <section className="auth-hero" aria-labelledby="auth-heading">
                <div className="auth-hero-sky" aria-hidden="true" />
                <div className="auth-hero-watermark" aria-hidden="true">
                    <BarangaySeal className="auth-hero-seal-bg" />
                </div>
                <div className="auth-hero-inner">
                    <div className="auth-security-pill">
                        <ShieldCheck size={14} />
                        <span>256-Bit Encrypted Civic Authentication</span>
                    </div>
                    <p className="auth-kicker">Republic of the Philippines &bull; Lungsod ng Burgos</p>
                    <h1 id="auth-heading" className="auth-brand-mark">Mag-login sa Portal</h1>
                    <p className="auth-hero-lead">
                        I-access ang inyong mga kahilingan, sumubaybay sa reklamo, at magkaroon ng direktang ugnayan sa pamahalaang barangay.
                    </p>
                </div>
            </section>

            <main className="auth-main">
                <div className="auth-form-panel">
                    <Link to="/" className="auth-back-link">
                        <ArrowLeft size={16} />
                        Bumalik sa Homepage
                    </Link>

                    <div className="auth-header">
                        <span className="auth-gov-tag">Official Account Login</span>
                        <h2>Maligayang Pagbabalik</h2>
                        <p>Mag-sign in gamit ang inyong rehistradong email at password.</p>
                    </div>

                    {/* Quick Demo Credentials Bar */}
                    <div className="auth-demo-bar">
                        <span className="demo-label">
                            <Sparkles size={13} />
                            Quick Demo Login:
                        </span>
                        <div className="demo-buttons">
                            <button
                                type="button"
                                className="demo-btn"
                                onClick={() => handleQuickFill('resident@example.com', 'password123')}
                            >
                                Residente
                            </button>
                            <button
                                type="button"
                                className="demo-btn"
                                onClick={() => handleQuickFill('chairman@barangay.gov.ph', 'password123')}
                            >
                                Chairman
                            </button>
                            <button
                                type="button"
                                className="demo-btn"
                                onClick={() => handleQuickFill('secretary@barangay.gov.ph', 'password123')}
                            >
                                Secretary
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="login-email" className="form-label">Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} aria-hidden="true" />
                                <input
                                    id="login-email"
                                    type="email"
                                    className="input"
                                    placeholder="hal. pangalan@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="form-label-row">
                                <label htmlFor="login-password" className="form-label">Password</label>
                            </div>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} aria-hidden="true" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="Ilagay ang iyong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Itago ang password' : 'Ipakita ang password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="auth-options-row">
                            <label className="auth-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="auth-checkbox"
                                />
                                <span>Tandaan ako sa device na ito</span>
                            </label>
                        </div>

                        <button type="submit" className="auth-submit" disabled={isLoading}>
                            {isLoading ? (
                                <span className="auth-btn-loading">
                                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    Pumapasok...
                                </span>
                            ) : (
                                'Mag-login'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Wala ka pa bang account?{' '}
                            <Link to="/register">Magparehistro dito</Link>
                        </p>
                    </div>

                    <div className="auth-notice-box">
                        <div className="notice-icon">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="notice-content">
                            <strong>Paalala sa Seguridad:</strong>
                            <p>Siguraduhing ikaw ay nasa opisyal na portal bago maglagay ng credentials. Huwag ibahagi ang iyong password kahit kanino.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="auth-page-footer">
                <div className="footer-copyright-left">
                    <span>© 2026 Barangay Burgos &bull; Republic of the Philippines</span>
                </div>
                <div className="footer-gov-right">
                    <span className="auth-gov-logo">GOV.PH</span>
                </div>
            </footer>
        </div>
    )
}
