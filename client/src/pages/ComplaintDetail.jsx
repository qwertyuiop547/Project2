import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { isOfficial } from '../lib/roles'
import {
    ArrowLeft,
    Clock,
    MapPin,
    Tag,
    User,
    MessageSquare,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import './ComplaintDetail.css'

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
]

const STATUS_STEPS = [
    { key: 'PENDING', label: 'Submitted', description: 'Complaint received', icon: FileText },
    { key: 'IN_PROGRESS', label: 'In Progress', description: 'Under review', icon: AlertCircle },
    { key: 'RESOLVED', label: 'Resolved', description: 'Issue addressed', icon: CheckCircle },
    { key: 'CLOSED', label: 'Closed', description: 'Case closed', icon: CheckCircle },
]

const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

function getStatusIndex(status) {
    const index = STATUS_ORDER.indexOf(status)
    return index === -1 ? 0 : index
}

function formatStatus(status) {
    return status?.replace('_', ' ') ?? ''
}

export default function ComplaintDetail() {
    const { id } = useParams()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const userIsOfficial = isOfficial(user?.role)

    const { data, isLoading, isError } = useQuery({
        queryKey: ['complaint', id, user?.id],
        queryFn: async () => {
            const { data } = await api.get(`/complaints/${id}`)
            return data.complaint
        }
    })

    const [newStatus, setNewStatus] = useState('')
    const [resolutionNotes, setResolutionNotes] = useState('')

    const statusMutation = useMutation({
        mutationFn: async ({ status, resolutionNotes: notes }) => {
            const { data } = await api.patch(`/complaints/${id}/status`, {
                status,
                resolutionNotes: notes || undefined
            })
            return data.complaint
        },
        onSuccess: () => {
            toast.success('Status updated successfully')
            queryClient.invalidateQueries({ queryKey: ['complaint', id] })
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-recent'] })
            setResolutionNotes('')
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to update status')
        }
    })

    if (isLoading) {
        return <div className="loading-container"><div className="spinner"></div></div>
    }

    if (isError || !data) {
        return (
            <div className="page animate-fadeIn">
                <Link to="/complaints" className="btn btn-secondary mb-3">
                    <ArrowLeft size={18} /> Back to Complaints
                </Link>
                <div className="card">
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h4>Complaint not found</h4>
                        <p>You may not have permission to view this complaint.</p>
                    </div>
                </div>
            </div>
        )
    }

    const complaint = data
    const isComplainant = complaint.userId === user?.id
    const statusClass = complaint.status?.toLowerCase().replace('_', '-')
    const selectedStatus = newStatus || complaint.status || 'PENDING'
    const currentStepIndex = getStatusIndex(complaint.status)
    const progressPercent = (currentStepIndex / (STATUS_ORDER.length - 1)) * 80

    const handleStatusUpdate = (e) => {
        e.preventDefault()
        if (!selectedStatus || selectedStatus === complaint.status) {
            toast.error('Please select a different status')
            return
        }
        statusMutation.mutate({
            status: selectedStatus,
            resolutionNotes: selectedStatus === 'RESOLVED' ? resolutionNotes : undefined
        })
    }

    return (
        <div className="page animate-fadeIn">
            <Link to="/complaints" className="btn btn-secondary mb-3">
                <ArrowLeft size={18} /> Back to Complaints
            </Link>

            {/* Status Tracker — complainant only */}
            {isComplainant && (
            <div className="card mb-3 complaint-status-card">
                <div className="complaint-status-header">
                    <h3>Status ng Reklamo</h3>
                    <span className={`complaint-status-badge badge-${statusClass}`}>
                        {complaint.status === 'PENDING' && <Clock size={16} />}
                        {complaint.status === 'IN_PROGRESS' && <AlertCircle size={16} />}
                        {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && <CheckCircle size={16} />}
                        {formatStatus(complaint.status)}
                    </span>
                </div>

                <div className="status-tracker">
                    <div
                        className="status-tracker-progress"
                        style={{ width: `${progressPercent}%` }}
                    />
                    {STATUS_STEPS.map((step, index) => {
                        const StepIcon = step.icon
                        const isCompleted = index < currentStepIndex
                        const isActive = index === currentStepIndex
                        return (
                            <div
                                key={step.key}
                                className={`status-step${isCompleted ? ' completed' : ''}${isActive ? ' active' : ''}`}
                            >
                                <div className="status-step-dot">
                                    {isCompleted ? <CheckCircle size={18} /> : <StepIcon size={16} />}
                                </div>
                                <span className="status-step-label">{step.label}</span>
                                {isActive && (
                                    <span className="status-step-desc">{step.description}</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {complaint.resolutionNotes && (
                    <div className="resolution-notes-box">
                        <h4>Resolution Notes</h4>
                        <p>{complaint.resolutionNotes}</p>
                    </div>
                )}

                {complaint.statusHistory?.length > 0 && (
                    <div className="status-history-list">
                        <h4>Status History</h4>
                        {complaint.statusHistory.map((entry) => (
                            <div key={entry.id} className="status-history-item">
                                <span className="history-date">
                                    {new Date(entry.createdAt).toLocaleString()}
                                </span>
                                <span>
                                    {formatStatus(entry.oldStatus)} → {formatStatus(entry.newStatus)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}

            <div className="card mb-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <h1 style={{ fontSize: '1.8rem' }}>{complaint.title}</h1>
                    {userIsOfficial && (
                        <span className={`complaint-status-badge badge-${statusClass}`}>
                            {complaint.status === 'PENDING' && <Clock size={16} />}
                            {complaint.status === 'IN_PROGRESS' && <AlertCircle size={16} />}
                            {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && <CheckCircle size={16} />}
                            {formatStatus(complaint.status)}
                        </span>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap mb-3" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex gap-1"><Tag size={16} /> {complaint.category?.name}</span>
                    <span className="flex gap-1"><Clock size={16} /> {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    {complaint.location && <span className="flex gap-1"><MapPin size={16} /> {complaint.location}</span>}
                    {complaint.user && userIsOfficial && (
                        <span className="flex gap-1">
                            <User size={16} /> {complaint.user.firstName} {complaint.user.lastName}
                        </span>
                    )}
                </div>

                <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    {complaint.description}
                </p>
            </div>

            {userIsOfficial && (
                <div className="card mb-3">
                    <h3 className="flex gap-2 mb-2">
                        <RefreshCw size={20} /> Update Status
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.95rem' }}>
                        Change the complaint status as you review and resolve the issue.
                    </p>
                    <form onSubmit={handleStatusUpdate}>
                        <div className="form-group">
                            <label className="form-label">New Status</label>
                            <select
                                className="select"
                                value={selectedStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedStatus === 'RESOLVED' && (
                            <div className="form-group">
                                <label className="form-label">Resolution Notes (optional)</label>
                                <textarea
                                    className="textarea"
                                    placeholder="Describe how the issue was resolved..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={statusMutation.isPending || selectedStatus === complaint.status}
                        >
                            {statusMutation.isPending ? 'Updating...' : 'Update Status'}
                        </button>
                    </form>
                </div>
            )}

            <div className="card">
                <h3 className="flex gap-2 mb-2">
                    <MessageSquare size={20} /> Comments ({complaint.comments?.length || 0})
                </h3>

                {complaint.comments?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {complaint.comments.map(comment => (
                            <div key={comment.id} style={{
                                padding: 16,
                                background: 'rgba(21, 128, 61, 0.04)',
                                borderRadius: 12,
                                borderLeft: '3px solid #15803d'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <strong>{comment.user?.firstName} {comment.user?.lastName}</strong>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
                        No comments yet
                    </p>
                )}
            </div>
        </div>
    )
}
