import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true })
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            },

            updateUser: (updates) => {
                set((state) => ({ user: { ...state.user, ...updates } }))
            },

            login: async (email, password) => {
                set({ isLoading: true })
                try {
                    const { data } = await api.post('/auth/login', { email, password })
                    get().setAuth(data.user, data.token)
                    return { success: true }
                } catch (error) {
                    return {
                        success: false,
                        error: error.response?.data?.error || 'Login failed'
                    }
                } finally {
                    set({ isLoading: false })
                }
            },

            register: async (userData) => {
                set({ isLoading: true })
                try {
                    const { data } = await api.post('/auth/register', userData)
                    return { success: true, message: data.message }
                } catch (error) {
                    return {
                        success: false,
                        error: error.response?.data?.error || 'Registration failed'
                    }
                } finally {
                    set({ isLoading: false })
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false })
                delete api.defaults.headers.common['Authorization']
            },

            checkAuth: async () => {
                const token = get().token
                if (!token) return false

                api.defaults.headers.common['Authorization'] = `Bearer ${token}`

                try {
                    const { data } = await api.get('/auth/me')
                    set({ user: data.user, isAuthenticated: true })
                    return true
                } catch {
                    get().logout()
                    return false
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user })
        }
    )
)
