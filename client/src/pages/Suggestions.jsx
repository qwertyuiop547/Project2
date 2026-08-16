import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { Plus, ThumbsUp, Lightbulb, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './Suggestions.css'

export default function Suggestions() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['suggestions'],
        queryFn: async () => {
            const { data } = await api.get('/suggestions')
            return data
        }
    })

    const { data: votedData } = useQuery({
        queryKey: ['my-votes'],
        queryFn: async () => {
            const { data } = await api.get('/suggestions/my/votes')
            return data.votedIds
        },
        enabled: !!user
    })

    const voteMutation = useMutation({
        mutationFn: async (id) => {
            const { data } = await api.post(`/suggestions/${id}/vote`)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['suggestions'])
            queryClient.invalidateQueries(['my-votes'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to vote')
        }
    })

    const isResident = user?.role === 'RESIDENT'

    return (
        <div className="page animate-fadeIn">
            {/* Header */}
            <div className="suggestions-page-header">
                <div>
                    <h1>Community Suggestions</h1>
                    <p>{isResident ? 'Vote for ideas you support' : 'Review community suggestions'}</p>
                </div>
                {isResident && (
                    <Link to="/suggestions/new" className="btn btn-primary">
                        <Plus size={20} />
                        Submit Idea
                    </Link>
                )}
            </div>

            {/* Stats */}
            <div className="stats-grid mb-3">
                <div className="card stat-card" style={{ '--stat-color': 'var(--gradient-purple)' }}>
                    <div className="stat-icon"><Lightbulb size={24} /></div>
                    <div className="stat-value">{data?.stats?.total || 0}</div>
                    <div className="stat-label">Total Ideas</div>
                </div>
                <div className="card stat-card" style={{ '--stat-color': 'var(--gradient-yellow)' }}>
                    <div className="stat-icon"><Clock size={24} /></div>
                    <div className="stat-value">{data?.stats?.pending || 0}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="card stat-card" style={{ '--stat-color': 'var(--gradient-primary)' }}>
                    <div className="stat-icon"><CheckCircle size={24} /></div>
                    <div className="stat-value">{data?.stats?.approved || 0}</div>
                    <div className="stat-label">Approved</div>
                </div>
            </div>

            {/* Suggestions List */}
            {isLoading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : data?.suggestions?.length > 0 ? (
                <div className="suggestions-list">
                    {data.suggestions.map(suggestion => {
                        const statusLower = suggestion.status?.toLowerCase() || 'pending';
                        const borderClass = `border-${statusLower}`;
                        const isVoted = votedData?.includes(suggestion.id);
                        return (
                            <div key={suggestion.id} className={`suggestion-item-card ${borderClass}`}>
                                <div className="suggestion-main-content">
                                    <h3>
                                        <Lightbulb size={22} style={{ color: 'var(--warning)' }} />
                                        {suggestion.title}
                                    </h3>
                                    <p className="suggestion-description">
                                        {suggestion.description}
                                    </p>
                                    <div className="suggestion-meta">
                                        <span>{suggestion.user?.firstName || 'Anonymous'} {suggestion.user?.lastName || ''}</span>
                                        <span className="suggestion-meta-divider">•</span>
                                        <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                                        <span className="suggestion-meta-divider">•</span>
                                        <span className={`badge badge-${statusLower}`}>
                                            {suggestion.status}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => voteMutation.mutate(suggestion.id)}
                                    disabled={voteMutation.isPending || user?.role !== 'RESIDENT'}
                                    className={`vote-button ${isVoted ? 'voted' : 'not-voted'}`}
                                >
                                    <ThumbsUp size={22} />
                                    <span className="vote-count">{suggestion.voteCount}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <Lightbulb size={48} />
                        <h4>No suggestions yet</h4>
                        <p>Be the first to share an idea!</p>
                    </div>
                </div>
            )}
        </div>
    )
}
