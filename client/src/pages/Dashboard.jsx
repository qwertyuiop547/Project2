import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { isOfficial } from '../lib/roles'
import api from '../lib/api'
import {
    FileText, Lightbulb, Bell, CheckCircle2, Clock, Plus, ArrowRight, 
    AlertCircle, FileCheck, ClipboardList, MessageCircle, Megaphone, 
    Download, CalendarDays, Search, TrendingUp, ShieldCheck, MapPin, 
    Sparkles, ShieldAlert, Siren, Building2, ChevronRight, PhoneCall
} from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
    const { user } = useAuthStore()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 18) return 'Good Afternoon'
        return 'Good Evening'
    }

    const greeting = getGreeting()
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboard-stats', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats')
            return data
        },
        enabled: !!user?.id
    })

    const { data: recent } = useQuery({
        queryKey: ['dashboard-recent', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/recent')
            return data
        },
        enabled: !!user?.id
    })

    const userIsOfficial = isOfficial(user?.role)

    if (isLoading || !user?.id) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="page dashboard-page animate-fadeIn">
                <div className="card dashboard-error-card">
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h4>Unable to load dashboard</h4>
                        <p>Please refresh the page or try again later.</p>
                    </div>
                </div>
            </div>
        )
    }

    const suggestionCount = userIsOfficial
        ? (stats?.suggestions?.total ?? 0)
        : (typeof stats?.suggestions === 'number' ? stats.suggestions : 0)

    const recentComplaints = recent?.complaints?.slice(0, 5) || []
    const pendingComplaints = stats?.complaints?.pending || 0
    const inProgressComplaints = stats?.complaints?.in_progress || 0
    const resolvedComplaints = stats?.complaints?.resolved || 0
    const totalComplaints = pendingComplaints + inProgressComplaints + resolvedComplaints
    const serviceRequests = stats?.services?.requested || stats?.serviceRequests?.total || stats?.services?.total || 0

    return (
        <div className="page dashboard-page animate-fadeIn">
            {/* Command Center Hero Banner */}
            <div className="dashboard-hero-banner">
                <div className="dashboard-hero-content">
                    <div className="dashboard-hero-badge">
                        <ShieldAlert size={14} /> Barangay Burgos Public Service Portal
                    </div>
                    <h1>{greeting}, {user?.firstName || 'Resident'}!</h1>
                    <p>
                        {userIsOfficial
                            ? 'Overview of active community cases, citizen requests, and barangay emergency operations.'
                            : 'Access official barangay services, report community concerns with AI, and track case progress in real time.'}
                    </p>

                    <div className="dashboard-hero-quick-actions">
                        <Link to="/complaints/new" className="hero-action-btn primary-hero-btn">
                            <Plus size={16} />
                            <span>File a Complaint</span>
                        </Link>
                        <Link to="/services" className="hero-action-btn secondary-hero-btn">
                            <FileCheck size={16} />
                            <span>Request Documents</span>
                        </Link>
                    </div>
                </div>

                <div className="dashboard-hero-date-card">
                    <div className="date-card-icon">
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <span className="date-label">Today's Date</span>
                        <strong className="date-val">{today}</strong>
                        <span className="location-badge">📍 Barangay Burgos, Basey, Samar</span>
                    </div>
                </div>
            </div>

            {/* Live KPI Metric Cards */}
            <div className="dashboard-kpi-grid">
                <div className="kpi-card kpi-pending">
                    <div className="kpi-top">
                        <span className="kpi-label">Pending Action</span>
                        <div className="kpi-icon-box icon-amber">
                            <Clock size={18} />
                        </div>
                    </div>
                    <strong className="kpi-number">{pendingComplaints}</strong>
                    <div className="kpi-footer">
                        <span className="kpi-subtext">Awaiting resolution</span>
                        <Link to="/complaints?status=PENDING" className="kpi-link">View ➔</Link>
                    </div>
                </div>

                <div className="kpi-card kpi-in-progress">
                    <div className="kpi-top">
                        <span className="kpi-label">In Progress</span>
                        <div className="kpi-icon-box icon-blue">
                            <AlertCircle size={18} />
                        </div>
                    </div>
                    <strong className="kpi-number">{inProgressComplaints}</strong>
                    <div className="kpi-footer">
                        <span className="kpi-subtext">Responders dispatched</span>
                        <Link to="/complaints?status=IN_PROGRESS" className="kpi-link">View ➔</Link>
                    </div>
                </div>

                <div className="kpi-card kpi-resolved">
                    <div className="kpi-top">
                        <span className="kpi-label">Resolved Cases</span>
                        <div className="kpi-icon-box icon-green">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <strong className="kpi-number">{resolvedComplaints}</strong>
                    <div className="kpi-footer">
                        <span className="kpi-subtext">Actions completed</span>
                        <Link to="/complaints?status=RESOLVED" className="kpi-link">View ➔</Link>
                    </div>
                </div>

                <div className="kpi-card kpi-services">
                    <div className="kpi-top">
                        <span className="kpi-label">Document Services</span>
                        <div className="kpi-icon-box icon-indigo">
                            <FileText size={18} />
                        </div>
                    </div>
                    <strong className="kpi-number">{serviceRequests}</strong>
                    <div className="kpi-footer">
                        <span className="kpi-subtext">Certificates & IDs</span>
                        <Link to="/services" className="kpi-link">Explore ➔</Link>
                    </div>
                </div>

                <div className="kpi-card kpi-ideas">
                    <div className="kpi-top">
                        <span className="kpi-label">Community Ideas</span>
                        <div className="kpi-icon-box icon-gold">
                            <Lightbulb size={18} />
                        </div>
                    </div>
                    <strong className="kpi-number">{suggestionCount}</strong>
                    <div className="kpi-footer">
                        <span className="kpi-subtext">Citizen proposals</span>
                        <Link to="/suggestions" className="kpi-link">Browse ➔</Link>
                    </div>
                </div>
            </div>

            {/* Main Content Layout (2 Columns) */}
            <div className="dashboard-content-layout">
                {/* Left Column: Quick Services & Action Modules */}
                <div className="dashboard-main-column">
                    <div className="dashboard-section-card">
                        <div className="section-card-header">
                            <div>
                                <h2>Quick Services & Portals</h2>
                                <p>Direct shortcuts to essential barangay digital services</p>
                            </div>
                        </div>

                        <div className="quick-services-grid">
                            <Link to="/complaints/new" className="quick-portal-item item-emerald">
                                <div className="portal-icon-wrap">
                                    <ShieldAlert size={24} />
                                </div>
                                <div className="portal-text-wrap">
                                    <h4>File a Complaint</h4>
                                    <p>AI report generator with satellite GPS pinning</p>
                                </div>
                                <ArrowRight size={18} className="portal-arrow" />
                            </Link>

                            <Link to="/services" className="quick-portal-item item-blue">
                                <div className="portal-icon-wrap">
                                    <FileCheck size={24} />
                                </div>
                                <div className="portal-text-wrap">
                                    <h4>Request Certificates</h4>
                                    <p>Barangay Clearance, Indigency, ID, & Permits</p>
                                </div>
                                <ArrowRight size={18} className="portal-arrow" />
                            </Link>

                            <Link to="/complaints" className="quick-portal-item item-indigo">
                                <div className="portal-icon-wrap">
                                    <ClipboardList size={24} />
                                </div>
                                <div className="portal-text-wrap">
                                    <h4>Incident Satellite Map</h4>
                                    <p>Live map plotting and responder tracking</p>
                                </div>
                                <ArrowRight size={18} className="portal-arrow" />
                            </Link>

                            <Link to="/suggestions" className="quick-portal-item item-amber">
                                <div className="portal-icon-wrap">
                                    <Lightbulb size={24} />
                                </div>
                                <div className="portal-text-wrap">
                                    <h4>Community Suggestions</h4>
                                    <p>Propose and vote on community improvements</p>
                                </div>
                                <ArrowRight size={18} className="portal-arrow" />
                            </Link>

                            <Link to="/announcements" className="quick-portal-item item-teal">
                                <div className="portal-icon-wrap">
                                    <Megaphone size={24} />
                                </div>
                                <div className="portal-text-wrap">
                                    <h4>Official Advisories</h4>
                                    <p>Barangay announcements and event notices</p>
                                </div>
                                <ArrowRight size={18} className="portal-arrow" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Reports & Barangay Desk */}
                <div className="dashboard-side-column">
                    {/* Recent Incident Reports */}
                    <div className="dashboard-section-card">
                        <div className="section-card-header">
                            <div>
                                <h2>Recent Incident Reports</h2>
                                <p>Latest active cases linked to the community</p>
                            </div>
                            <Link to="/complaints" className="view-all-link">
                                View All <ChevronRight size={15} />
                            </Link>
                        </div>

                        {recentComplaints.length > 0 ? (
                            <div className="dashboard-recent-list">
                                {recentComplaints.map(complaint => {
                                    const statusLower = (complaint.status || 'PENDING').toLowerCase().replace('_', '-')
                                    const cleanLoc = complaint.location ? complaint.location.split('[')[0].trim() : ''

                                    return (
                                        <Link 
                                            key={complaint.id} 
                                            to={`/complaints/${complaint.id}`}
                                            className="dashboard-recent-item"
                                        >
                                            <div className="recent-item-icon">
                                                <FileText size={18} />
                                            </div>
                                            <div className="recent-item-details">
                                                <div className="recent-item-title-row">
                                                    <strong>{complaint.title}</strong>
                                                    <span className={`status-pill-mini pill-${statusLower}`}>
                                                        {complaint.status?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="recent-item-meta">
                                                    {complaint.category?.name && <span>🏷️ {complaint.category.name}</span>}
                                                    {cleanLoc && <span>📍 {cleanLoc}</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="empty-recent-box">
                                <FileText size={36} className="empty-icon-subtle" />
                                <p>No recent complaints filed.</p>
                                <Link to="/complaints/new" className="empty-action-link">
                                    File a Complaint ➔
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Official Barangay Burgos Notice Desk */}
                    <div className="dashboard-hall-notice-card">
                        <div className="hall-notice-header">
                            <Building2 size={20} className="text-green-700" />
                            <h4>Barangay Burgos Action Center</h4>
                        </div>
                        <p className="hall-notice-text">
                            For urgent in-person assistance, visit the Barangay Hall at Basey-Sohoton Road, Barangay Burgos, Basey, Samar.
                        </p>
                        <div className="hall-notice-meta">
                            <div className="notice-chip">
                                <Clock size={13} />
                                <span>Mon - Fri: 8:00 AM - 5:00 PM</span>
                            </div>
                            <div className="notice-chip">
                                <PhoneCall size={13} />
                                <span>Desk: 0917-882-8746</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
