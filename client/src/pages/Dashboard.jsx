import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { isOfficial } from '../lib/roles'
import api from '../lib/api'
import {
    FileText,
    Lightbulb,
    Bell,
    CheckCircle,
    Clock,
    Plus,
    ArrowRight,
    AlertCircle,
    FileCheck,
    ClipboardList,
    MessageCircle,
    Megaphone,
    Download,
    CalendarDays,
    Search,
    TrendingUp,
    ShieldCheck
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

    const userFullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    const recentComplaints = recent?.complaints?.slice(0, 5) || []
    const totalComplaints = (stats?.complaints?.pending || 0) + (stats?.complaints?.in_progress || 0) + (stats?.complaints?.resolved || 0)
    const serviceRequests = stats?.services?.requested || stats?.serviceRequests?.total || stats?.services?.total || 0

    if (!userIsOfficial) {
        const residentCards = [
            { label: 'Pending', value: stats?.complaints?.pending || 0, icon: Clock, tone: 'gold' },
            { label: 'In Progress', value: stats?.complaints?.in_progress || 0, icon: AlertCircle, tone: 'blue' },
            { label: 'Resolved', value: stats?.complaints?.resolved || 0, icon: CheckCircle, tone: 'green' },
            { label: 'My Ideas', value: suggestionCount, icon: Lightbulb, tone: 'navy' }
        ]

        const residentActions = [
            { to: '/complaints/new', icon: Plus, title: 'File Complaint', text: 'Report a barangay concern or issue.' },
            { to: '/services', icon: FileCheck, title: 'Request Documents', text: 'Apply for certificates and clearances.' },
            { to: '/suggestions/new', icon: Lightbulb, title: 'Submit Idea', text: 'Share a suggestion for the community.' },
            { to: '/announcements', icon: Bell, title: 'View Announcements', text: 'Read official barangay updates.' }
        ]

        return (
            <div className="page dashboard-page resident-dashboard animate-fadeIn">
                <section className="resident-hero">
                    <div>
                        <span>{today}</span>
                        <h1>Resident Service Dashboard</h1>
                        <p>{greeting}, {user?.firstName}. Track your requests and access barangay services.</p>
                    </div>
                    <div className="resident-hero-actions">
                        <Link to="/complaints/new" className="btn btn-primary">
                            <Plus size={18} />
                            File Complaint
                        </Link>
                        <Link to="/suggestions/new" className="btn btn-success">
                            <Lightbulb size={18} />
                            Submit Idea
                        </Link>
                    </div>
                </section>

                <section className="resident-summary-grid">
                    {residentCards.map(card => (
                        <div key={card.label} className="resident-stat-card">
                            <div className={`kpi-icon ${card.tone}`}>
                                <card.icon size={22} />
                            </div>
                            <strong>{card.value}</strong>
                            <span>{card.label}</span>
                        </div>
                    ))}
                </section>

                <section className="resident-action-grid">
                    {residentActions.map(action => (
                        <Link key={action.title} to={action.to} className="resident-action-card">
                            <action.icon size={24} />
                            <div>
                                <h3>{action.title}</h3>
                                <p>{action.text}</p>
                            </div>
                            <ArrowRight size={18} />
                        </Link>
                    ))}
                </section>

                <section className="resident-record-panel">
                    <div className="resident-panel-header">
                        <div>
                            <h2>My Recent Requests</h2>
                            <p>Latest complaint records linked to your account.</p>
                        </div>
                        <Link to="/complaints" className="resident-view-all">
                            View All <ArrowRight size={15} />
                        </Link>
                    </div>

                    {recentComplaints.length > 0 ? (
                        <div className="resident-request-list">
                            {recentComplaints.map(complaint => {
                                const statusClass = complaint.status?.toLowerCase().replace('_', '-')
                                return (
                                    <Link key={complaint.id} to={`/complaints/${complaint.id}`} className="resident-request-row">
                                        <div className="request-icon">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <strong>{complaint.title}</strong>
                                            <span>{complaint.category?.name} • {new Date(complaint.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`badge badge-${statusClass}`}>{complaint.status?.replace('_', ' ')}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FileText size={48} />
                            <h4>No recent requests</h4>
                            <p>Start by filing a complaint or requesting a document.</p>
                        </div>
                    )}
                </section>
            </div>
        )
    }

    const kpis = [
        {
            label: 'Total Complaints',
            value: totalComplaints,
            note: 'Active community records',
            icon: MessageCircle,
            tone: 'green'
        },
        {
            label: 'For Action',
            value: stats?.complaints?.pending || 0,
            note: 'Kailangan ng atensyon',
            icon: ClipboardList,
            tone: 'blue'
        },
        {
            label: 'Resolved',
            value: stats?.complaints?.resolved || 0,
            note: `${stats?.complaints?.resolutionRate || 0}% resolution rate`,
            icon: CheckCircle,
            tone: 'green'
        },
        {
            label: 'Suggestions',
            value: suggestionCount,
            note: 'Ideas from residents',
            icon: Lightbulb,
            tone: 'gold'
        },
        {
            label: 'Services Requested',
            value: serviceRequests,
            note: 'Certificates and clearances',
            icon: FileText,
            tone: 'navy'
        }
    ]

    const quickServices = [
        { to: '/complaints', icon: MessageCircle, title: 'Manage Complaints', text: 'I-update ang status ng reklamo', tone: 'blue-line' },
        { to: '/suggestions', icon: Lightbulb, title: 'Review Suggestions', text: 'Tingnan ang mungkahi ng residente', tone: 'gold-line' },
        { to: '/services', icon: FileCheck, title: 'Process Certificates', text: 'Barangay clearance at iba pa', tone: 'green-line' },
        { to: '/announcements', icon: Megaphone, title: 'Post Announcement', text: 'Maglabas ng opisyal na abiso', tone: 'blue-line' },
        { to: '/complaints', icon: ClipboardList, title: 'Track Cases', text: 'Subaybayan ang pending records', tone: 'navy-line' },
        { to: '/services', icon: Download, title: 'Review Requests', text: 'Mga kailangang dokumento', tone: 'green-line' }
    ]

    return (
        <div className="page dashboard-page animate-fadeIn">
            <div className="dashboard-hero">
                <div>
                    <h1>{greeting === 'Good Morning' ? 'Magandang umaga' : greeting === 'Good Afternoon' ? 'Magandang araw' : 'Magandang gabi'}, {user?.firstName}!</h1>
                    <p>Narito ang overview ng mga serbisyo at aktibidad sa ating barangay.</p>
                </div>
                <div className="dashboard-date-card">
                    <CalendarDays size={22} />
                    <div>
                        <strong>{today}</strong>
                        <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-kpi-grid">
                {kpis.map(item => (
                    <div key={item.label} className="kpi-card">
                        <div className={`kpi-icon ${item.tone}`}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <span className="kpi-label">{item.label}</span>
                            <strong className="kpi-value">{item.value}</strong>
                            <span className="kpi-note">▲ {item.note}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-main-grid">
                <section className="dashboard-panel quick-panel">
                    <h2>Mga Mabilis na Serbisyo</h2>
                    <div className="quick-service-grid">
                        {quickServices.map(item => (
                            <Link key={item.title} to={item.to} className={`quick-service ${item.tone}`}>
                                <item.icon size={28} />
                                <div>
                                    <strong>{item.title}</strong>
                                    <span>{item.text}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="reminder-card">
                        <ShieldCheck size={20} />
                        <div>
                            <strong>Paalala</strong>
                            <p>Para sa agarang tulong, bumisita sa Barangay Hall o tumawag sa aming opisina. Lunes - Biyernes, 8:00 AM - 5:00 PM.</p>
                        </div>
                    </div>
                </section>

                <section className="dashboard-panel activity-panel">
                    <div className="panel-title-row">
                        <h2>Kamakailang Aktibidad</h2>
                        <div className="activity-tools">
                            <select aria-label="Filter type">
                                <option>Lahat ng Uri</option>
                            </select>
                            <select aria-label="Filter status">
                                <option>Lahat ng Status</option>
                            </select>
                            <label>
                                <Search size={15} />
                                <input placeholder="Maghanap..." />
                            </label>
                        </div>
                    </div>
                    <div className="activity-table">
                        <div className="activity-table-head">
                            <span>ID / Uri</span>
                            <span>Uri / Paksa</span>
                            <span>Nagpadala</span>
                            <span>Petsa</span>
                            <span>Status</span>
                        </div>
                        {recentComplaints.length > 0 ? recentComplaints.map((complaint, index) => {
                            const statusClass = complaint.status?.toLowerCase().replace('_', '-')
                            return (
                                <Link key={complaint.id} to={`/complaints/${complaint.id}`} className="activity-table-row">
                                    <span>CMP-2026-{128 - index}</span>
                                    <strong>{complaint.title}</strong>
                                    <span>{complaint.user?.firstName || user?.firstName || 'Resident'}</span>
                                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                    <span className={`badge badge-${statusClass}`}>{complaint.status?.replace('_', ' ')}</span>
                                </Link>
                            )
                        }) : (
                            <div className="activity-table-empty">Wala pang bagong aktibidad.</div>
                        )}
                        <Link to="/complaints" className="table-view-all">
                            Tingnan ang lahat ng aktibidad <ArrowRight size={15} />
                        </Link>
                    </div>
                </section>
            </div>

            <div className="dashboard-lower-grid">
                <section className="dashboard-panel mini-analytics">
                    <h2>Complaints by Category</h2>
                    <div className="donut-wrap">
                        <div className="donut-chart" />
                        <div className="legend-list">
                            <span><i className="green" /> Infrastructure <strong>{stats?.complaints?.pending || 0}</strong></span>
                            <span><i className="blue" /> Public Safety <strong>{stats?.complaints?.in_progress || 0}</strong></span>
                            <span><i className="gold" /> Services <strong>{stats?.complaints?.resolved || 0}</strong></span>
                        </div>
                    </div>
                </section>
                <section className="dashboard-panel mini-analytics">
                    <h2>Complaints Trend</h2>
                    <div className="trend-card">
                        <TrendingUp size={22} />
                        <div className="trend-line" />
                    </div>
                </section>
                <section className="dashboard-panel mini-analytics">
                    <h2>Service Status Overview</h2>
                    <div className="status-bars">
                        <span>Completed <i style={{ '--w': `${stats?.complaints?.resolutionRate || 40}%` }} /></span>
                        <span>Processing <i className="blue" style={{ '--w': '45%' }} /></span>
                        <span>Pending <i className="gold" style={{ '--w': '20%' }} /></span>
                    </div>
                </section>
                <section className="dashboard-panel mini-analytics announcements-mini">
                    <h2>Announcements</h2>
                    <div>
                        <Megaphone size={34} />
                        <strong>{stats?.announcements?.published || 0}</strong>
                        <span>Bagong Anunsyo</span>
                    </div>
                </section>
            </div>
        </div>
    )
}
