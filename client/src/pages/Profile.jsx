import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { getRoleLabel } from '../lib/roles'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Shield,
    Calendar,
    Save,
    Lock,
    CheckCircle,
    Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import './Profile.css'

export default function Profile() {
    const { user, updateUser } = useAuthStore()

    const [profileForm, setProfileForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        address: user?.address || ''
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const profileMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.put('/auth/profile', data)
            return res.data
        },
        onSuccess: (data) => {
            updateUser(data.user)
            toast.success('Profile updated successfully!')
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to update profile')
        }
    })

    const passwordMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.put('/auth/password', data)
            return res.data
        },
        onSuccess: () => {
            toast.success('Password changed successfully!')
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Failed to change password')
        }
    })

    const handleProfileChange = (e) => {
        const { name, value } = e.target
        setProfileForm(prev => ({ ...prev, [name]: value }))
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordForm(prev => ({ ...prev, [name]: value }))
    }

    const handleProfileSubmit = (e) => {
        e.preventDefault()
        profileMutation.mutate(profileForm)
    }

    const handlePasswordSubmit = (e) => {
        e.preventDefault()
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match')
            return
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters')
            return
        }
        passwordMutation.mutate({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
        })
    }

    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`
    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null

    return (
        <div className="page animate-fadeIn">
            <div className="section-header">
                <h2>My Profile</h2>
            </div>

            {/* Profile summary card */}
            <div className="profile-hero">
                <div className="profile-avatar">{initials}</div>
                <div className="profile-hero-info">
                    <h1>{user?.firstName} {user?.lastName}</h1>
                    <div className="profile-meta">
                        <span className="profile-role-badge">
                            <Shield size={14} />
                            {getRoleLabel(user?.role)}
                        </span>
                        <span className={`profile-status-badge ${user?.isApproved ? 'approved' : 'pending'}`}>
                            {user?.isApproved ? <CheckCircle size={14} /> : <Clock size={14} />}
                            {user?.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                    </div>
                    {joinedDate && (
                        <p className="profile-joined">
                            <Calendar size={14} /> Member since {joinedDate}
                        </p>
                    )}
                </div>
            </div>

            <div className="profile-grid">
                {/* Edit profile */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <User size={20} />
                        <h3>Personal Information</h3>
                    </div>

                    <form onSubmit={handleProfileSubmit}>
                        <div className="profile-field-readonly">
                            <Mail size={16} />
                            <div>
                                <span className="field-label">Email</span>
                                <span className="field-value">{user?.email}</span>
                            </div>
                        </div>

                        <div className="profile-form-row">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className="input"
                                    value={profileForm.firstName}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className="input"
                                    value={profileForm.lastName}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Phone size={14} /> Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                className="input"
                                placeholder="e.g. 0917 123 4567"
                                value={profileForm.phone}
                                onChange={handleProfileChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <MapPin size={14} /> Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                className="input"
                                placeholder="Your complete address"
                                value={profileForm.address}
                                onChange={handleProfileChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary profile-submit"
                            disabled={profileMutation.isPending}
                        >
                            {profileMutation.isPending ? (
                                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                            ) : (
                                <>
                                    <Save size={18} /> Save Changes
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Change password */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <Lock size={20} />
                        <h3>Change Password</h3>
                    </div>

                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                className="input"
                                placeholder="Enter current password"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                className="input"
                                placeholder="At least 6 characters"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="input"
                                placeholder="Re-enter new password"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary profile-submit"
                            disabled={passwordMutation.isPending}
                        >
                            {passwordMutation.isPending ? (
                                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                            ) : (
                                <>
                                    <Lock size={18} /> Update Password
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
