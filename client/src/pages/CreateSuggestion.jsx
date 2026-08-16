import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import './FormPages.css'

export default function CreateSuggestion() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        isAnonymous: false
    })

    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/suggestions', data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Suggestion submitted successfully!')
            navigate('/suggestions')
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to submit suggestion')
        }
    })

    if (user?.role !== 'RESIDENT') {
        return <Navigate to="/suggestions" replace />
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

    return (
        <div className="page animate-fadeIn">
            <div className="form-page-container">
                <Link to="/suggestions" className="form-back-btn">
                    <ArrowLeft size={18} /> Back to Suggestions
                </Link>

                <div className="form-card">
                    <h1>Submit a Suggestion</h1>
                    <p className="form-subtitle">Share your ideas or suggestions to help improve our barangay community.</p>

                    <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            name="title"
                            className="input"
                            placeholder="Your idea in a few words"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            name="category"
                            className="select"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="">Select a category</option>
                            <option value="Infrastructure">Infrastructure</option>
                            <option value="Safety">Safety</option>
                            <option value="Environment">Environment</option>
                            <option value="Community">Community</option>
                            <option value="Services">Services</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description *</label>
                        <textarea
                            name="description"
                            className="textarea"
                            placeholder="Describe your idea in detail..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={6}
                        />
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
                                Submit Suggestion
                            </>
                        )}
                    </button>
                </form>
                </div>
            </div>
        </div>
    )
}
