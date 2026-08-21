import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { ArrowLeft, Send, Sparkles, Check, RotateCcw, AlertCircle, MapPin, Shield, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import LocationPickerMap from '../components/LocationPickerMap'
import './FormPages.css'

export default function CreateComplaint() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [formData, setFormData] = useState({
        description: '',
        location: '',
        isAnonymous: false
    })
    const [aiSuggestion, setAiSuggestion] = useState(null)
    const [isEditing, setIsEditing] = useState(false)

    const { data: categories } = useQuery({
        queryKey: ['complaint-categories'],
        queryFn: async () => {
            const { data } = await api.get('/complaints/categories')
            return data.categories
        }
    })

    const aiAssistMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post('/ai/complaint-assist', {
                description: formData.description,
                location: formData.location,
            })
            return data.suggestion
        },
        onSuccess: (suggestion) => {
            setAiSuggestion(suggestion)
            if (suggestion?.isSufficient === false) {
                toast('Please provide more details — see AI guidance below', { icon: 'ℹ️' })
            } else {
                toast.success('AI report generated! You can now pin the incident location on the map.')
                setIsEditing(false)
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'AI assist failed')
        }
    })

    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/complaints', data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Complaint filed successfully!')
            navigate('/complaints')
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to file complaint')
        }
    })

    if (user?.role !== 'RESIDENT') {
        return <Navigate to="/complaints" replace />
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleGenerateAI = (e) => {
        e?.preventDefault?.()
        const desc = formData.description.trim()
        if (!desc) {
            toast.error('Please enter your complaint description first.')
            return
        }
        // Client-side quick checks before sending to AI
        if (desc.length < 10) {
            toast.error('Masyadong maikli ang iyong reklamo. Mangyaring maglagay ng kaunting detalye pa.')
            return
        }
        // Basic gibberish / keyboard mash check
        const stripped = desc.replace(/\s+/g, '').toLowerCase()
        if (/^(.)\1{3,}$/i.test(stripped) || /^[asdfghjkl;']+$/i.test(stripped) || /^[qwertyuiop]+$/i.test(stripped)) {
            toast.error('Hindi maintindihan ang iyong input. Mangyaring magsulat ng maayos na reklamo.')
            return
        }
        aiAssistMutation.mutate()
    }

    const handleFinalSubmit = () => {
        if (!aiSuggestion || aiSuggestion.isSufficient === false) {
            handleGenerateAI()
            return
        }

        mutation.mutate({
            title: aiSuggestion.title,
            description: aiSuggestion.description,
            categoryId: aiSuggestion.categoryId,
            priority: aiSuggestion.priority,
            location: formData.location,
            isAnonymous: formData.isAnonymous
        })
    }

    return (
        <div className="page animate-fadeIn">
            <div className="form-page-container">
                <Link to="/complaints" className="form-back-btn">
                    <ArrowLeft size={18} /> Back to Complaints
                </Link>

                <div className="form-card">
                    <div className="form-header-badge">
                        <Sparkles size={16} /> AI-Powered Complaint Filing
                    </div>
                    <h1>File a Complaint</h1>
                    <p className="form-subtitle">
                        Describe the community issue or problem below. The <strong>AI</strong> will automatically determine the <strong>Title</strong>, <strong>Category</strong>, <strong>Priority</strong>, and <strong>Formal Report</strong>, then open the interactive satellite map to pin the exact location.
                    </p>

                    {/* Step 1: Resident describes the issue first */}
                    {(!aiSuggestion || aiSuggestion.isSufficient === false || isEditing) && (
                        <form onSubmit={handleGenerateAI}>
                            <div className="form-group">
                                <label className="form-label">Describe the Issue *</label>
                                <textarea
                                    name="description"
                                    className="textarea"
                                    placeholder="Describe the issue in detail (e.g. Uncollected garbage pile near Block 5 corner 2nd Street causing foul odor and health hazards for the past 3 days...)"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={6}
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: 8 }}>
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        name="isAnonymous"
                                        checked={formData.isAnonymous}
                                        onChange={handleChange}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-label">
                                        <Shield size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                                        Submit as Anonymous (Hide my name from public reports)
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="ai-generate-btn"
                                disabled={aiAssistMutation.isPending || !formData.description.trim()}
                            >
                                {aiAssistMutation.isPending ? (
                                    <>
                                        <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                        Analyzing & Preparing Report with AI...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Generate Complaint & Open Location Map (AI Assist)
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Warning Card: If description is too short / insufficient */}
                    {aiSuggestion && aiSuggestion.isSufficient === false && !isEditing && (
                        <div className="ai-suggestion-card ai-suggestion-card-warning animate-fadeIn" style={{ marginTop: 20 }}>
                            <div className="ai-suggestion-header">
                                <div className="ai-warning-icon-wrapper">
                                    <AlertCircle size={22} className="ai-warning-icon" />
                                </div>
                                <div className="ai-warning-title-block">
                                    <h4>More Details Needed</h4>
                                    <span className="ai-warning-caption">Please provide a bit more context so the AI can generate your report</span>
                                </div>
                                {aiSuggestion.source && <span className="ai-source-badge">{aiSuggestion.source}</span>}
                            </div>

                            <p className="ai-suggestion-explanation">
                                {aiSuggestion.clarificationMessage || 'The input provided is too brief or lacks sufficient details. Please describe what occurred so the AI can prepare your formal report and location map.'}
                            </p>

                            <div className="ai-tips-grid">
                                <div className="ai-tip-card">
                                    <div className="ai-tip-icon">📌</div>
                                    <div className="ai-tip-content">
                                        <strong>What Happened</strong>
                                        <span>Describe the specific issue, disturbance, or hazard</span>
                                    </div>
                                </div>
                                <div className="ai-tip-card">
                                    <div className="ai-tip-icon">📍</div>
                                    <div className="ai-tip-content">
                                        <strong>Location / Landmark</strong>
                                        <span>Mention the street, block, corner, or area</span>
                                    </div>
                                </div>
                                <div className="ai-tip-card">
                                    <div className="ai-tip-icon">⏰</div>
                                    <div className="ai-tip-content">
                                        <strong>Time / Duration</strong>
                                        <span>Indicate when it occurred or how long ongoing</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-suggestion-actions">
                                <button type="button" className="ai-dismiss-btn" onClick={() => setAiSuggestion(null)}>
                                    <RotateCcw size={16} /> Got it, I will add more details
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2 & 3: AI Generated Report + Interactive Satellite Map Pinning */}
                    {aiSuggestion && aiSuggestion.isSufficient === true && !isEditing && (
                        <div className="ai-review-card animate-fadeIn">
                            <div className="ai-review-header">
                                <div className="ai-review-header-title">
                                    <Sparkles size={20} className="text-green-600" />
                                    <h3>Official Complaint Report (AI Generated)</h3>
                                </div>
                                {aiSuggestion.source && <span className="ai-source-badge">{aiSuggestion.source}</span>}
                            </div>

                            <p className="ai-review-subtitle">
                                The AI has structured your formal report. <strong>Please pin the exact incident location on the map below before submitting:</strong>
                            </p>

                            <div className="ai-review-meta-grid">
                                <div className="ai-meta-item">
                                    <span className="ai-meta-label">🏷️ Category</span>
                                    <span className="ai-meta-value category-tag">{aiSuggestion.categoryName}</span>
                                </div>
                                <div className="ai-meta-item">
                                    <span className="ai-meta-label">⚡ Priority Level</span>
                                    <span className={`priority-badge priority-${aiSuggestion.priority?.toLowerCase()}`}>
                                        {aiSuggestion.priority}
                                    </span>
                                </div>
                                {formData.isAnonymous && (
                                    <div className="ai-meta-item">
                                        <span className="ai-meta-label">🔒 Privacy</span>
                                        <span className="ai-meta-value text-amber-600 font-semibold">Anonymous Filing</span>
                                    </div>
                                )}
                            </div>

                            <div className="ai-review-section">
                                <label className="ai-section-label">📝 Complaint Title</label>
                                <div className="ai-section-content title-content">
                                    {aiSuggestion.title}
                                </div>
                            </div>

                            <div className="ai-review-section">
                                <label className="ai-section-label">📄 Formal Complaint Report for Barangay Officials</label>
                                <div className="ai-section-content description-content">
                                    {aiSuggestion.description}
                                </div>
                            </div>

                            <div className="ai-review-explanation">
                                <strong>💡 AI Rationale & Analysis:</strong> {aiSuggestion.explanation}
                            </div>

                            {/* Real-time Map Pinning Section */}
                            <div className="ai-review-section" style={{ marginTop: 24, paddingTop: 18, borderTop: '2px solid rgba(21, 128, 61, 0.15)' }}>
                                <label className="ai-section-label" style={{ color: '#15803d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <MapPin size={18} style={{ color: '#dc2626' }} />
                                    Pin Exact Incident Location on Satellite Map *
                                </label>
                                <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: '0 0 10px' }}>
                                    Click or drag the pin on the map to mark the exact house, street, or landmark, or use <strong>Live GPS</strong>:
                                </p>
                                <LocationPickerMap
                                    value={formData.location}
                                    onChange={(loc) => setFormData(prev => ({ ...prev, location: loc }))}
                                />
                            </div>

                            <div className="ai-review-actions">
                                <button
                                    type="button"
                                    className="ai-submit-final-btn"
                                    onClick={handleFinalSubmit}
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                            Submitting Complaint & Pinned Location...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Confirm & Submit Complaint with Pinned Location
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="ai-edit-btn"
                                    onClick={() => setIsEditing(true)}
                                    disabled={mutation.isPending}
                                >
                                    <Edit3 size={16} /> Edit Description
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
