import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import {
    Mail,
    Lock,
    User,
    Phone,
    MapPin,
    Eye,
    EyeOff,
    ArrowLeft,
    AlertCircle,
    ShieldCheck,
    CheckCircle2,
    Info,
    FileCheck2
} from 'lucide-react'
import toast from 'react-hot-toast'
import BarangaySeal from '../components/BarangaySeal'
import GovTopBar from '../components/GovTopBar'
import './Auth.css'

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: ''
    })
    const [agreePrivacy, setAgreePrivacy] = useState(false)
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const { register, isLoading } = useAuthStore()
    const navigate = useNavigate()

    const passwordStrength = useMemo(() => {
        const p = formData.password
        if (!p) return { score: 0, text: 'Wala pa', color: '#94a3b8', width: '0%' }
        let score = 0
        if (p.length >= 6) score += 1
        if (p.length >= 8) score += 1
        if (/[A-Z]/.test(p) || /[0-9]/.test(p)) score += 1
        if (/[^A-Za-z0-9]/.test(p)) score += 1

        if (score <= 1) return { score: 1, text: 'Mahina', color: '#dc2626', width: '25%' }
        if (score === 2) return { score: 2, text: 'Katamtaman', color: '#d97706', width: '50%' }
        if (score === 3) return { score: 3, text: 'Maganda', color: '#2563eb', width: '75%' }
        return { score: 4, text: 'Napakalakas', color: '#059669', width: '100%' }
    }, [formData.password])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const newErrors = {}

        if (!agreePrivacy) {
            toast.error('Paki-sang-ayunan ang Data Privacy Act at Patakaran ng Barangay bago magpatuloy.')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Hindi magkatugma ang Password.'
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Ang password ay dapat hindi bababa sa 6 na karakter.'
        }

        if (formData.phone && !/^(09|\+639)\d{9}$/.test(formData.phone)) {
            newErrors.phone = 'Mangyaring maglagay ng valid na 11-digit mobile number (hal. 09171234567).'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error('May mga error sa iyong form. Paki-ayos muna.')
            return
        }

        const result = await register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            password: formData.password
        })

        if (result.success) {
            toast.success('Matagumpay ang pagpaparehistro! Maaari ka nang mag-login.')
            navigate('/login')
        } else {
            toast.error(result.error || 'Nagkaroon ng problema sa pagpaparehistro.')
        }
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
                    <Link to="/login" className="auth-site-nav-link">Mag-login</Link>
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
                        <span>Official Resident Membership Enrollment</span>
                    </div>
                    <p className="auth-kicker">Republic of the Philippines &bull; Lungsod ng Burgos</p>
                    <h1 id="auth-heading" className="auth-brand-mark">Magparehistro bilang Residente</h1>
                    <p className="auth-hero-lead">
                        Lumikha ng inyong opisyal na account para mabilis na makahiling ng clearances, maghain ng reklamo, at makinabang sa serbisyo ng barangay.
                    </p>
                </div>
            </section>

            <main className="auth-main auth-main-wide">
                <div className="auth-form-panel">
                    <Link to="/" className="auth-back-link">
                        <ArrowLeft size={16} />
                        Bumalik sa Homepage
                    </Link>

                    <div className="auth-header">
                        <span className="auth-gov-tag">Citizen Enrollment</span>
                        <h2>Bagong Residente Account</h2>
                        <p>Punan ang mga impormasyon sa ibaba nang tumpak at totoo.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Section 1: Pangalan */}
                        <div className="auth-section-title">
                            <User size={16} />
                            <span>1. Personal na Impormasyon</span>
                        </div>

                        <div className="auth-grid">
                            <div className="form-group">
                                <label htmlFor="reg-firstName" className="form-label">First Name (Pangalan) *</label>
                                <div className="input-wrapper">
                                    <User className="input-icon" size={18} aria-hidden="true" />
                                    <input
                                        id="reg-firstName"
                                        type="text"
                                        name="firstName"
                                        className="input"
                                        placeholder="hal. Juan"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        autoComplete="given-name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-lastName" className="form-label">Last Name (Apelyido) *</label>
                                <div className="input-wrapper">
                                    <User className="input-icon" size={18} aria-hidden="true" />
                                    <input
                                        id="reg-lastName"
                                        type="text"
                                        name="lastName"
                                        className="input"
                                        placeholder="hal. Dela Cruz"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        autoComplete="family-name"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact & Address */}
                        <div className="auth-section-title" style={{ marginTop: '8px' }}>
                            <Mail size={16} />
                            <span>2. Kontak at Tirahan</span>
                        </div>

                        <div className="auth-grid">
                            <div className="form-group">
                                <label htmlFor="reg-email" className="form-label">Email Address *</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={18} aria-hidden="true" />
                                    <input
                                        id="reg-email"
                                        type="email"
                                        name="email"
                                        className="input"
                                        placeholder="pangalan@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-phone" className="form-label">Mobile Number *</label>
                                <div className={`input-wrapper ${errors.phone ? 'has-error' : ''}`}>
                                    <Phone className="input-icon" size={18} aria-hidden="true" />
                                    <input
                                        id="reg-phone"
                                        type="tel"
                                        name="phone"
                                        className="input"
                                        placeholder="09171234567"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        autoComplete="tel"
                                        required
                                    />
                                </div>
                                {errors.phone && (
                                    <span className="auth-error-message">
                                        <AlertCircle size={14} /> {errors.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-address" className="form-label">Kumpletong Tirahan sa Barangay Burgos *</label>
                            <div className="input-wrapper">
                                <MapPin className="input-icon" size={18} aria-hidden="true" />
                                <input
                                    id="reg-address"
                                    type="text"
                                    name="address"
                                    className="input"
                                    placeholder="House No., Street Name, Purok/Zone, Barangay Burgos"
                                    value={formData.address}
                                    onChange={handleChange}
                                    autoComplete="street-address"
                                    required
                                />
                            </div>
                        </div>

                        {/* Section 3: Seguridad */}
                        <div className="auth-section-title" style={{ marginTop: '8px' }}>
                            <Lock size={16} />
                            <span>3. Seguridad ng Account</span>
                        </div>

                        <div className="auth-grid">
                            <div className="form-group">
                                <label htmlFor="reg-password" className="form-label">Password *</label>
                                <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
                                    <Lock className="input-icon" size={18} aria-hidden="true" />
                                    <input
                                        id="reg-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="input"
                                        placeholder="Di bababa sa 6 na karakter"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
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
                                {errors.password && (
                                    <span className="auth-error-message">
                                        <AlertCircle size={14} /> {errors.password}
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-confirmPassword" className="form-label">Kumpirmahin ang Password *</label>
                                <div className={`input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                                    <Lock className="input-icon" size={18} aria-hidden="true" />
                                    <input
                                        id="reg-confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        className="input"
                                        placeholder="Ulitin ang password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? 'Itago ang password' : 'Ipakita ang password'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <span className="auth-error-message">
                                        <AlertCircle size={14} /> {errors.confirmPassword}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Password strength meter */}
                        {formData.password && (
                            <div className="pwd-strength-box">
                                <div className="pwd-strength-header">
                                    <small>Lakas ng Password: <strong style={{ color: passwordStrength.color }}>{passwordStrength.text}</strong></small>
                                </div>
                                <div className="pwd-strength-bar-bg">
                                    <div
                                        className="pwd-strength-bar-fill"
                                        style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Data Privacy Agreement */}
                        <div className="auth-privacy-box">
                            <label className="auth-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={agreePrivacy}
                                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                                    className="auth-checkbox"
                                    required
                                />
                                <span>
                                    Sumasang-ayon ako na ang aking ibinigay na impormasyon ay gagamitin lamang para sa opisyal na transaksyon ng Barangay Burgos alinsunod sa <strong>Data Privacy Act of 2012 (R.A. 10173)</strong>.
                                </span>
                            </label>
                        </div>

                        <button type="submit" className="auth-submit" disabled={isLoading}>
                            {isLoading ? (
                                <span className="auth-btn-loading">
                                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    Ipinoproseso ang Pagpaparehistro...
                                </span>
                            ) : (
                                'Kumpletuhin ang Pagpaparehistro'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Mayroon ka na bang account?{' '}
                            <Link to="/login">Mag-login dito</Link>
                        </p>
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
