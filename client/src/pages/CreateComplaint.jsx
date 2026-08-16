import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { ArrowLeft, Send, Sparkles, Check, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import './FormPages.css'

export default function CreateComplaint() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        location: '',
        priority: 'MEDIUM',
        isAnonymous: false
    })
    const [aiSuggestion, setAiSuggestion] = useState(null)

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
                title: formData.title,
                description: formData.description,
                location: formData.location,
            })
            return data.suggestion
        },
        onSuccess: (suggestion) => {
            setAiSuggestion(suggestion)
            toast.success('AI suggestion ready — review before applying')
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

    const handleSubmit = (e) => {
        e.preventDefault()
        mutation.mutate(formData)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleAiAssist = () => {
        if (!formData.description.trim()) {
            toast.error('Maglagay muna ng description bago gamitin ang AI Assist')
            return
        }
        aiAssistMutation.mutate()
    }

    const applyAiSuggestion = () => {
        if (!aiSuggestion) {
            return
        }
        setFormData(prev => ({
            ...prev,
            title: aiSuggestion.title,
            description: aiSuggestion.description,
            categoryId: aiSuggestion.categoryId,
            priority: aiSuggestion.priority,
        }))
        toast.success('Na-apply ang AI suggestion — suriin bago i-submit')
    }

    return (
        <div className="page animate-fadeIn">
            <div className="form-page-container">
                <Link to="/complaints" className="form-back-btn">
                    <ArrowLeft size={18} /> Back to Complaints
                </Link>

                <div className="form-card">
                    <h1>File a Complaint</h1>
                    <p className="form-subtitle">
                        Please fill out the form below to report an issue to the barangay officials.
                        Gamitin ang <strong>AI Assist</strong> para mas malinaw ang reklamo mo.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Describe the Issue *</label>
                            <textarea
                                name="description"
                                className="textarea"
                                placeholder="I-describe ang issue — Tagalog o English ay pwede. Hal: matagal na hindi dumadaan ang basura sa Block 5..."
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={5}
                            />
                            <button
                                type="button"
                                className="ai-assist-btn"
                                onClick={handleAiAssist}
                                disabled={aiAssistMutation.isPending || !formData.description.trim()}
                            >
                                {aiAssistMutation.isPending ? (
                                    <>
                                        <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        AI Assist — Suggest Title, Category & Priority
                                    </>
                                )}
                            </button>
                        </div>

                        {aiSuggestion && (
                            <div className="ai-suggestion-card">
                                <div className="ai-suggestion-header">
                                    <Sparkles size={18} />
                                    <h4>AI Suggestion</h4>
                                </div>
                                <p className="ai-suggestion-explanation">{aiSuggestion.explanation}</p>
                                <div className="ai-suggestion-preview">
                                    <div><strong>Title:</strong> {aiSuggestion.title}</div>
                                    <div><strong>Category:</strong> {aiSuggestion.categoryName}</div>
                                    <div><strong>Priority:</strong> {aiSuggestion.priority}</div>
                                    <div><strong>Description:</strong> {aiSuggestion.description}</div>
                                </div>
                                <div className="ai-suggestion-actions">
                                    <button type="button" className="ai-apply-btn" onClick={applyAiSuggestion}>
                                        <Check size={16} /> Apply Suggestion
                                    </button>
                                    <button type="button" className="ai-dismiss-btn" onClick={() => setAiSuggestion(null)}>
                                        <RotateCcw size={16} /> Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input
                                type="text"
                                name="title"
                                className="input"
                                placeholder="Brief description of the issue"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select
                                name="categoryId"
                                className="select"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                name="location"
                                className="input"
                                placeholder="Where is the issue located?"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select
                                name="priority"
                                className="select"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    name="isAnonymous"
                                    checked={formData.isAnonymous}
                                    onChange={handleChange}
                                    className="checkbox-input"
                                />
                                <span className="checkbox-label">Submit anonymously</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="form-submit-btn"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Complaint
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
