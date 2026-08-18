import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { 
    FileCheck, FileText, History, X, Send, Search, CheckCircle2, 
    Clock, DollarSign, Sparkles, Building2, ShieldCheck, ArrowRight,
    User, Phone, MapPin, AlertCircle, Filter, FileSpreadsheet
} from 'lucide-react'
import toast from 'react-hot-toast'
import './Services.css'

const emptyForm = { purpose: '', quantity: 1, contactNumber: '', address: '', notes: '' }

export default function Services() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const [activeService, setActiveService] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('ALL')

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['service-categories'],
        queryFn: async () => {
            const { data } = await api.get('/services/categories')
            return data.categories || []
        }
    })

    const { data: myRequests = [], isLoading: isLoadingRequests } = useQuery({
        queryKey: ['my-service-requests'],
        queryFn: async () => {
            const { data } = await api.get('/services/requests/my')
            return data.requests || []
        }
    })

    const requestMutation = useMutation({
        mutationFn: async ({ serviceId, payload }) => {
            const { data } = await api.post(`/services/${serviceId}/request`, payload)
            return data
        },
        onSuccess: () => {
            toast.success('Document requested successfully! You can track its progress below.')
            queryClient.invalidateQueries(['my-service-requests'])
            closeModal()
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to submit document request')
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
            toast.error('Please specify the purpose of your document request')
            return
        }
        requestMutation.mutate({
            serviceId: activeService.id,
            payload: {
                purpose: form.purpose,
                quantity: parseInt(form.quantity) || 1,
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

    // Filter services based on search and category
    const filteredCategories = useMemo(() => {
        return categories.map(cat => {
            if (selectedCategory !== 'ALL' && cat.id !== selectedCategory) {
                return null
            }
            const matchingServices = (cat.services || []).filter(s => {
                if (!searchQuery.trim()) return true
                const query = searchQuery.toLowerCase()
                return (
                    s.name.toLowerCase().includes(query) ||
                    (s.description && s.description.toLowerCase().includes(query)) ||
                    (s.requirements && s.requirements.toLowerCase().includes(query))
                )
            })

            if (matchingServices.length === 0) return null
            return {
                ...cat,
                services: matchingServices
            }
        }).filter(Boolean)
    }, [categories, searchQuery, selectedCategory])

    const totalServicesCount = useMemo(() => {
        return categories.reduce((acc, cat) => acc + (cat.services?.length || 0), 0)
    }, [categories])

    return (
        <div className="page animate-fadeIn">
            {/* Hero Header */}
            <div className="services-hero-banner">
                <div className="services-hero-content">
                    <div className="services-hero-badge">
                        <Sparkles size={15} /> Online Civil Registry & Document Portal
                    </div>
                    <h1>Barangay Services & Clearances</h1>
                    <p>
                        Apply for official certificates, barangay identification cards, and business clearances online with fast turnaround and tracking.
                    </p>
                </div>

                <div className="services-hero-stats">
                    <div className="hero-stat-card">
                        <span className="hero-stat-number">{totalServicesCount}</span>
                        <span className="hero-stat-label">Available Services</span>
                    </div>
                    <div className="hero-stat-card">
                        <span className="hero-stat-number">{myRequests.length}</span>
                        <span className="hero-stat-label">Your Requests</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="services-filter-bar">
                <div className="services-search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="services-search-input"
                        placeholder="Search by certificate name, requirements (e.g. Clearance, Indigency, ID)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Category Pills */}
                <div className="services-category-pills">
                    <button
                        type="button"
                        className={`category-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('ALL')}
                    >
                        All Services
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Service Categories & Cards Grid */}
            {isLoading ? (
                <div className="loading-container"><div className="spinner"></div></div>
            ) : filteredCategories.length > 0 ? (
                <div className="services-categories-container">
                    {filteredCategories.map(category => (
                        <div key={category.id} className="service-category-section">
                            <div className="service-category-header">
                                <div className="category-title-wrap">
                                    <div className="category-icon-halo">
                                        <FileCheck size={22} />
                                    </div>
                                    <div>
                                        <h2 className="service-category-title">{category.name}</h2>
                                        <span className="service-category-desc">{category.description || 'Official barangay documentation services'}</span>
                                    </div>
                                </div>
                                <span className="category-count-tag">{category.services.length} items</span>
                            </div>

                            <div className="services-cards-grid">
                                {category.services.map(service => {
                                    const isFree = service.fee === 0
                                    return (
                                        <div key={service.id} className="service-card-premium">
                                            <div className="service-card-top">
                                                <div className={`service-icon-box ${isFree ? 'icon-emerald' : 'icon-green'}`}>
                                                    <FileText size={24} />
                                                </div>
                                                <div className={`service-fee-badge ${isFree ? 'fee-free-badge' : 'fee-paid-badge'}`}>
                                                    {isFree ? 'FREE / Libre' : `₱${service.fee}.00`}
                                                </div>
                                            </div>

                                            <h3 className="service-card-name">{service.name}</h3>
                                            <p className="service-card-description">
                                                {service.description}
                                            </p>

                                            {/* Requirements Chips */}
                                            {service.requirements && (
                                                <div className="service-reqs-box">
                                                    <span className="service-reqs-label">📋 Requirements:</span>
                                                    <p className="service-reqs-text">{service.requirements}</p>
                                                </div>
                                            )}

                                            <div className="service-card-meta">
                                                <div className="service-meta-item">
                                                    <Clock size={14} className="meta-icon" />
                                                    <span>Processing: <strong>{service.processingDays} working day(s)</strong></span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openModal(service)}
                                                className="service-card-apply-btn"
                                            >
                                                <span>Request Document Online</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="services-empty-card animate-fadeIn">
                    <FileCheck size={48} className="empty-icon" />
                    <h3>No Services Found</h3>
                    <p>Try searching with a different term or clear your search query.</p>
                    <button type="button" className="btn btn-secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('ALL') }}>
                        Reset Filters
                    </button>
                </div>
            )}

            {/* My Requests Tracker Section */}
            {myRequests?.length > 0 && (
                <div className="my-requests-section animate-fadeIn">
                    <div className="my-requests-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="my-requests-icon-halo">
                                <History size={22} />
                            </div>
                            <div>
                                <h2>My Document Requests & Tracking</h2>
                                <p>Track the processing status of your submitted certificate applications</p>
                            </div>
                        </div>
                        <span className="requests-count-badge">{myRequests.length} Total Requests</span>
                    </div>

                    <div className="my-requests-timeline-grid">
                        {myRequests.map(request => {
                            const statusKey = request.status?.toLowerCase().replace('_', '-')
                            const isPending = request.status === 'PENDING'
                            const isApproved = request.status === 'APPROVED' || request.status === 'READY_FOR_PICKUP' || request.status === 'COMPLETED'
                            const isRejected = request.status === 'REJECTED' || request.status === 'CANCELLED'

                            return (
                                <div key={request.id} className={`my-request-card border-${statusKey}`}>
                                    <div className="my-request-card-header">
                                        <div>
                                            <h4>{request.service?.name}</h4>
                                            <span className="my-request-date">
                                                <Clock size={12} /> Filed {formatDate(request.createdAt)}
                                            </span>
                                        </div>
                                        <span className={`request-status-pill status-${statusKey}`}>
                                            {isApproved && <CheckCircle2 size={13} />}
                                            {isPending && <Clock size={13} />}
                                            {isRejected && <AlertCircle size={13} />}
                                            {formatStatus(request.status)}
                                        </span>
                                    </div>

                                    {request.purpose && (
                                        <div className="my-request-purpose-box">
                                            <strong>Purpose:</strong> {request.purpose}
                                        </div>
                                    )}

                                    <div className="my-request-card-footer">
                                        <span>Copies: <strong>{request.quantity || 1}</strong></span>
                                        <span>Fee: <strong>{request.service?.fee === 0 ? 'FREE' : `₱${(request.service?.fee || 0) * (request.quantity || 1)}.00`}</strong></span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Modern Request Form Modal */}
            {activeService && (
                <div className="service-modal-overlay animate-fadeIn" onClick={closeModal}>
                    <div className="service-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="service-modal-header">
                            <div className="modal-header-title-block">
                                <div className="modal-icon-badge">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3>Request {activeService.name}</h3>
                                    <p>Official document application for Barangay Burgos, Basey, Samar</p>
                                </div>
                            </div>
                            <button className="service-modal-close" onClick={closeModal} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Service Summary Chip */}
                        <div className="service-modal-summary-box">
                            <div className="summary-item">
                                <span className="summary-label">Standard Fee:</span>
                                <span className="summary-val fee-val">
                                    {activeService.fee === 0 ? 'FREE / Libre' : `₱${activeService.fee}.00 per copy`}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Turnaround:</span>
                                <span className="summary-val">{activeService.processingDays} working day(s)</span>
                            </div>
                            {activeService.requirements && (
                                <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="summary-label">Required to bring upon claim:</span>
                                    <span className="summary-val reqs-val">{activeService.requirements}</span>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="service-modal-form">
                            <div className="form-group">
                                <label className="form-label">Purpose of Request *</label>
                                <input
                                    type="text"
                                    name="purpose"
                                    className="input"
                                    placeholder="e.g. Employment Application, Scholarship, Bank Account, Travel"
                                    value={form.purpose}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="modal-two-col">
                                <div className="form-group">
                                    <label className="form-label">Number of Copies</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        className="input"
                                        min={1}
                                        max={10}
                                        value={form.quantity}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Phone Number</label>
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
                                <label className="form-label">Current Residential Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="input"
                                    placeholder="e.g. Block 4 Lot 12, Barangay Burgos, Basey, Samar"
                                    value={form.address}
                                    onChange={handleFormChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Additional Notes / Special Instructions (Optional)</label>
                                <textarea
                                    name="notes"
                                    className="textarea"
                                    placeholder="Any additional information for the barangay civil registry officer..."
                                    value={form.notes}
                                    onChange={handleFormChange}
                                    rows={2}
                                />
                            </div>

                            <div className="service-modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary submit-request-btn"
                                    disabled={requestMutation.isPending}
                                >
                                    {requestMutation.isPending ? (
                                        <>
                                            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                                            Submitting Request...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} /> Submit Document Request
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
