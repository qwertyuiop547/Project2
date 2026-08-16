import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { Megaphone, Calendar, Pin } from 'lucide-react'
import './Announcements.css'

export default function Announcements() {
    const { data, isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const { data } = await api.get('/announcements')
            return data.announcements
        }
    })

    return (
        <div className="page animate-fadeIn">
            <div className="announcements-page-header">
                <div>
                    <h1>Announcements</h1>
                    <p>Stay updated with the latest news</p>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : data?.length > 0 ? (
                <div className="announcements-list">
                    {data.map(announcement => (
                        <div
                            key={announcement.id}
                            className={`announcement-item-card ${announcement.isPinned ? 'pinned' : ''}`}
                        >
                            <div className="announcement-flex">
                                <div className={`announcement-icon-container ${announcement.isPinned ? 'pinned-icon' : 'standard-icon'}`}>
                                    {announcement.isPinned ? <Pin size={26} /> : <Megaphone size={26} />}
                                </div>

                                <div className="announcement-content-area">
                                    <div className="announcement-title-row">
                                        <h3>{announcement.title}</h3>
                                        {announcement.isPinned && (
                                            <span className="announcement-badge-pinned">Pinned</span>
                                        )}
                                        {announcement.category && (
                                            <span className="announcement-badge-category">{announcement.category}</span>
                                        )}
                                    </div>

                                    <p className="announcement-body-text">
                                        {announcement.content}
                                    </p>

                                    <div className="announcement-footer-meta">
                                        <span>
                                            <Calendar size={16} />
                                            {new Date(announcement.publishDate || announcement.createdAt).toLocaleDateString()}
                                        </span>
                                        <span>
                                            By {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <Megaphone size={48} />
                        <h4>No announcements</h4>
                        <p>There are no announcements at this time</p>
                    </div>
                </div>
            )}
        </div>
    )
}
