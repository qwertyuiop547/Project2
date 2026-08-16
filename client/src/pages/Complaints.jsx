import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import { isResident } from '../lib/roles'
import api from '../lib/api'
import { Plus, Search, Filter, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import './Complaints.css'

export default function Complaints() {
    const { user } = useAuthStore()
    const userIsResident = isResident(user?.role)
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')

    const { data, isLoading } = useQuery({
        queryKey: ['complaints', user?.id, searchParams.toString()],
        queryFn: async () => {
            const { data } = await api.get(`/complaints?${searchParams.toString()}`)
            return data
        }
    })

    const handleSearch = (e) => {
        e.preventDefault()
        searchParams.set('search', search)
        setSearchParams(searchParams)
    }

    const handleStatusFilter = (status) => {
        if (status) {
            searchParams.set('status', status)
        } else {
            searchParams.delete('status')
        }
        setSearchParams(searchParams)
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={16} />
            case 'IN_PROGRESS': return <AlertCircle size={16} />
            case 'RESOLVED': return <CheckCircle size={16} />
            default: return <FileText size={16} />
        }
    }

    return (
        <div className="page animate-fadeIn">
            {/* Header */}
            <div className="complaints-page-header">
                <div>
                    <h1>Complaints</h1>
                    <p>{userIsResident ? 'Track the status of your complaints' : 'Review and manage community complaints'}</p>
                </div>
                {userIsResident && (
                    <Link to="/complaints/new" className="btn btn-primary">
                        <Plus size={20} />
                        File Complaint
                    </Link>
                )}
            </div>

            {/* Stats */}
            <div className="stats-grid complaints-stats mb-3">
                <div className="card stat-card" style={{ '--stat-color': 'var(--gradient-yellow)' }}>
                    <div className="stat-icon"><Clock size={24} /></div>
                    <div className="stat-value">{data?.stats?.pending || 0}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="card stat-card" style={{ '--stat-color': 'var(--gradient-blue)' }}>
                    <div className="stat-icon"><AlertCircle size={24} /></div>
                    <div className="stat-value">{data?.stats?.in_progress || 0}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="card stat-card" style={{ '--stat-color': 'var(--gradient-primary)' }}>
                    <div className="stat-icon"><CheckCircle size={24} /></div>
                    <div className="stat-value">{data?.stats?.resolved || 0}</div>
                    <div className="stat-label">Resolved</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-card">
                <div className="filter-flex">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Search</label>
                            <div className="search-wrapper">
                                <Search className="search-icon-inside" size={18} />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search complaints..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button type="submit" className="search-btn">
                                    Search
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="filter-group">
                        <label className="form-label">Status</label>
                        <select
                            className="filter-select"
                            value={searchParams.get('status') || ''}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Complaints List */}
            {isLoading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : data?.complaints?.length > 0 ? (
                <div className="complaints-grid">
                    {data.complaints.map(complaint => {
                        const statusLower = complaint.status.toLowerCase();
                        const borderClass = `border-${statusLower.replace('_', '-')}`;
                        return (
                            <Link
                                key={complaint.id}
                                to={`/complaints/${complaint.id}`}
                                className={`complaint-item-card ${borderClass}`}
                            >
                                <div className="complaint-item-header">
                                    <h3>{complaint.title}</h3>
                                    <span className={`status-badge badge-${statusLower.replace('_', '-')}`}>
                                        {getStatusIcon(complaint.status)}
                                        {complaint.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="complaint-item-excerpt">
                                    {complaint.description?.substring(0, 150)}...
                                </p>
                                <div className="complaint-item-meta">
                                    <span className="meta-tag">{complaint.category?.name}</span>
                                    <span className="meta-divider">•</span>
                                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                    {complaint.commentsCount > 0 && (
                                        <>
                                            <span className="meta-divider">•</span>
                                            <span className="comment-count-tag">{complaint.commentsCount} comments</span>
                                        </>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <FileText size={48} />
                        <h4>{userIsResident ? 'No complaints yet' : 'No complaints found'}</h4>
                        <p>{userIsResident ? 'File a complaint to track its status here' : 'No complaints match your search criteria'}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
