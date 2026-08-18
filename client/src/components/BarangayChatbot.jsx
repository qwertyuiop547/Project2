import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
    MessageCircle, X, Send, Bot, User, Sparkles, PhoneCall, ShieldAlert, 
    FileText, CheckCircle2, Clock, DollarSign, ArrowRight, ExternalLink,
    Flame, Siren, Ambulance, Building2, Mic, MicOff, AlertTriangle
} from 'lucide-react'
import { streamChatMessage } from '../lib/chatStream'
import { useAuthStore } from '../lib/auth'
import './BarangayChatbot.css'

// Authentic Philippine Emergency Hotlines (National & Basey, Samar Region VIII)
const EMERGENCY_HOTLINES = [
    {
        name: 'National Emergency Hotline',
        number: '911',
        tel: 'tel:911',
        desc: 'Nationwide Police, Medical & Fire Emergency',
        badge: 'National 24/7',
        icon: Siren,
        color: '#dc2626'
    },
    {
        name: 'PNP Basey Police Station',
        number: '0998-598-6541',
        tel: 'tel:09985986541',
        desc: 'Philippine National Police — Basey MPS',
        badge: 'Police / Peace & Order',
        icon: ShieldAlert,
        color: '#2563eb'
    },
    {
        name: 'BFP Basey Fire Station',
        number: '0915-602-1994',
        tel: 'tel:09156021994',
        desc: 'Bureau of Fire Protection — Basey',
        badge: 'Fire & Rescue',
        icon: Flame,
        color: '#ea580c'
    },
    {
        name: 'MDRRMO Rescue Basey',
        number: '0927-482-9388',
        tel: 'tel:09274829388',
        desc: 'Disaster Risk Reduction & Ambulance Dispatch',
        badge: 'Medical / Ambulance',
        icon: Ambulance,
        color: '#16a34a'
    },
    {
        name: 'Barangay Burgos Tanod Desk',
        number: '0917-882-8746',
        tel: 'tel:09178828746',
        desc: 'Barangay Peacekeeping Action Team (BPAT)',
        badge: 'Barangay Hall',
        icon: Building2,
        color: '#15803d'
    }
]

// Document Services Checklist & Fees Directory (Feature 5)
const DOCUMENT_CARDS = {
    clearance: {
        id: 'brgy-clearance',
        title: 'Barangay Clearance',
        category: 'Official Certificate',
        fee: '₱50.00',
        processingDays: '1 Working Day',
        requirements: [
            '1 Valid Government-issued ID',
            'Community Tax Certificate (Cedula)',
            'Proof of Barangay Residency'
        ],
        path: '/services'
    },
    indigency: {
        id: 'indigency',
        title: 'Certificate of Indigency',
        category: 'Social Assistance',
        fee: 'FREE / Libre',
        processingDays: 'Same Day / 1 Day',
        requirements: [
            '1 Valid Government-issued ID',
            'Proof of Low Income / Endorsement',
            'Purpose of Request (Medical/Scholarship)'
        ],
        path: '/services'
    },
    id: {
        id: 'brgy-id',
        title: 'Barangay Resident ID Card',
        category: 'Identification Card',
        fee: '₱100.00',
        processingDays: '3 Working Days',
        requirements: [
            '1 Valid Government ID or Birth Certificate',
            '2 pcs 1x1 recent ID Photo',
            'Proof of Address / Barangay Residency'
        ],
        path: '/services'
    },
    business: {
        id: 'business-permit',
        title: 'Barangay Business Clearance',
        category: 'Business & Commercial',
        fee: '₱200.00',
        processingDays: '2 Working Days',
        requirements: [
            'DTI / SEC Registration Certificate',
            'Contract of Lease or Land Title',
            'Barangay Locational Inspection Clearance'
        ],
        path: '/services'
    }
}

const QUICK_PROMPTS = [
    'How to file a complaint?',
    'Barangay Clearance requirements?',
    'How to check my complaint status?',
    'Emergency hotlines list',
]

function formatReply(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')
}

function TypingIndicator() {
    return (
        <div className="chatbot-typing-indicator" aria-label="Thinking...">
            <span className="chatbot-typing-dot" />
            <span className="chatbot-typing-dot" />
            <span className="chatbot-typing-dot" />
        </div>
    )
}

function createWelcomeMessages(firstName) {
    return [
        {
            role: 'assistant',
            content: `Hello, ${firstName || 'Resident'}! I am your **Barangay AI Assistant**. I can help you with filing complaints, checking certificate requirements, or connecting to emergency hotlines. What can I assist you with today?`,
            source: 'portal-guide',
        },
    ]
}

export default function BarangayChatbot() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [showHotlines, setShowHotlines] = useState(false)
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [messages, setMessages] = useState(() => createWelcomeMessages(user?.firstName))
    const messagesEndRef = useRef(null)
    const abortRef = useRef(null)
    const recognitionRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isStreaming, showHotlines])

    useEffect(() => {
        // Initialize Speech Recognition if supported
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = false
            recognition.lang = 'en-PH'

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript
                setInput(transcript)
                setIsListening(false)
            }

            recognition.onerror = () => setIsListening(false)
            recognition.onend = () => setIsListening(false)
            recognitionRef.current = recognition
        }

        return () => {
            abortRef.current?.abort()
        }
    }, [])

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) return

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (e) {
                console.warn('Speech recognition start error:', e)
            }
        }
    }

    const updateStreamingMessage = (updater) => {
        setMessages((prev) => {
            const next = [...prev]
            const lastIndex = next.length - 1
            if (lastIndex < 0 || next[lastIndex].role !== 'assistant' || !next[lastIndex].isStreaming) {
                return prev
            }

            next[lastIndex] = updater(next[lastIndex])
            return next
        })
    }

    // Detect matched action cards or document requirements (Features 2 & 5)
    const detectCardContext = (text) => {
        const lower = (text || '').toLowerCase()
        if (lower.includes('indigency') || lower.includes('indigent')) {
            return { type: 'doc', data: DOCUMENT_CARDS.indigency }
        }
        if (lower.includes('clearance') && !lower.includes('business')) {
            return { type: 'doc', data: DOCUMENT_CARDS.clearance }
        }
        if (lower.includes('barangay id') || lower.includes('resident id')) {
            return { type: 'doc', data: DOCUMENT_CARDS.id }
        }
        if (lower.includes('business') || lower.includes('permit') || lower.includes('commercial')) {
            return { type: 'doc', data: DOCUMENT_CARDS.business }
        }
        if (lower.includes('complaint') || lower.includes('reklamo') || lower.includes('file a complaint') || lower.includes('incident')) {
            return { type: 'complaint_action' }
        }
        if (lower.includes('status') || lower.includes('track') || lower.includes('subaybay')) {
            return { type: 'track_action' }
        }
        if (lower.includes('service') || lower.includes('serbisyo') || lower.includes('certificate')) {
            return { type: 'services_action' }
        }
        return null
    }

    const sendMessage = async (text) => {
        const trimmed = text.trim()
        if (!trimmed || isStreaming) {
            return
        }

        if (trimmed.toLowerCase().includes('hotline') || trimmed.toLowerCase().includes('emergency')) {
            setShowHotlines(true)
        }

        const userMessage = { role: 'user', content: trimmed }
        const nextMessages = [...messages, userMessage]
        setMessages(nextMessages)
        setInput('')
        setIsStreaming(true)

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: '',
                source: null,
                isStreaming: true,
                cardContext: detectCardContext(trimmed)
            },
        ])

        const history = nextMessages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
        }))

        try {
            await streamChatMessage({
                message: trimmed,
                history,
                signal: controller.signal,
                onMeta: ({ source }) => {
                    updateStreamingMessage((msg) => ({
                        ...msg,
                        source,
                    }))
                },
                onToken: (token) => {
                    updateStreamingMessage((msg) => ({
                        ...msg,
                        content: `${msg.content}${token}`,
                    }))
                },
                onDone: ({ source }) => {
                    updateStreamingMessage((msg) => ({
                        ...msg,
                        source: source || msg.source,
                        isStreaming: false,
                        cardContext: msg.cardContext || detectCardContext(msg.content || trimmed)
                    }))
                    setIsStreaming(false)
                },
                onError: (message) => {
                    updateStreamingMessage((msg) => ({
                        ...msg,
                        content: message,
                        source: 'smart-assist',
                        isStreaming: false,
                    }))
                    setIsStreaming(false)
                },
            })

            setMessages((prev) => {
                const next = [...prev]
                const lastIndex = next.length - 1
                if (lastIndex >= 0 && next[lastIndex].isStreaming) {
                    next[lastIndex] = {
                        ...next[lastIndex],
                        isStreaming: false,
                        source: next[lastIndex].source || 'smart-assist',
                        content: next[lastIndex].content || 'Thank you for your inquiry. How else may I assist you?',
                        cardContext: next[lastIndex].cardContext || detectCardContext(trimmed)
                    }
                }
                return next
            })
            setIsStreaming(false)
        } catch (error) {
            if (error.name === 'AbortError') {
                return
            }

            setMessages((prev) => {
                const next = [...prev]
                const lastIndex = next.length - 1
                if (lastIndex >= 0 && next[lastIndex].isStreaming) {
                    next[lastIndex] = {
                        role: 'assistant',
                        content: 'I apologize, but a connection error occurred. Please try again.',
                        source: 'smart-assist',
                        isStreaming: false,
                        cardContext: detectCardContext(trimmed)
                    }
                } else {
                    next.push({
                        role: 'assistant',
                        content: 'I apologize, but a connection error occurred. Please try again.',
                        source: 'smart-assist',
                        cardContext: detectCardContext(trimmed)
                    })
                }
                return next
            })
            setIsStreaming(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage(input)
    }

    const resetSession = () => {
        abortRef.current?.abort()
        abortRef.current = null
        setIsStreaming(false)
        setInput('')
        setShowHotlines(false)
        setMessages(createWelcomeMessages(user?.firstName))
    }

    const closeChatbot = () => {
        resetSession()
        setIsOpen(false)
    }

    const openChatbot = () => {
        setIsOpen(true)
    }

    const handleNavigate = (path) => {
        setIsOpen(false)
        navigate(path)
    }

    return (
        <>
            <button
                type="button"
                className={`chatbot-fab ${isOpen ? 'open' : ''}`}
                onClick={isOpen ? closeChatbot : openChatbot}
                aria-label={isOpen ? 'Close chatbot' : 'Open Barangay AI Assistant'}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                {!isOpen && <span className="chatbot-fab-label">AI Assistant</span>}
            </button>

            {isOpen && (
                <div className="chatbot-panel animate-fadeIn">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3>Barangay AI Assistant</h3>
                                <p className="chatbot-provider-tag">
                                    <Sparkles size={12} /> 24/7 Community Support
                                </p>
                            </div>
                        </div>

                        <div className="chatbot-header-actions">
                            <button
                                type="button"
                                className={`chatbot-hotline-toggle ${showHotlines ? 'active' : ''}`}
                                onClick={() => setShowHotlines(!showHotlines)}
                                title="Emergency Hotlines"
                            >
                                <PhoneCall size={14} />
                                <span>🚨 Hotlines</span>
                            </button>
                            <button
                                type="button"
                                className="chatbot-close"
                                onClick={closeChatbot}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Feature 3: Philippine Emergency Hotlines Floating Panel */}
                    {showHotlines && (
                        <div className="chatbot-hotlines-panel animate-fadeIn">
                            <div className="hotlines-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <AlertTriangle size={16} className="text-red-500" />
                                    <strong>Emergency Hotlines (Philippines / Basey, Samar)</strong>
                                </div>
                                <button type="button" className="hotlines-close-btn" onClick={() => setShowHotlines(false)}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="hotlines-list">
                                {EMERGENCY_HOTLINES.map((h, i) => {
                                    const IconComponent = h.icon
                                    return (
                                        <div key={i} className="hotline-card">
                                            <div className="hotline-icon-box" style={{ background: `${h.color}18`, color: h.color }}>
                                                <IconComponent size={18} />
                                            </div>
                                            <div className="hotline-details">
                                                <div className="hotline-title-row">
                                                    <span className="hotline-name">{h.name}</span>
                                                    <span className="hotline-badge">{h.badge}</span>
                                                </div>
                                                <span className="hotline-number">{h.number}</span>
                                                <span className="hotline-desc">{h.desc}</span>
                                            </div>
                                            <a href={h.tel} className="hotline-dial-btn" title={`Call ${h.number}`}>
                                                <PhoneCall size={14} />
                                                <span>Call</span>
                                            </a>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Messages Scroll Area */}
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div
                                key={`${msg.role}-${index}`}
                                className={`chatbot-message ${msg.role}`}
                            >
                                <div className={`chatbot-message-icon${msg.isStreaming && !msg.content ? ' thinking' : ''}`}>
                                    {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                                </div>
                                <div className="chatbot-message-content">
                                    <div
                                        className={`chatbot-message-bubble${msg.isStreaming ? ' streaming' : ''}${msg.isStreaming && !msg.content ? ' waiting' : ''}`}
                                    >
                                        {msg.content ? (
                                            <>
                                                <span
                                                    dangerouslySetInnerHTML={{ __html: formatReply(msg.content) }}
                                                />
                                                {msg.isStreaming && (
                                                    <span className="chatbot-stream-cursor" aria-hidden="true" />
                                                )}
                                            </>
                                        ) : msg.isStreaming ? (
                                            <TypingIndicator />
                                        ) : null}
                                    </div>

                                    {/* Feature 5: Document Requirement & Fee Checklist Card */}
                                    {msg.cardContext?.type === 'doc' && !msg.isStreaming && (
                                        <div className="chatbot-action-widget doc-widget animate-fadeIn">
                                            <div className="doc-widget-header">
                                                <FileText size={16} className="doc-widget-icon" />
                                                <div>
                                                    <h4>{msg.cardContext.data.title}</h4>
                                                    <span className="doc-widget-tag">{msg.cardContext.data.category}</span>
                                                </div>
                                            </div>

                                            <div className="doc-widget-meta">
                                                <div className="doc-meta-chip">
                                                    <DollarSign size={13} />
                                                    <span>Fee: <strong>{msg.cardContext.data.fee}</strong></span>
                                                </div>
                                                <div className="doc-meta-chip">
                                                    <Clock size={13} />
                                                    <span>Processing: <strong>{msg.cardContext.data.processingDays}</strong></span>
                                                </div>
                                            </div>

                                            <div className="doc-checklist">
                                                <span className="doc-checklist-title">📋 Required Documents:</span>
                                                <ul>
                                                    {msg.cardContext.data.requirements.map((req, rIdx) => (
                                                        <li key={rIdx}>
                                                            <CheckCircle2 size={13} className="text-green-600" />
                                                            <span>{req}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <button
                                                type="button"
                                                className="widget-action-btn"
                                                onClick={() => handleNavigate(msg.cardContext.data.path)}
                                            >
                                                <span>Request This Certificate Online</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Feature 2: In-Chat Complaint Filing Action Card */}
                                    {msg.cardContext?.type === 'complaint_action' && !msg.isStreaming && (
                                        <div className="chatbot-action-widget complaint-widget animate-fadeIn">
                                            <div className="complaint-widget-header">
                                                <span className="live-radar-dot"></span>
                                                <div>
                                                    <h4>File a Community Complaint</h4>
                                                    <span className="widget-subtitle">AI Report Writer & Satellite GPS Pinning</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="widget-action-btn complaint-btn"
                                                onClick={() => handleNavigate('/complaints/new')}
                                            >
                                                <span>🚀 Open AI Complaint Form</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Feature 2: Track Complaints Action Card */}
                                    {msg.cardContext?.type === 'track_action' && !msg.isStreaming && (
                                        <div className="chatbot-action-widget track-widget animate-fadeIn">
                                            <div className="track-widget-header">
                                                <Clock size={16} className="text-amber-600" />
                                                <div>
                                                    <h4>Complaints Status & Incident Map</h4>
                                                    <span className="widget-subtitle">View real-time status and Tanod dispatch</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="widget-action-btn track-btn"
                                                onClick={() => handleNavigate('/complaints')}
                                            >
                                                <span>📋 View My Complaints</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Feature 2: Services Directory Action Card */}
                                    {msg.cardContext?.type === 'services_action' && !msg.isStreaming && (
                                        <div className="chatbot-action-widget services-widget animate-fadeIn">
                                            <div className="services-widget-header">
                                                <FileText size={16} className="text-blue-600" />
                                                <div>
                                                    <h4>Barangay Services Directory</h4>
                                                    <span className="widget-subtitle">Official clearances, IDs, and certificates</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="widget-action-btn services-btn"
                                                onClick={() => handleNavigate('/services')}
                                            >
                                                <span>📑 Browse All Services</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts */}
                    <div className="chatbot-quick-prompts">
                        {QUICK_PROMPTS.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                className="chatbot-quick-btn"
                                onClick={() => sendMessage(prompt)}
                                disabled={isStreaming}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* Input Form with Voice Input Microphone */}
                    <form className="chatbot-input-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder={isListening ? 'Listening to your voice...' : 'Ask about complaints, certificates, hotlines...'}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isStreaming}
                        />

                        {/* Speech-to-Text Microphone Button */}
                        {window.webkitSpeechRecognition || window.SpeechRecognition ? (
                            <button
                                type="button"
                                className={`chatbot-mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={toggleVoiceInput}
                                title={isListening ? 'Stop recording voice' : 'Speak into microphone (Speech-to-Text)'}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                        ) : null}

                        <button
                            type="submit"
                            className="chatbot-send-btn"
                            disabled={isStreaming || !input.trim()}
                            aria-label="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}
