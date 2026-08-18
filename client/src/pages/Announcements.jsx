import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { isOfficial } from '../lib/roles'
import { 
    Megaphone, Calendar, Pin, Search, Sparkles, Plus, 
    Tag, User, Clock, AlertTriangle, ShieldCheck, X, ChevronRight
} from 'lucide-react'
import { useState, useMemo } from 'react'
import './Announcements.css'

export default function Announcements() {
    const { user } = useAuthStore()
    const userIsOfficial = isOfficial(user?.role)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFilter, setSelectedFilter] = useState('ALL') // 'ALL' | 'PINNED' | 'CATEGORY_...'

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const { data } = await api.get('/announcements')
            return data.announcements || []
        }
    })

    const categories = useMemo(() => {
        const unique = new Set()
        announcements.forEach(a => {
            if (a.category) unique.add(a.category)
        })
        return Array.from(unique)
    }, [announcements])

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(a => {
            if (selectedFilter === 'PINNED' && !a.isPinned) return false
            if (selectedFilter !== 'ALL' && selectedFilter !== 'PINNED' && a.category !== selectedFilter) return false

            if (!searchQuery.trim()) return true
            const q = searchQuery.toLowerCase()
            return (
                a.title.toLowerCase().includes(q) ||
                (a.content && a.content.toLowerCase().includes(q)) ||
                (a.category && a.category.toLowerCase().includes(q))
            )
        })
    }, [announcements, selectedFilter, searchQuery])

    const pinnedCount = announcements.filter(a => a.isPinned).length

    return (
        <div className="page animate-fadeIn">
            {/* Hero Header */}
            <div className="announcements-hero-banner">
                <div className="announcements-hero-content">
                    <div className="announcements-hero-badge">
                        <Sparkles size={14} /> Official Public Advisories & Citizen Updates
                    </div>
                    <h1>Barangay Announcements</h1>
                    <p>
                        Stay informed with official notices, public health advisories, community assembly schedules, and disaster preparedness updates from Barangay Burgos.
                    </p>
                </div>

                <div className="announcements-hero-actions">
                    {userIsOfficial && (
                        <Link to="/announcements/new" className="post-announcement-btn">
                            <Plus size={18} />
                            <span>Post Announcement</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="announcements-filter-bar">
                <div className="announcements-search-wrap">
                    <Search size={18} className="search-icon-fixed" />
                    <input
                        type="text"
                        className="announcements-search-field"
                        placeholder="Search advisories, events, or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                            <X size={15} />
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                <div className="announcements-pills-row">
                    <button
                        type="button"
                        className={`announcement-pill ${selectedFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setSelectedFilter('ALL')}
                    >
                        All Advisories ({announcements.length})
                    </button>

                    {pinnedCount > 0 && (
                        <button
                            type="button"
                            className={`announcement-pill pill-pinned ${selectedFilter === 'PINNED' ? 'active' : ''}`}
                            onClick={() => setSelectedFilter('PINNED')}
                        >
                            <Pin size={13} /> Pinned ({pinnedCount})
                        </button>
                    )}

                    {categories.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            className={`announcement-pill ${selectedFilter === cat ? 'active' : ''}`}
                            onClick={() => setSelectedFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Announcements List */}
            {isLoading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : filteredAnnouncements.length > 0 ? (
                <div className="announcements-cards-list">
                    {filteredAnnouncements.map(announcement => {
                        const isPinned = announcement.isPinned
                        const dateFormatted = new Date(announcement.publishDate || announcement.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })

                        return (
                            <div
                                key={announcement.id}
                                className={`announcement-card-premium ${isPinned ? 'pinned-card' : ''}`}
                            >
                                <div className="announcement-card-layout">
                                    {/* Left Icon Halo */}
                                    <div className={`announcement-icon-halo ${isPinned ? 'halo-pinned' : 'halo-standard'}`}>
                                        {isPinned ? <Pin size={24} /> : <Megaphone size={24} />}
                                    </div>

                                    {/* Main Body */}
                                    <div className="announcement-content-wrap">
                                        <div className="announcement-title-row">
                                            <div className="title-and-badges">
                                                <h3>{announcement.title}</h3>
                                                <div className="badges-flex">
                                                    {isPinned && (
                                                        <span className="badge-pinned-pill">
                                                            <Pin size={11} /> Important
                                                        </span>
                                                    )}
                                                    {announcement.category && (
                                                        <span className="badge-category-pill">
                                                            <Tag size={11} /> {announcement.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="announcement-content-body">
                                            {announcement.content}
                                        </p>

                                        <div className="announcement-meta-row">
                                            <div className="meta-author-box">
                                                <div className="author-avatar-chip">
                                                    <User size={13} />
                                                </div>
                                                <span>
                                                    Issued by <strong>{announcement.createdBy ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}` : 'Barangay Administration'}</strong>
                                                </span>
                                            </div>

                                            <span className="meta-sep">•</span>

                                            <div className="meta-date-box">
                                                <Calendar size={13} />
                                                <span>{dateFormatted}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="announcements-empty-box animate-fadeIn">
                    <Megaphone size={52} className="empty-megaphone" />
                    <h3>No Announcements Found</h3>
                    <p>
                        {searchQuery || selectedFilter !== 'ALL'
                            ? 'No public advisories match your current filter criteria.'
                            : 'There are no official advisories posted at this time.'}
                    </p>
                    {(searchQuery || selectedFilter !== 'ALL') && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => { setSearchQuery(''); setSelectedFilter('ALL'); }}
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
