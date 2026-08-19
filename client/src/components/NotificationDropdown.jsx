import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    Bell, CheckCheck, FileText, Megaphone, Lightbulb, 
    AlertCircle, FileCheck, Bot, Clock, ExternalLink, X, Info
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import './NotificationDropdown.css'

function formatTimeAgo(dateString) {
    if (!dateString) return ''
    const now = new Date()
    const past = new Date(dateString)
    const diffInSec = Math.floor((now - past) / 1000)

    if (diffInSec < 60) return 'Ngayon lang'
    const diffInMin = Math.floor(diffInSec / 60)
    if (diffInMin < 60) return `${diffInMin}m ang nakalipas`
    const diffInHours = Math.floor(diffInMin / 60)
    if (diffInHours < 24) return `${diffInHours}h ang nakalipas`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ang nakalipas`
    return past.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function getNotificationIcon(type) {
    switch (type) {
        case 'COMPLAINT':
            return { icon: AlertCircle, color: '#dc2626', bg: '#fee2e2' }
        case 'SERVICES':
            return { icon: FileCheck, color: '#2563eb', bg: '#dbeafe' }
        case 'ANNOUNCEMENT':
            return { icon: Megaphone, color: '#9333ea', bg: '#f3e8ff' }
        case 'SUGGESTION':
            return { icon: Lightbulb, color: '#d97706', bg: '#fef3c7' }
        case 'AI_ASSIST':
            return { icon: Bot, color: '#059669', bg: '#ecfdf5' }
        default:
            return { icon: Info, color: '#0284c7', bg: '#e0f2fe' }
    }
}

export default function NotificationDropdown() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Fetch user notifications
    const { data, isLoading } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            const res = await api.get('/notifications')
            return res.data
        },
        enabled: !!user,
        refetchInterval: 30000, // Auto-refresh every 30s
    })

    const notifications = data?.notifications || []
    const unreadCount = data?.unreadCount || 0

    // Mark single notification as read
    const markAsReadMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.patch(`/notifications/${id}/read`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
        }
    })

    // Mark all as read
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/notifications/read-all')
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
        }
    })

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleItemClick = (notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id)
        }
        setIsOpen(false)
        if (notification.link) {
            navigate(notification.link)
        }
    }

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button
                className={`topbar-icon-btn notification-bell-btn ${isOpen ? 'active' : ''}`}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                aria-expanded={isOpen}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="topbar-badge" title={`${unreadCount} unread notifications`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown-panel animate-fadeIn">
                    {/* Header */}
                    <div className="notif-header">
                        <div className="notif-header-title">
                            <Bell size={16} />
                            <h3>Mga Abiso</h3>
                            {unreadCount > 0 && (
                                <span className="notif-unread-pill">{unreadCount} bago</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="notif-mark-all-btn"
                                onClick={() => markAllAsReadMutation.mutate()}
                                disabled={markAllAsReadMutation.isPending}
                            >
                                <CheckCheck size={14} />
                                <span>Basahin Lahat</span>
                            </button>
                        )}
                    </div>

                    {/* Notification Items List */}
                    <div className="notif-list">
                        {isLoading ? (
                            <div className="notif-loading">
                                <span className="notif-spinner" />
                                <p>Kinakarga ang mga abiso...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notif-empty">
                                <div className="notif-empty-icon">
                                    <Bell size={28} />
                                </div>
                                <h4>Walang Bagong Abiso</h4>
                                <p>Lahat ng announcements at updates ay makikita rito.</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const iconData = getNotificationIcon(n.type)
                                const IconComponent = iconData.icon

                                return (
                                    <div
                                        key={n.id}
                                        className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                                        onClick={() => handleItemClick(n)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div
                                            className="notif-icon-box"
                                            style={{ background: iconData.bg, color: iconData.color }}
                                        >
                                            <IconComponent size={16} />
                                        </div>
                                        <div className="notif-content">
                                            <div className="notif-title-row">
                                                <span className="notif-title">{n.title}</span>
                                                <span className="notif-time">
                                                    <Clock size={11} />
                                                    {formatTimeAgo(n.createdAt)}
                                                </span>
                                            </div>
                                            <p className="notif-message">{n.message}</p>
                                        </div>
                                        {!n.isRead && <span className="notif-unread-dot" title="Unread" />}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="notif-footer">
                        <span>Official Barangay Burgos System Notifications</span>
                    </div>
                </div>
            )}
        </div>
    )
}
