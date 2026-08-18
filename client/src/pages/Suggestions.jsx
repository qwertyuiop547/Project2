import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { 
    Plus, ThumbsUp, Lightbulb, Clock, CheckCircle2, Search, 
    Sparkles, User, Calendar, Tag, ArrowRight, X, AlertCircle
} from 'lucide-react'
import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import './Suggestions.css'

export default function Suggestions() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [sortBy, setSortBy] = useState('newest') // 'newest' | 'votes'

    const { data, isLoading } = useQuery({
        queryKey: ['suggestions'],
        queryFn: async () => {
            const { data } = await api.get('/suggestions')
            return data
        }
    })

    const { data: votedData = [] } = useQuery({
        queryKey: ['my-votes'],
        queryFn: async () => {
            const { data } = await api.get('/suggestions/my/votes')
            return data.votedIds || []
        },
        enabled: !!user
    })

    const voteMutation = useMutation({
        mutationFn: async (id) => {
            const { data } = await api.post(`/suggestions/${id}/vote`)
            return data
        },
        onSuccess: (data) => {
            toast.success(data?.message || 'Vote updated!')
            queryClient.invalidateQueries(['suggestions'])
            queryClient.invalidateQueries(['my-votes'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to submit vote')
        }
    })

    const isResident = user?.role === 'RESIDENT'
    const suggestions = data?.suggestions || []

    const filteredSuggestions = useMemo(() => {
        return suggestions
            .filter(s => {
                if (statusFilter !== 'ALL' && s.status !== statusFilter) {
                    return false
                }
                if (!searchQuery.trim()) return true
                const query = searchQuery.toLowerCase()
                return (
                    s.title.toLowerCase().includes(query) ||
                    (s.description && s.description.toLowerCase().includes(query)) ||
                    (s.user?.firstName && s.user.firstName.toLowerCase().includes(query))
                )
            })
            .sort((a, b) => {
                if (sortBy === 'votes') {
                    return (b.voteCount || 0) - (a.voteCount || 0)
                }
                return new Date(b.createdAt) - new Date(a.createdAt)
            })
    }, [suggestions, statusFilter, searchQuery, sortBy])

    const totalIdeas = data?.stats?.total || suggestions.length
    const pendingIdeas = data?.stats?.pending || suggestions.filter(s => s.status === 'PENDING').length
    const approvedIdeas = data?.stats?.approved || suggestions.filter(s => s.status === 'APPROVED').length

    return (
        <div className="page animate-fadeIn">
            {/* Hero Header */}
            <div className="suggestions-hero-banner">
                <div className="suggestions-hero-content">
                    <div className="suggestions-hero-badge">
                        <Sparkles size={14} /> Citizen Engagement & Community Proposals
                    </div>
                    <h1>Community Suggestions</h1>
                    <p>
                        {isResident
                            ? 'Propose innovative community ideas, vote on citizen initiatives, and collaborate on local development in Barangay Burgos.'
                            : 'Review resident proposals, evaluate citizen upvotes, and approve projects for barangay implementation.'}
                    </p>
                </div>

                <div className="suggestions-hero-actions">
                    {isResident && (
                        <Link to="/suggestions/new" className="propose-idea-btn">
                            <Plus size={18} />
                            <span>Propose an Idea</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Interactive Stats Cards */}
            <div className="suggestions-stats-grid">
                <div 
                    className={`suggestion-stat-box stat-total ${statusFilter === 'ALL' ? 'active-stat' : ''}`}
                    onClick={() => setStatusFilter('ALL')}
                >
                    <div className="stat-box-top">
                        <span className="stat-box-title">Total Proposals</span>
                        <div className="stat-icon-halo halo-gold">
                            <Lightbulb size={18} />
                        </div>
                    </div>
                    <strong className="stat-box-number">{totalIdeas}</strong>
                    <span className="stat-box-footer">Citizen proposals</span>
                </div>

                <div 
                    className={`suggestion-stat-box stat-pending ${statusFilter === 'PENDING' ? 'active-stat' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                >
                    <div className="stat-box-top">
                        <span className="stat-box-title">Under Review</span>
                        <div className="stat-icon-halo halo-amber">
                            <Clock size={18} />
                        </div>
                    </div>
                    <strong className="stat-box-number">{pendingIdeas}</strong>
                    <span className="stat-box-footer">Awaiting evaluation</span>
                </div>

                <div 
                    className={`suggestion-stat-box stat-approved ${statusFilter === 'APPROVED' ? 'active-stat' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
                >
                    <div className="stat-box-top">
                        <span className="stat-box-title">Approved Projects</span>
                        <div className="stat-icon-halo halo-green">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <strong className="stat-box-number">{approvedIdeas}</strong>
                    <span className="stat-box-footer">Endorsed for execution</span>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="suggestions-filter-bar">
                <div className="suggestions-search-wrap">
                    <Search size={18} className="search-icon-fixed" />
                    <input
                        type="text"
                        className="suggestions-search-field"
                        placeholder="Search proposals by title, description, or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                            <X size={15} />
                        </button>
                    )}
                </div>

                {/* Filter Pills & Sort */}
                <div className="suggestions-controls-row">
                    <div className="status-pills-group">
                        <button
                            type="button"
                            className={`suggestion-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('ALL')}
                        >
                            All ({totalIdeas})
                        </button>
                        <button
                            type="button"
                            className={`suggestion-pill pill-amber ${statusFilter === 'PENDING' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('PENDING')}
                        >
                            <Clock size={12} /> Under Review ({pendingIdeas})
                        </button>
                        <button
                            type="button"
                            className={`suggestion-pill pill-green ${statusFilter === 'APPROVED' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('APPROVED')}
                        >
                            <CheckCircle2 size={12} /> Approved ({approvedIdeas})
                        </button>
                    </div>

                    <div className="sort-toggle-wrap">
                        <span className="sort-label">Sort:</span>
                        <select 
                            className="sort-select" 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="votes">Most Upvoted</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Suggestions Cards List */}
            {isLoading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : filteredSuggestions.length > 0 ? (
                <div className="suggestions-cards-list">
                    {filteredSuggestions.map(suggestion => {
                        const statusLower = (suggestion.status || 'PENDING').toLowerCase()
                        const isVoted = votedData.includes(suggestion.id)
                        const authorName = suggestion.user ? `${suggestion.user.firstName || ''} ${suggestion.user.lastName || ''}`.trim() : 'Barangay Resident'

                        return (
                            <div key={suggestion.id} className={`suggestion-card-premium status-border-${statusLower}`}>
                                {/* Upvote Action Button Block */}
                                <div className="suggestion-vote-block">
                                    <button
                                        type="button"
                                        onClick={() => voteMutation.mutate(suggestion.id)}
                                        disabled={voteMutation.isPending || !isResident}
                                        className={`vote-btn-pill ${isVoted ? 'voted-pill' : 'unvoted-pill'}`}
                                        title={isVoted ? 'Click to remove upvote' : 'Upvote this proposal'}
                                    >
                                        <ThumbsUp size={20} />
                                        <span className="vote-count-number">{suggestion.voteCount || 0}</span>
                                        <span className="vote-label-text">{isVoted ? 'Upvoted' : 'Upvote'}</span>
                                    </button>
                                </div>

                                {/* Main Content */}
                                <div className="suggestion-body-block">
                                    <div className="suggestion-header-row">
                                        <h3 className="suggestion-card-title">
                                            {suggestion.title}
                                        </h3>
                                        <span className={`suggestion-status-badge badge-${statusLower}`}>
                                            {statusLower === 'approved' && <CheckCircle2 size={12} />}
                                            {statusLower === 'pending' && <Clock size={12} />}
                                            {suggestion.status}
                                        </span>
                                    </div>

                                    <p className="suggestion-card-desc">
                                        {suggestion.description}
                                    </p>

                                    <div className="suggestion-footer-meta">
                                        <div className="meta-author">
                                            <div className="author-avatar-mini">
                                                <User size={13} />
                                            </div>
                                            <span>{authorName}</span>
                                        </div>

                                        <span className="meta-dot">•</span>

                                        <div className="meta-date">
                                            <Calendar size={13} />
                                            <span>{new Date(suggestion.createdAt).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="suggestions-empty-box animate-fadeIn">
                    <Lightbulb size={52} className="empty-lightbulb" />
                    <h3>No Suggestions Found</h3>
                    <p>
                        {searchQuery || statusFilter !== 'ALL'
                            ? 'No community ideas match your current search or filter criteria.'
                            : 'Be the first to share an impactful proposal for Barangay Burgos!'}
                    </p>
                    {(searchQuery || statusFilter !== 'ALL') && (
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                        >
                            Reset Filters
                        </button>
                    )}
                    {isResident && !searchQuery && statusFilter === 'ALL' && (
                        <Link to="/suggestions/new" className="propose-idea-btn" style={{ marginTop: 8 }}>
                            <Plus size={18} /> Submit a Community Idea
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
