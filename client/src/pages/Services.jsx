import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { FileCheck, FileText, History, X, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import './Services.css'

const emptyForm = { purpose: '', quantity: 1, contactNumber: '', address: '', notes: '' }

export default function Services() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const [activeService, setActiveService] = useState(null)
    const [form, setForm] = useState(emptyForm)

    const { data: categories, isLoading } = useQuery({
        queryKey: ['service-categories'],
        queryFn: async () => {
            const { data } = await api.get('/services/categories')
            return data.categories
        }
    })

    const { data: myRequests } = useQuery({
        queryKey: ['my-service-requests'],
        queryFn: async () => {
            const { data } = await api.get('/services/requests/my')
            return data.requests
        }
    })

    const requestMutation = useMutation({
        mutationFn: async ({ serviceId, payload }) => {
            const { data } = await api.post(`/services/${serviceId}/request`, payload)
            return data
        },
        onSuccess: () => {
            toast.success('Service requested successfully!')
            queryClient.invalidateQueries(['my-service-requests'])
            closeModal()
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to request service')
        }
    })

    const openModal = (service) => {
        setActiveService(service)
        setForm({
            ...emptyForm,
            contactNumber: user?.phone || '',
            address: user?.address || ''
        })
    }

    const closeModal = () => {
        setActiveService(null)
        setForm(emptyForm)
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.purpose.trim()) {
            toast.error('Please enter the purpose of your request')
            return
        }
        requestMutation.mutate({
            serviceId: activeService.id,
            payload: {
                purpose: form.purpose,
                quantity: form.quantity,
                contactNumber: form.contactNumber,
                address: form.address,
                notes: form.notes
            }
        })
    }

    const formatStatus = (status) => (status || '').replace('_', ' ')
    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    })

    return (
        <div className="page animate-fadeIn">
            <div className="services-page-header">
                <div>
                    <h1>Barangay Services</h1>
                    <p>Request certificates and documents</p>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : categories?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {categories.map(category => (
                        <div key={category.id} className="service-category-section">
                            <h2 className="service-category-title">
                                <FileCheck size={26} />
                                {category.name}
                            </h2>

                            <div className="grid-3">
                                {category.services?.map(service => (
                                    <div key={service.id} className="service-item-card">
                                        <div className="service-icon-container">
                                            <FileText size={24} color="white" />
                                        </div>

                                        <h3>{service.name}</h3>
                                        <p className="service-description">
                                            {service.description}
                                        </p>

                                        <div className="service-info-row">
                                            <div className="info-col">
                                                <div className="info-label">Fee</div>
                                                <div className={`info-value ${service.fee === 0 ? 'fee-free' : 'fee-paid'}`}>
                                                    {service.fee === 0 ? 'FREE' : `₱${service.fee}`}
                                                </div>
                                            </div>
                                            <div className="info-col" style={{ alignItems: 'flex-end' }}>
                                                <div className="info-label">Processing</div>
                                                <div className="info-value">{service.processingDays} day(s)</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => openModal(service)}
                                            className="service-request-btn"
                                        >
                                            Request
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <FileCheck size={48} />
                        <h4>No services available</h4>
                        <p>Services will be listed here</p>
                    </div>
                </div>
            )}

            {/* My Requests */}
            {myRequests?.length > 0 && (
                <div className="service-category-section" style={{ marginTop: 48 }}>
                    <h2 className="service-category-title">
                        <History size={26} />
                        My Requests
                    </h2>

                    <div className="my-requests-list">
                        {myRequests.map(request => {
                            const statusClass = request.status?.toLowerCase().replace('_', '-')
                            return (
                                <div key={request.id} className="my-request-item">
                                    <div className="my-request-icon">
                                        <FileText size={20} color="white" />
                                    </div>
                                    <div className="my-request-info">
                                        <h4>{request.service?.name}</h4>
                                        <p>{request.service?.category?.name} • Requested {formatDate(request.createdAt)}</p>
                                        {request.purpose && (
                                            <div className="my-request-details">
                                                <span><strong>Purpose:</strong> {request.purpose}</span>
                                                <span><strong>Copies:</strong> {request.quantity}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`badge badge-${statusClass}`}>
                                        {formatStatus(request.status)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Request Form Modal */}
            {activeService && (
                <div className="service-modal-overlay" onClick={closeModal}>
                    <div className="service-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="service-modal-header">
                            <div>
                                <h3>Request {activeService.name}</h3>
                                <p>Fill in the details so the barangay can process your request</p>
                            </div>
                            <button className="service-modal-close" onClick={closeModal} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="service-modal-requestor">
                            <span className="info-label">Requested by</span>
                            <span className="requestor-name">{user?.firstName} {user?.lastName}</span>
                            <span className="requestor-email">{user?.email}</span>
                        </div>

                        <form onSubmit={handleSubmit} className="service-modal-body">
                            <div className="form-group">
                                <label className="form-label">Purpose *</label>
                                <input
                                    type="text"
                                    name="purpose"
                                    className="input"
                                    placeholder="e.g. For employment, scholarship, financial assistance"
                                    value={form.purpose}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="service-modal-row">
                                <div className="form-group">
                                    <label className="form-label">Number of Copies</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        className="input"
                                        min={1}
                                        value={form.quantity}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Number</label>
                                    <input
                                        type="tel"
                                        name="contactNumber"
                                        className="input"
                                        placeholder="e.g. 0917 123 4567"
                                        value={form.contactNumber}
                                        onChange={handleFormChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="input"
                                    placeholder="Your complete address"
                                    value={form.address}
                                    onChange={handleFormChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Additional Notes</label>
                                <textarea
                                    name="notes"
                                    className="textarea"
                                    placeholder="Any extra information for the barangay (optional)"
                                    value={form.notes}
                                    onChange={handleFormChange}
                                    rows={3}
                                />
                            </div>

                            <div className="service-modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={requestMutation.isPending}
                                >
                                    {requestMutation.isPending ? (
                                        <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                                    ) : (
                                        <>
                                            <Send size={16} /> Submit Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
