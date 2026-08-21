import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { getRoleLabel } from '../lib/roles'
import {
    User, Mail, Phone, MapPin, Shield, Calendar, Save, 
    Lock, CheckCircle2, Clock, Sparkles, KeyRound, Building2, 
    AlertCircle, ShieldCheck, Download, Smartphone
} from 'lucide-react'
import { openPwaInstallModal } from '../lib/usePWA'
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

    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null

    return (
        <div className="page animate-fadeIn">
            {/* Resident Digital Profile Banner */}
            <div className="profile-hero-card">
                <div className="profile-hero-content">
                    <div className="profile-avatar-box">
                        <span>{initials}</span>
                    </div>

                    <div className="profile-details-column">
                        <div className="profile-badge-row">
                            <span className="profile-role-pill">
                                <ShieldCheck size={13} /> {getRoleLabel(user?.role)}
                            </span>
                            <span className={`profile-status-pill ${user?.isApproved ? 'pill-approved' : 'pill-pending'}`}>
                                {user?.isApproved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                {user?.isApproved ? 'Verified Citizen' : 'Pending Verification'}
                            </span>
                            <span className="profile-brgy-pill">
                                <Building2 size={13} /> Barangay Burgos, Basey
                            </span>
                        </div>

                        <h1>{user?.firstName} {user?.lastName}</h1>

                        <div className="profile-contact-chips">
                            <span className="contact-chip">
                                <Mail size={13} /> {user?.email}
                            </span>
                            {user?.phone && (
                                <span className="contact-chip">
                                    <Phone size={13} /> {user.phone}
                                </span>
                            )}
                            {joinedDate && (
                                <span className="contact-chip">
                                    <Calendar size={13} /> Member since {joinedDate}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-Column Grid: Profile Edit + Security */}
            <div className="profile-columns-grid">
                {/* Personal Information Form Card */}
                <div className="profile-section-card">
                    <div className="card-header-block">
                        <div className="card-header-icon icon-emerald">
                            <User size={20} />
                        </div>
                        <div>
                            <h3>Personal Information</h3>
                            <p>Update your resident contact and residential address details</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="profile-form">
                        {/* Read-only Registered Email */}
                        <div className="readonly-field-box">
                            <Mail size={18} className="field-icon-gold" />
                            <div className="readonly-text">
                                <span className="readonly-label">Registered Account Email</span>
                                <strong className="readonly-val">{user?.email}</strong>
                            </div>
                        </div>

                        <div className="form-two-col">
                            <div className="form-group">
                                <label className="form-label">First Name *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className="input"
                                    placeholder="First Name"
                                    value={profileForm.firstName}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className="input"
                                    placeholder="Last Name"
                                    value={profileForm.lastName}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mobile Contact Number</label>
                            <div className="input-icon-wrap">
                                <Phone size={16} className="input-inside-icon" />
                                <input
                                    type="tel"
                                    name="phone"
                                    className="input input-with-icon"
                                    placeholder="e.g. 0917 123 4567"
                                    value={profileForm.phone}
                                    onChange={handleProfileChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Residential Address in Barangay Burgos</label>
                            <div className="input-icon-wrap">
                                <MapPin size={16} className="input-inside-icon" />
                                <input
                                    type="text"
                                    name="address"
                                    className="input input-with-icon"
                                    placeholder="e.g. Block 4 Lot 12, Barangay Burgos, Basey, Samar"
                                    value={profileForm.address}
                                    onChange={handleProfileChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary profile-submit-btn"
                            disabled={profileMutation.isPending}
                        >
                            {profileMutation.isPending ? (
                                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                            ) : (
                                <>
                                    <Save size={16} /> Save Profile Changes
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Account Security & Password Card */}
                <div className="profile-section-card">
                    <div className="card-header-block">
                        <div className="card-header-icon icon-indigo">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h3>Security & Password</h3>
                            <p>Manage account authentication and credential protection</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="profile-form">
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <div className="input-icon-wrap">
                                <Lock size={16} className="input-inside-icon" />
                                <input
                                    type="password"
                                    name="currentPassword"
                                    className="input input-with-icon"
                                    placeholder="Enter your current password"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div className="input-icon-wrap">
                                <Lock size={16} className="input-inside-icon" />
                                <input
                                    type="password"
                                    name="newPassword"
                                    className="input input-with-icon"
                                    placeholder="At least 6 characters"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <div className="input-icon-wrap">
                                <Lock size={16} className="input-inside-icon" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="input input-with-icon"
                                    placeholder="Re-type your new password"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="security-notice-box">
                            <Shield size={16} className="text-blue-600" />
                            <span>Never share your password with anyone. Barangay staff will never ask for your account credentials.</span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-secondary profile-password-btn"
                            disabled={passwordMutation.isPending}
                        >
                            {passwordMutation.isPending ? (
                                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                            ) : (
                                <>
                                    <Lock size={16} /> Update Account Password
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Dedicated PWA Mobile App Card */}
                <div className="profile-card pwa-profile-card">
                    <div className="profile-card-header">
                        <div className="card-icon-wrap icon-emerald">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <h2>Barangay Burgos Mobile App (PWA)</h2>
                            <p>I-install ang official portal sa iyong Home Screen para sa mabilisang access at offline hotlines.</p>
                        </div>
                    </div>

                    <div className="pwa-profile-content">
                        <div className="pwa-profile-perks">
                            <div className="perk-pill">⚡ 1-Tap Home Screen Launcher</div>
                            <div className="perk-pill">📡 Offline Emergency Access</div>
                            <div className="perk-pill">📦 Zero App Store Downloads Required</div>
                        </div>

                        <button
                            type="button"
                            className="btn btn-primary pwa-profile-install-btn"
                            onClick={openPwaInstallModal}
                        >
                            <Download size={18} />
                            <span>Buksan ang App Installer (PWA)</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
