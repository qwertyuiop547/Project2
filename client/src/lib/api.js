import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add token from local storage if available
const stored = localStorage.getItem('auth-storage')
if (stored) {
    try {
        const { state } = JSON.parse(stored)
        if (state?.token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
    } catch (e) {
        // Invalid storage
    }
}

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('auth-storage')
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api
