import { Outlet, NavLink, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../lib/auth'
import { getRoleLabel } from '../lib/roles'
import {
    Home,
    FileText,
    Lightbulb,
    Megaphone,
    FileCheck,
    LogOut,
    Menu,
    X,
    User,
    Globe2,
    Bell,
    ChevronDown,
    Download,
    Smartphone
} from 'lucide-react'
import { useState, useEffect } from 'react'
import './Layout.css'
import BarangayChatbot from './BarangayChatbot'
import BarangaySeal from './BarangaySeal'
import PwaInstallBanner from './PwaInstallBanner'
import PwaInstallModal from './PwaInstallModal'
import { openPwaInstallModal } from '../lib/usePWA'
import NotificationDropdown from './NotificationDropdown'

export default function Layout() {
    const { user, logout } = useAuthStore()
    const queryClient = useQueryClient()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isMobileMenuOpen])

    const handleLogout = () => {
        queryClient.clear()
        logout()
        window.location.replace('/')
    }

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/complaints', icon: FileText, label: 'Complaints' },
        { path: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
        { path: '/announcements', icon: Megaphone, label: 'Announcements' },
        { path: '/services', icon: FileCheck, label: 'Services' },
        { path: '/profile', icon: User, label: 'My Profile' },
    ]

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="logo">
                        <BarangaySeal className="logo-seal" />
                        <div className="logo-text">
                            Barangay Portal
                            <span>Tapat • Tuloy • Serbisyo</span>
                        </div>
                    </Link>
                    <button
                        className="mobile-close"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Dedicated Install App Nav Item */}
                    <button
                        type="button"
                        className="sidebar-pwa-btn"
                        onClick={() => {
                            setIsMobileMenuOpen(false)
                            openPwaInstallModal()
                        }}
                    >
                        <div className="sidebar-pwa-inner">
                            <Download size={18} className="sidebar-pwa-icon" />
                            <span>Install App</span>
                        </div>
                        <span className="sidebar-pwa-tag">PWA</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <NavLink
                        to="/profile"
                        className="user-info"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <div className="user-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{user?.firstName} {user?.lastName}</div>
                            <div className="user-role">{getRoleLabel(user?.role)}</div>
                        </div>
                    </NavLink>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                <header className="app-topbar">
                    <div className="app-topbar-left">
                        <button
                            className="topbar-menu"
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open navigation"
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <h1>Barangay Burgos</h1>
                            <p>Official Barangay Portal</p>
                        </div>
                    </div>
                    <div className="app-topbar-actions">
                        <button
                            type="button"
                            className="topbar-install-link"
                            onClick={openPwaInstallModal}
                            title="I-install ang Barangay Burgos App"
                        >
                            <Smartphone size={16} />
                            <span>Install App</span>
                        </button>
                        <Link to="/" className="topbar-link">
                            <Globe2 size={18} />
                            Public Site
                        </Link>
                        <NotificationDropdown />
                        <Link to="/profile" className="topbar-user">
                            <div className="topbar-avatar">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <div>
                                <strong>{user?.firstName} {user?.lastName}</strong>
                                <span>{getRoleLabel(user?.role)}</span>
                            </div>
                            <ChevronDown size={16} />
                        </Link>
                    </div>
                </header>

                {/* Mobile header */}
                <header className="mobile-header">
                    <button
                        type="button"
                        className="menu-toggle"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu size={22} />
                    </button>
                    <Link to="/dashboard" className="mobile-logo">
                        <BarangaySeal className="mobile-logo-seal" compact />
                        <span className="mobile-title">Barangay Burgos</span>
                    </Link>
                    <div className="mobile-header-right">
                        <button
                            type="button"
                            className="mobile-install-icon-btn"
                            onClick={openPwaInstallModal}
                            title="Install App"
                            aria-label="Install App"
                        >
                            <Download size={18} />
                        </button>
                        <NotificationDropdown />
                        <Link to="/profile" className="mobile-avatar" aria-label="My profile">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </Link>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <BarangayChatbot />
            <PwaInstallBanner />
            <PwaInstallModal />
        </div>
    )
}
