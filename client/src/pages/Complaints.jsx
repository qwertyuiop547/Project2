import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { isResident } from '../lib/roles'
import api from '../lib/api'
import { 
    Plus, Search, Filter, FileText, Clock, CheckCircle2, AlertCircle, 
    Map, List, MapPin, Sparkles, ShieldAlert, AlertTriangle, ArrowRight,
    Calendar, Tag, MessageSquare, ChevronRight, X
} from 'lucide-react'
import { useState, useMemo } from 'react'
import ComplaintsMapViewer from '../components/ComplaintsMapViewer'
import './Complaints.css'

export default function Complaints() {
    const { user } = useAuthStore()
    const userIsResident = isResident(user?.role)
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [viewMode, setViewMode] = useState('list') // 'list' | 'map'
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'ALL')
    const [selectedPriority, setSelectedPriority] = useState(searchParams.get('priority') || 'ALL')

    const currentStatus = searchParams.get('status') || 'ALL'

    const { data, isLoading } = useQuery({
        queryKey: ['complaints', user?.id, searchParams.toString()],
        queryFn: async () => {
            const { data } = await api.get(`/complaints?${searchParams.toString()}`)
            return data
        }
    })

    const { data: categories = [] } = useQuery({
        queryKey: ['complaint-categories'],
        queryFn: async () => {
            const { data } = await api.get('/complaints/categories')
            return data.categories || []
        }
    })

    const handleSearch = (e) => {
        e.preventDefault()
        if (search.trim()) {
            searchParams.set('search', search.trim())
        } else {
            searchParams.delete('search')
        }
        setSearchParams(searchParams)
    }

    const handleStatusFilter = (status) => {
        if (status && status !== 'ALL') {
            searchParams.set('status', status)
        } else {
            searchParams.delete('status')
        }
        setSearchParams(searchParams)
    }

    const handleCategoryFilter = (catId) => {
        setSelectedCategory(catId)
        if (catId && catId !== 'ALL') {
            searchParams.set('category', catId)
        } else {
            searchParams.delete('category')
        }
        setSearchParams(searchParams)
    }

    const handlePriorityFilter = (priority) => {
        setSelectedPriority(priority)
        if (priority && priority !== 'ALL') {
            searchParams.set('priority', priority)
        } else {
            searchParams.delete('priority')
        }
        setSearchParams(searchParams)
    }

    const clearAllFilters = () => {
        setSearch('')
        setSelectedCategory('ALL')
        setSelectedPriority('ALL')
        setSearchParams({})
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} />
            case 'IN_PROGRESS': return <AlertCircle size={14} />
            case 'RESOLVED': return <CheckCircle2 size={14} />
            default: return <FileText size={14} />
        }
    }

    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case 'URGENT': return 'priority-badge-urgent'
            case 'HIGH': return 'priority-badge-high'
            case 'MEDIUM': return 'priority-badge-medium'
            default: return 'priority-badge-low'
        }
    }

    const complaintsList = data?.complaints || []
    const pendingCount = data?.stats?.pending || 0
    const inProgressCount = data?.stats?.in_progress || 0
    const resolvedCount = data?.stats?.resolved || 0
    const totalCount = pendingCount + inProgressCount + resolvedCount

    return (
        <div className="page animate-fadeIn">
            {/* Hero Command Center Header */}
            <div className="complaints-hero-banner">
                <div className="complaints-hero-left">
                    <div className="complaints-hero-badge">
                        <ShieldAlert size={15} /> Barangay Peace & Order Incident System
                    </div>
                    <h1>Complaints & Incident Management</h1>
                    <p>
                        {userIsResident
                            ? 'Report community concerns with AI narrative rewriting and track responder dispatch on the live satellite map.'
                            : 'Monitor resident complaints, review AI priority classifications, and dispatch Barangay Tanod and BPAT units in real time.'}
                    </p>
                </div>

                <div className="complaints-hero-actions">
                    {/* View Mode Switcher */}
                    <div className="complaints-view-switcher">
                        <button
                            type="button"
                            className={`switcher-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <List size={16} />
                            <span>List View</span>
                        </button>
                        <button
                            type="button"
                            className={`switcher-btn ${viewMode === 'map' ? 'active' : ''}`}
                            onClick={() => setViewMode('map')}
                            title="Incident Satellite Map"
                        >
                            <Map size={16} />
                            <span>🛰️ Incident Map</span>
                        </button>
                    </div>

                    {userIsResident && (
                        <Link to="/complaints/new" className="file-complaint-btn">
                            <Plus size={18} />
                            <span>File a Complaint</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Interactive Stats Cards */}
            <div className="complaints-stats-grid">
                <div 
                    className={`complaint-stat-box stat-pending ${currentStatus === 'PENDING' ? 'active-stat-filter' : ''}`}
                    onClick={() => handleStatusFilter(currentStatus === 'PENDING' ? 'ALL' : 'PENDING')}
                    title="Click to filter Pending"
                >
                    <div className="stat-box-top">
                        <span className="stat-box-title">Pending Review</span>
                        <div className="stat-icon-halo icon-pending">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="stat-box-number">{pendingCount}</div>
                    <span className="stat-box-footer">Awaiting Barangay Action</span>
                </div>

                <div 
                    className={`complaint-stat-box stat-in-progress ${currentStatus === 'IN_PROGRESS' ? 'active-stat-filter' : ''}`}
                    onClick={() => handleStatusFilter(currentStatus === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
                    title="Click to filter In Progress"
                >
                    <div className="stat-box-top">
                        <span className="stat-box-title">In Progress</span>
                        <div className="stat-icon-halo icon-in-progress">
                            <AlertCircle size={18} />
                        </div>
                    </div>
                    <div className="stat-box-number">{inProgressCount}</div>
                    <span className="stat-box-footer">Tanod / BPAT Dispatched</span>
                </div>

                <div 
                    className={`complaint-stat-box stat-resolved ${currentStatus === 'RESOLVED' ? 'active-stat-filter' : ''}`}
                    onClick={() => handleStatusFilter(currentStatus === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
                    title="Click to filter Resolved"
                >
                    <div className="stat-box-top">
                        <span className="stat-box-title">Resolved</span>
                        <div className="stat-icon-halo icon-resolved">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="stat-box-number">{resolvedCount}</div>
                    <span className="stat-box-footer">Action Completed</span>
                </div>
            </div>

            {/* Incident Map Viewer Mode */}
            {viewMode === 'map' && (
                <div className="incident-map-wrapper animate-fadeIn">
                    <ComplaintsMapViewer complaints={complaintsList} />
                </div>
            )}

            {/* List View Mode */}
            {viewMode === 'list' && (
                <>
                    {/* Advanced Filter Toolbar */}
                    <div className="complaints-filter-toolbar">
                        <form onSubmit={handleSearch} className="complaints-search-form">
                            <div className="search-input-wrap">
                                <Search size={18} className="search-icon-fixed" />
                                <input
                                    type="text"
                                    className="complaints-search-field"
                                    placeholder="Search by complaint title, location, landmark, or description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button 
                                        type="button" 
                                        className="clear-search-btn"
                                        onClick={() => { setSearch(''); searchParams.delete('search'); setSearchParams(searchParams); }}
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>
                            <button type="submit" className="search-submit-btn">
                                Search
                            </button>
                        </form>

                        {/* Status Filter Pills */}
                        <div className="complaints-status-pills">
                            <button
                                type="button"
                                className={`status-pill ${currentStatus === 'ALL' ? 'active' : ''}`}
                                onClick={() => handleStatusFilter('ALL')}
                            >
                                All Status ({totalCount})
                            </button>
                            <button
                                type="button"
                                className={`status-pill pill-pending ${currentStatus === 'PENDING' ? 'active' : ''}`}
                                onClick={() => handleStatusFilter('PENDING')}
                            >
                                <Clock size={13} /> Pending ({pendingCount})
                            </button>
                            <button
                                type="button"
                                className={`status-pill pill-in-progress ${currentStatus === 'IN_PROGRESS' ? 'active' : ''}`}
                                onClick={() => handleStatusFilter('IN_PROGRESS')}
                            >
                                <AlertCircle size={13} /> In Progress ({inProgressCount})
                            </button>
                            <button
                                type="button"
                                className={`status-pill pill-resolved ${currentStatus === 'RESOLVED' ? 'active' : ''}`}
                                onClick={() => handleStatusFilter('RESOLVED')}
                            >
                                <CheckCircle2 size={13} /> Resolved ({resolvedCount})
                            </button>
                        </div>
                    </div>

                    {/* Complaints Cards Grid */}
                    {isLoading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : complaintsList.length > 0 ? (
                        <div className="complaints-card-grid">
                            {complaintsList.map(complaint => {
                                const statusLower = (complaint.status || 'PENDING').toLowerCase().replace('_', '-')
                                const priority = complaint.priority || 'MEDIUM'
                                const cleanLocation = complaint.location ? complaint.location.split('[')[0].trim() : ''

                                return (
                                    <Link
                                        key={complaint.id}
                                        to={`/complaints/${complaint.id}`}
                                        className={`complaint-card-premium status-border-${statusLower}`}
                                    >
                                        {/* Card Top Row */}
                                        <div className="complaint-card-top">
                                            <div className="complaint-badges-group">
                                                <span className={`complaint-status-badge status-${statusLower}`}>
                                                    {getStatusIcon(complaint.status)}
                                                    {complaint.status.replace('_', ' ')}
                                                </span>
                                                <span className={`complaint-priority-badge ${getPriorityBadgeClass(priority)}`}>
                                                    {priority === 'URGENT' && <AlertTriangle size={12} />}
                                                    {priority} PRIORITY
                                                </span>
                                            </div>

                                            <span className="complaint-card-date">
                                                <Calendar size={13} />
                                                {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="complaint-card-title">{complaint.title}</h3>

                                        {/* Description Excerpt */}
                                        <p className="complaint-card-excerpt">
                                            {complaint.description}
                                        </p>

                                        {/* Pinned Location Tag */}
                                        {cleanLocation && (
                                            <div className="complaint-card-location">
                                                <MapPin size={14} className="location-pin-icon" />
                                                <span>{cleanLocation}</span>
                                            </div>
                                        )}

                                        {/* Card Footer */}
                                        <div className="complaint-card-footer">
                                            <div className="complaint-footer-meta">
                                                {complaint.category?.name && (
                                                    <span className="category-meta-tag">
                                                        <Tag size={12} /> {complaint.category.name}
                                                    </span>
                                                )}
                                                {complaint._count?.comments > 0 && (
                                                    <span className="comments-meta-tag">
                                                        <MessageSquare size={12} /> {complaint._count.comments} updates
                                                    </span>
                                                )}
                                            </div>

                                            <div className="view-details-arrow">
                                                <span>View Report</span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="complaints-empty-card animate-fadeIn">
                            <ShieldAlert size={52} className="empty-icon-shield" />
                            <h3>No Complaints Found</h3>
                            <p>
                                {search || currentStatus !== 'ALL'
                                    ? 'No incident reports match your current filter criteria.'
                                    : userIsResident
                                        ? 'You have not filed any complaints yet. Use the button above to file a complaint with AI assistance.'
                                        : 'No community complaints have been submitted yet.'}
                            </p>
                            {(search || currentStatus !== 'ALL') && (
                                <button type="button" className="btn btn-secondary" onClick={clearAllFilters}>
                                    Clear All Filters
                                </button>
                            )}
                            {userIsResident && !search && currentStatus === 'ALL' && (
                                <Link to="/complaints/new" className="file-complaint-btn" style={{ marginTop: 8 }}>
                                    <Plus size={18} /> File a Complaint Now
                                </Link>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
