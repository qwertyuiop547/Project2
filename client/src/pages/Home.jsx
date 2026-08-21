import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import {
    ArrowRight,
    Building2,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    Clock,
    FileCheck,
    FileText,
    Lightbulb,
    Mail,
    MapPin,
    Megaphone,
    Menu,
    Phone,
    ShieldCheck,
    UserRound,
    Users,
    Search,
    Settings,
    Info,
    Scale,
    X,
    Sparkles,
    CheckCircle2,
    HelpCircle,
    ChevronDown,
    Zap,
    Lock,
    Activity,
    Ambulance,
    Flame,
    Siren,
    Download,
    Smartphone
} from 'lucide-react'
import GovTopBar from '../components/GovTopBar'
import BarangaySeal from '../components/BarangaySeal'
import PwaInstallModal from '../components/PwaInstallModal'
import { openPwaInstallModal } from '../lib/usePWA'
import './Home.css'

const primaryActions = [
    {
        to: '/complaints/new',
        icon: ClipboardList,
        title: 'Magsumite ng Reklamo',
        text: 'Iulat ang isyu o reklamo sa inyong barangay para sa agarang aksyon.',
        badge: 'Priority Action',
        accentColor: '#059669'
    },
    {
        to: '/services',
        icon: FileCheck,
        title: 'Kumuha ng Dokumento',
        text: 'Barangay Clearance, Certificate of Indigency, at iba pang papeles.',
        badge: 'Online Request',
        accentColor: '#1e3a8a'
    },
    {
        to: '/suggestions/new',
        icon: Lightbulb,
        title: 'Magmungkahi ng Ideya',
        text: 'Ibahagi ang inyong mga suhestiyon para sa ikauunlad ng komunidad.',
        badge: 'Community Voice',
        accentColor: '#d97706'
    },
    {
        to: '/announcements',
        icon: Megaphone,
        title: 'Tingnan ang mga Balita',
        text: 'Opisyal na abiso, medical missions, at mga kaganapan sa Burgos.',
        badge: 'Latest News',
        accentColor: '#0f172a'
    }
]

const servicesList = [
    {
        id: 'clearance',
        icon: FileText,
        title: 'Barangay Clearance',
        category: 'docs',
        tag: 'Most Requested',
        text: 'Opisyal na patunay ng residency at mabuting asal para sa trabaho, negosyo, at transaksyon.'
    },
    {
        id: 'business',
        icon: Building2,
        title: 'Business Clearance',
        category: 'business',
        tag: 'Negosyo',
        text: 'Kailangan para sa mga bagong negosyo at renewal ng business permit sa ating nasasakupan.'
    },
    {
        id: 'solo-parent',
        icon: Users,
        title: 'Solo Parent ID Certification',
        category: 'social',
        tag: 'Tulong Panlipunan',
        text: 'Sertipikasyon para ma-avail ang mga benepisyo at subsidiya para sa solo parents.'
    },
    {
        id: 'indigency',
        icon: ShieldCheck,
        title: 'Certificate of Indigency',
        category: 'social',
        tag: 'Libre',
        text: 'Para sa medical financial assistance, educational scholarship, at legal aid assistance.'
    },
    {
        id: 'permit',
        icon: FileCheck,
        title: 'Barangay Permit & Endorsement',
        category: 'business',
        tag: 'Permits',
        text: 'Permit para sa events, construction, sound/noise clearance, at paggamit ng barangay facilities.'
    },
    {
        id: 'lupon',
        icon: Scale,
        title: 'Katarungang Pambarangay (Lupon)',
        category: 'legal',
        tag: 'Mediation',
        text: 'Libreng tulong sa mapayapang pag-aayos ng alitan sa pamamagitan ng Lupon Tagapamayapa.'
    }
]

const statsHighlights = [
    { label: 'Digital Filing', value: '24/7', sub: 'Kahit anong oras' },
    { label: 'Average Processing', value: '24-48h', sub: 'Mabilis na aksyon' },
    { label: 'Resolution Rate', value: '98.5%', sub: 'Naresolbang isyu' },
    { label: 'Rehistradong Residente', value: '3,500+', sub: 'Konektado online' }
]

const announcementsList = [
    {
        id: 1,
        date: 'Jun 22, 2026',
        category: 'Opisyal na Abiso',
        title: 'Regular Office Operations at Digital Processing',
        text: 'Bukas ang pisikal na tanggapan ng Barangay Burgos mula Lunes hanggang Biyernes, 8:00 AM hanggang 5:00 PM. Ang online portal naman ay tumatanggap ng requests 24/7.'
    },
    {
        id: 2,
        date: 'Jun 18, 2026',
        category: 'Kalusugan',
        title: 'Medical at Dental Mission sa Barangay Hall Covered Court',
        text: 'Libreng check-up, konsultasyon sa doktor, gamot, at bitamina para sa mga senior citizens, kabataan, at buntis ngayong darating na Sabado, simula 8:00 AM.'
    },
    {
        id: 3,
        date: 'Jun 15, 2026',
        category: 'Komunidad',
        title: 'Barangay-wide Clean-up Drive at Anti-Dengue Operation',
        text: 'Inaanyayahan ang lahat ng mga residente na makiisa sa ating lingguhang paglilinis ng bakuran at tamang pagtatapon ng mga basurang pwedeng pamugaran ng lamok.'
    }
]

const whyOnlineFeatures = [
    {
        icon: Zap,
        title: 'Walang Mahabang Pila',
        text: 'Mag-file ng clearance o reklamo gamit ang cellphone o computer kahit nasaan ka man.'
    },
    {
        icon: Activity,
        title: 'Real-Time Status Tracking',
        text: 'Subaybayan ang galaw at estado ng inyong mga dokumento at reklamo sa bawat hakbang.'
    },
    {
        icon: Lock,
        title: 'Ligtas at Pribado',
        text: 'Protektado ang inyong personal na impormasyon alinsunod sa Data Privacy Act of 2012.'
    },
    {
        icon: Sparkles,
        title: 'AI-Powered Assistant',
        text: 'May interactive AI Assistant na handang sumagot sa inyong mga tanong tungkol sa serbisyo ng barangay.'
    }
]

const faqItems = [
    {
        q: 'Paano mag-request ng Barangay Clearance online?',
        a: 'Mag-login sa portal, pumunta sa "Services", piliin ang Barangay Clearance, punan ang kinakailangang impormasyon, at i-submit. Makakatanggap ka ng abiso kapag handa na itong i-claim.'
    },
    {
        q: 'Libre ba ang paghahain ng reklamo o suhestiyon?',
        a: 'Opo, 100% libre ang pag-file ng reklamo at pagsumite ng suhestiyon sa ating barangay portal.'
    },
    {
        q: 'Gaano kabilis mapoproseso ang aking request?',
        a: 'Karamihan sa mga clearances at certificates ay napoproseso sa loob ng 1 hanggang 2 araw ng trabaho (weekdays).'
    },
    {
        q: 'Sino ang maaaring humingi ng Certificate of Indigency?',
        a: 'Lahat ng kwalipikadong residente ng Barangay Burgos na nangangailangan ng tulong medikal, pinansyal, pang-edukasyon, o legal aid.'
    }
]

const emergencyHotlines = [
    { title: 'Barangay Hall Desk', number: '(02) 8123-4567', icon: Phone, color: '#059669' },
    { title: 'Barangay Tanod / Patrol', number: '0917-890-BURG', icon: Siren, color: '#1e3a8a' },
    { title: 'Health Center Clinic', number: '(02) 8123-4568', icon: Ambulance, color: '#059669' },
    { title: 'Fire & Rescue (BFP)', number: '911 / (02) 8421-1234', icon: Flame, color: '#dc2626' }
]

export default function Home() {
    const { isAuthenticated } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [openFaq, setOpenFaq] = useState(null)
    const [isAccOpen, setIsAccOpen] = useState(false)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
    const [highContrast, setHighContrast] = useState(() => localStorage.getItem('gov-high-contrast') === 'true')
    const [textSize, setTextSize] = useState(() => localStorage.getItem('gov-text-size') || 'normal')

    const greeting = useMemo(() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Magandang Umaga'
        if (hour < 18) return 'Magandang Hapon'
        return 'Magandang Gabi'
    }, [])

    useEffect(() => {
        localStorage.setItem('gov-high-contrast', highContrast)
    }, [highContrast])

    useEffect(() => {
        localStorage.setItem('gov-text-size', textSize)
    }, [textSize])

    useEffect(() => {
        document.body.style.overflow = isMobileNavOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isMobileNavOpen])

    const closeMobileNav = () => setIsMobileNavOpen(false)

    const filteredServices = useMemo(() => {
        return servicesList.filter(service => {
            const matchesQuery = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.text.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
            return matchesQuery && matchesCategory
        })
    }, [searchQuery, selectedCategory])

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index)
    }

    const mainContainerClass = [
        'home',
        'civic-home',
        highContrast ? 'accessibility-high-contrast' : '',
        `text-size-${textSize}`
    ].filter(Boolean).join(' ')

    return (
        <div className={mainContainerClass}>
            <a href="#main-content" className="skip-link">Skip to main content</a>

            <GovTopBar className="gov-top-bar-home" tag="Official Barangay Portal" />

            {/* Main Navigation Header */}
            <header className="home-header">
                <div className="home-header-inner">
                    <Link to="/" className="home-brand">
                        <BarangaySeal className="home-seal" />
                        <div>
                            <strong>Barangay Burgos</strong>
                            <span>Official Barangay Portal</span>
                        </div>
                    </Link>

                    <div className="home-header-actions">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="home-dashboard-btn home-header-cta">
                                Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="home-login-btn home-header-cta">
                                <UserRound size={16} />
                                Login
                            </Link>
                        )}
                        <button
                            type="button"
                            className="home-menu-toggle"
                            onClick={() => setIsMobileNavOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={isMobileNavOpen}
                        >
                            <Menu size={22} />
                        </button>
                    </div>

                    <nav className="home-nav home-nav-desktop" aria-label="Primary">
                        <a href="#services">Mga Serbisyo</a>
                        <a href="#features">Bakit Online?</a>
                        <a href="#announcements">Balita</a>
                        <a href="#faq">FAQ</a>
                        <a href="#contact">Ugnayan</a>
                        <button
                            type="button"
                            className="home-nav-install-btn"
                            onClick={openPwaInstallModal}
                            title="I-install ang Barangay Burgos App sa Home Screen"
                        >
                            <Download size={15} />
                            <span>Install App</span>
                        </button>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="home-dashboard-btn">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="home-login-btn">
                                    <UserRound size={16} />
                                    Login
                                </Link>
                                <Link to="/register" className="home-register-btn">
                                    Magparehistro
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileNavOpen && (
                <div className="home-mobile-nav" role="dialog" aria-modal="true" aria-label="Mobile navigation">
                    <div className="home-mobile-nav-backdrop" onClick={closeMobileNav} aria-hidden="true" />
                    <div className="home-mobile-nav-panel">
                        <div className="home-mobile-nav-top">
                            <span>Barangay Burgos Menu</span>
                            <button type="button" className="home-menu-close" onClick={closeMobileNav} aria-label="Close menu">
                                <X size={22} />
                            </button>
                        </div>
                        <nav className="home-mobile-nav-links" aria-label="Mobile">
                            <button
                                type="button"
                                className="home-mobile-install-cta"
                                onClick={() => {
                                    closeMobileNav()
                                    openPwaInstallModal()
                                }}
                            >
                                <Download size={18} />
                                <span>I-install ang Barangay App (PWA)</span>
                            </button>
                            <a href="#services" onClick={closeMobileNav}>Mga Serbisyo</a>
                            <a href="#features" onClick={closeMobileNav}>Bakit Online?</a>
                            <a href="#announcements" onClick={closeMobileNav}>Balita</a>
                            <a href="#faq" onClick={closeMobileNav}>Mga Tanong (FAQ)</a>
                            <a href="#contact" onClick={closeMobileNav}>Ugnayan at Hotline</a>
                            {isAuthenticated ? (
                                <Link to="/dashboard" onClick={closeMobileNav} className="home-mobile-nav-dashboard">
                                    Pumunta sa Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" onClick={closeMobileNav}>Login / Sign In</Link>
                                    <Link to="/register" className="home-mobile-nav-register" onClick={closeMobileNav}>
                                        Magparehistro bilang Residente
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            <main id="main-content">
                {/* Hero Section */}
                <section className="home-hero" aria-labelledby="hero-heading">
                    <div className="home-hero-sky" aria-hidden="true" />
                    <div className="home-hero-grid-pattern" aria-hidden="true" />
                    <div className="home-hero-watermark" aria-hidden="true">
                        <BarangaySeal className="home-hero-seal-bg" />
                    </div>

                    <div className="home-hero-inner">
                        <div className="home-hero-copy">
                            <div className="home-live-badge">
                                <span className="pulse-dot" aria-hidden="true" />
                                <span>{greeting}, Ka-Burgos! &bull; Online Portal Active</span>
                            </div>

                            <p className="home-kicker">Republic of the Philippines &bull; Lungsod ng Burgos</p>
                            <h1 className="home-brand-mark" id="hero-heading">Barangay Burgos</h1>
                            <p className="home-hero-lead">
                                Mabilis, tapat, at transparent na serbisyong pambarangay. Mag-request ng dokumento, mag-ulat ng reklamo, at magpahayag ng suhestiyon mula sa inyong tahanan.
                            </p>

                            <div className="home-hero-ctas">
                                <Link to={isAuthenticated ? '/services' : '/login'} className="home-cta-primary">
                                    <span>{isAuthenticated ? 'Mag-request ng Serbisyo' : 'Mag-login sa Portal'}</span>
                                    <ArrowRight size={18} />
                                </Link>
                                <a href="#services" className="home-cta-secondary">
                                    Tuklasin ang Serbisyo
                                </a>
                            </div>

                            {/* Hero Stats Ribbon */}
                            <div className="home-stats-strip">
                                {statsHighlights.map((stat) => (
                                    <div key={stat.label} className="home-stat-item">
                                        <strong className="home-stat-value">{stat.value}</strong>
                                        <span className="home-stat-label">{stat.label}</span>
                                        <small className="home-stat-sub">{stat.sub}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Overlapping Quick Actions */}
                <section className="home-quick-actions" aria-label="Mabilisang aksyon">
                    <div className="home-section-shell">
                        <div className="home-overlap">
                            <div className="home-overlap-header">
                                <div>
                                    <p className="home-section-eyebrow">Mabilisang Aksyon</p>
                                    <h2>Ano ang kailangan mo ngayon?</h2>
                                </div>
                                <span className="home-quick-pill">Pumili ng Transaksyon</span>
                            </div>

                            <div className="home-action-grid">
                                {primaryActions.map(action => (
                                    <Link key={action.title} to={action.to} className="home-action-card">
                                        <div className="home-action-card-top">
                                            <span className="home-action-icon" aria-hidden="true">
                                                <action.icon size={22} />
                                            </span>
                                            <span className="home-action-badge">{action.badge}</span>
                                        </div>
                                        <div className="home-action-card-body">
                                            <strong>{action.title}</strong>
                                            <p>{action.text}</p>
                                        </div>
                                        <div className="home-action-card-footer">
                                            <span>Magsimula</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section with Category Tabs */}
                <section id="services" className="home-section home-services">
                    <div className="home-section-shell">
                        <div className="home-section-header">
                            <div>
                                <p className="home-section-eyebrow">Opisyal na Dokumento at Tulong</p>
                                <h2>Mga Serbisyo ng Barangay</h2>
                                <p className="section-subtitle">
                                    Maghanap at magsumite ng kahilingan para sa mga opisyal na sertipiko at tulong.
                                </p>
                            </div>
                            <Link to="/services" className="view-all-link">
                                Lahat ng serbisyo <ArrowRight size={16} />
                            </Link>
                        </div>

                        {/* Search & Category Filter Toolbar */}
                        <div className="home-services-toolbar">
                            <div className="home-search-container">
                                <Search className="search-icon" size={18} aria-hidden="true" />
                                <label htmlFor="service-search" className="visually-hidden">Maghanap ng serbisyo</label>
                                <input
                                    id="service-search"
                                    type="search"
                                    placeholder="Maghanap: Hal. Clearance, Indigency, Lupon, Business..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="hero-search-input"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn">
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="home-category-tabs" role="tablist">
                                <button
                                    type="button"
                                    className={`cat-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    Lahat
                                </button>
                                <button
                                    type="button"
                                    className={`cat-tab ${selectedCategory === 'docs' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('docs')}
                                >
                                    Clearance & Docs
                                </button>
                                <button
                                    type="button"
                                    className={`cat-tab ${selectedCategory === 'social' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('social')}
                                >
                                    Tulong & Sertipiko
                                </button>
                                <button
                                    type="button"
                                    className={`cat-tab ${selectedCategory === 'business' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('business')}
                                >
                                    Negosyo & Permits
                                </button>
                                <button
                                    type="button"
                                    className={`cat-tab ${selectedCategory === 'legal' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('legal')}
                                >
                                    Lupon Tagapamayapa
                                </button>
                            </div>
                        </div>

                        {/* Services Grid */}
                        <div className="service-list-grid">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <Link key={service.id} to="/services" className="service-card-enhanced">
                                        <div className="service-card-top-row">
                                            <span className="service-icon-wrapper" aria-hidden="true">
                                                <service.icon size={22} />
                                            </span>
                                            <span className="service-tag">{service.tag}</span>
                                        </div>
                                        <div className="service-card-text">
                                            <strong>{service.title}</strong>
                                            <span>{service.text}</span>
                                        </div>
                                        <div className="service-card-action">
                                            <span>Pumili ng Serbisyo</span>
                                            <ChevronRight size={16} className="chevron-icon" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="services-empty-state">
                                    <Info size={36} aria-hidden="true" />
                                    <strong>Walang Nahanap na Serbisyo</strong>
                                    <span>Subukan ang ibang keyword tulad ng &ldquo;Clearance&rdquo; o &ldquo;Indigency&rdquo;.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Why Online Features Section */}
                <section id="features" className="home-section home-features-section">
                    <div className="home-section-shell">
                        <div className="home-features-header">
                            <p className="home-section-eyebrow">Benepisyo ng Digital Portal</p>
                            <h2>Bakit Mas Maganda Mag-transact Online?</h2>
                            <p className="section-subtitle">
                                Dinisenyo ang Barangay Burgos Portal upang magbigay ng maayos, transparent, at maginhawang serbisyo para sa bawat residente.
                            </p>
                        </div>

                        <div className="home-features-grid">
                            {whyOnlineFeatures.map((feat) => (
                                <div key={feat.title} className="home-feature-card">
                                    <div className="feature-icon-box">
                                        <feat.icon size={24} />
                                    </div>
                                    <h3>{feat.title}</h3>
                                    <p>{feat.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Announcements + Emergency Hotlines Section */}
                <section className="home-bottom-grid">
                    <div id="announcements" className="home-section announcements-panel">
                        <div className="home-section-shell">
                            <div className="home-section-header">
                                <div>
                                    <p className="home-section-eyebrow">Opisyal na Balita</p>
                                    <h2>Pinakabagong Anunsyo</h2>
                                </div>
                                <Link to="/announcements" className="view-all-link">
                                    Tingnan lahat <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="announcement-list">
                                {announcementsList.map((item) => (
                                    <article key={item.id} className="announcement-item-enhanced">
                                        <div className="announcement-meta-col">
                                            <span className="announcement-cat-badge">{item.category}</span>
                                            <time className="announcement-date-text">{item.date}</time>
                                        </div>
                                        <div className="announcement-content-text">
                                            <strong>{item.title}</strong>
                                            <p>{item.text}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div id="contact" className="home-section contact-panel">
                        <div className="home-section-shell home-contact-block">
                            <div className="home-contact-header">
                                <p className="home-section-eyebrow">Emergency &amp; Ugnayan</p>
                                <h2>Mga Hotline at Tanggapan</h2>
                            </div>

                            {/* Emergency hotline chips */}
                            <div className="emergency-hotlines-list">
                                {emergencyHotlines.map((hotline) => (
                                    <div key={hotline.title} className="emergency-hotline-card">
                                        <div className="hotline-icon-badge" style={{ color: hotline.color }}>
                                            <hotline.icon size={18} />
                                        </div>
                                        <div className="hotline-details">
                                            <span className="hotline-title">{hotline.title}</span>
                                            <strong className="hotline-num">{hotline.number}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="contact-lines-box">
                                <div className="contact-line">
                                    <MapPin size={18} aria-hidden="true" />
                                    <span>Barangay Burgos Hall Complex, Burgos</span>
                                </div>
                                <div className="contact-line">
                                    <Mail size={18} aria-hidden="true" />
                                    <span>brgy.burgos.portal@gmail.com</span>
                                </div>
                                <div className="contact-line">
                                    <CalendarDays size={18} aria-hidden="true" />
                                    <span>Lunes – Biyernes, 8:00 AM – 5:00 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="home-section home-faq-section">
                    <div className="home-section-shell">
                        <div className="home-faq-header">
                            <p className="home-section-eyebrow">Mga Karaniwang Katanungan</p>
                            <h2>Frequently Asked Questions (FAQ)</h2>
                            <p className="section-subtitle">
                                Narito ang mga kasagutan sa pinakamadalas itanong ng ating mga kabarangay.
                            </p>
                        </div>

                        <div className="home-faq-accordion">
                            {faqItems.map((faq, idx) => (
                                <div
                                    key={faq.q}
                                    className={`faq-item ${openFaq === idx ? 'open' : ''}`}
                                    onClick={() => toggleFaq(idx)}
                                >
                                    <button
                                        type="button"
                                        className="faq-question-btn"
                                        aria-expanded={openFaq === idx}
                                    >
                                        <span className="faq-question-text">{faq.q}</span>
                                        <ChevronDown size={18} className={`faq-chevron ${openFaq === idx ? 'rotate' : ''}`} />
                                    </button>
                                    {openFaq === idx && (
                                        <div className="faq-answer">
                                            <p>{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-inner">
                    <div className="footer-left">
                        <BarangaySeal className="footer-seal" />
                        <div>
                            <strong>Barangay Burgos</strong>
                            <p>© 2026 Republic of the Philippines &bull; Official Barangay Portal</p>
                            <small className="footer-privacy-text">Ligtas. Tapat. Moderno.</small>
                        </div>
                    </div>
                    <div className="footer-right">
                        <div className="footer-links">
                            <a href="#services">Mga Serbisyo</a>
                            <a href="#features">Bakit Online?</a>
                            <a href="#announcements">Balita</a>
                            <a href="#faq">FAQ</a>
                            <a href="#contact">Ugnayan</a>
                        </div>
                        <span className="footer-gov-logo">GOV.PH</span>
                    </div>
                </div>
            </footer>

            {/* Accessibility Widget */}
            <div className={`accessibility-widget ${isAccOpen ? 'open' : ''}`}>
                <button
                    type="button"
                    className="accessibility-toggle-btn"
                    onClick={() => setIsAccOpen(!isAccOpen)}
                    aria-label="Accessibility Options"
                    aria-expanded={isAccOpen}
                    title="Accessibility Options"
                >
                    <Settings size={22} className={isAccOpen ? 'rotate-cog' : ''} />
                </button>
                {isAccOpen && (
                    <div className="accessibility-panel" role="dialog" aria-label="Accessibility Options">
                        <h3>Accessibility Options</h3>

                        <div className="acc-section">
                            <h4>Contrast Mode</h4>
                            <button
                                type="button"
                                className={`acc-btn ${highContrast ? 'active' : ''}`}
                                onClick={() => setHighContrast(!highContrast)}
                            >
                                {highContrast ? 'High Contrast: ON' : 'I-enable High Contrast'}
                            </button>
                        </div>

                        <div className="acc-section">
                            <h4>Laki ng Text</h4>
                            <div className="acc-button-group">
                                <button
                                    type="button"
                                    className={`acc-btn-sm ${textSize === 'normal' ? 'active' : ''}`}
                                    onClick={() => setTextSize('normal')}
                                    title="Normal Text Size"
                                >
                                    A
                                </button>
                                <button
                                    type="button"
                                    className={`acc-btn-sm text-lg ${textSize === 'large' ? 'active' : ''}`}
                                    onClick={() => setTextSize('large')}
                                    title="Large Text Size"
                                >
                                    A+
                                </button>
                                <button
                                    type="button"
                                    className={`acc-btn-sm text-xl ${textSize === 'xl' ? 'active' : ''}`}
                                    onClick={() => setTextSize('xl')}
                                    title="Extra Large Text Size"
                                >
                                    A++
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="acc-reset-btn"
                            onClick={() => {
                                setHighContrast(false)
                                setTextSize('normal')
                            }}
                        >
                            Reset Options
                        </button>
                    </div>
                )}
            </div>

            <PwaInstallModal />
        </div>
    )
}
