import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
    MessageCircle, X, Send, Bot, User, Sparkles, PhoneCall, ShieldAlert, 
    FileText, CheckCircle2, Clock, DollarSign, ArrowRight, ExternalLink,
    Flame, Siren, Ambulance, Building2, Mic, MicOff, AlertTriangle,
    MapPin, Tag, AlertCircle, Volume2, VolumeX, Languages, Radio
} from 'lucide-react'
import api from '../lib/api'
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

// Dialect Configurations & Speech Locales
const DIALECT_OPTIONS = [
    { id: 'tagalog', label: 'Tagalog', speechLang: 'fil-PH' },
    { id: 'english', label: 'English', speechLang: 'en-PH' },
    { id: 'bisaya', label: 'Bisaya', speechLang: 'ceb-PH' },
    { id: 'waray', label: 'Waray', speechLang: 'fil-PH' },
]

const QUICK_PROMPTS = {
    tagalog: [
        'Paano mag-file ng reklamo?',
        'Saan na ang reklamo ko?',
        'Barangay Clearance requirements?',
        'Emergency hotlines list',
    ],
    english: [
        'How to file a complaint?',
        'Check my complaint status',
        'Barangay Clearance requirements?',
        'Emergency hotlines list',
    ],
    bisaya: [
        'Unsaon pag-file ug reklamo?',
        'Status sa akong reklamo?',
        'Requirements sa Barangay Clearance?',
        'Listahan sa Emergency hotlines',
    ],
    waray: [
        'Pano mag-file hin reklamo?',
        'Status han akon reklamo?',
        'Requirements han Barangay Clearance?',
        'Emergency hotlines list',
    ],
}

function formatReply(text) {
    return (text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')
}

function stripMarkdown(text) {
    return (text || '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/•/g, '')
        .replace(/#/g, '')
        .replace(/\n+/g, '. ')
        .trim()
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

function createWelcomeMessages(firstName, dialect = 'tagalog') {
    let content = `Kumusta, ${firstName || 'Resident'}! Ako ang iyong **Barangay AI Assistant**. Matutulungan kita sa pag-file ng reklamo, requirements ng clearances/IDs, at emergency hotlines. Ano ang maitutulong ko sa iyo?`
    
    if (dialect === 'english') {
        content = `Hello, ${firstName || 'Resident'}! I am your **Barangay AI Assistant**. I can assist you with filing complaints, checking certificate requirements, tracking reports, or connecting to emergency hotlines. What can I assist you with today?`
    } else if (dialect === 'bisaya') {
        content = `Maayong adlaw, ${firstName || 'residente'}! Ako ang imong **Barangay AI Assistant**. Andam ko motabang nimo sa pag-file ug reklamo, requirements sa mga dokumento, ug emergency hotlines. Unsay akong ika-alagad nimo karon?`
    } else if (dialect === 'waray') {
        content = `Maupay nga adlaw, ${firstName || 'residente'}! Ako an imo **Barangay AI Assistant**. Andam ako bumulig ha pag-file hin reklamo, mga sertipiko/IDs, ngan emergency hotlines. Ano an akon maibubulig ha imo yana?`
    }

    return [
        {
            role: 'assistant',
            content,
            source: 'portal-guide',
        },
    ]
}

export default function BarangayChatbot() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [showHotlines, setShowHotlines] = useState(false)
    const [dialect, setDialect] = useState('tagalog')
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [speakingIndex, setSpeakingIndex] = useState(null)
    const [messages, setMessages] = useState(() => createWelcomeMessages(user?.firstName, 'tagalog'))
    const messagesEndRef = useRef(null)
    const abortRef = useRef(null)
    const recognitionRef = useRef(null)

    // Fetch user's active complaints for live in-chat tracking
    const { data: userComplaints = [] } = useQuery({
        queryKey: ['my-chatbot-complaints', user?.id],
        queryFn: async () => {
            const { data } = await api.get('/complaints?limit=3')
            return data.complaints || []
        },
        enabled: !!user && isOpen
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isStreaming, showHotlines])

    // Speech Recognition setup with dynamic dialect language
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = false

            const currentOption = DIALECT_OPTIONS.find(d => d.id === dialect)
            recognition.lang = currentOption?.speechLang || 'fil-PH'

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript
                setInput(transcript)
                setIsListening(false)
            }

            recognition.onerror = (e) => {
                console.warn('Speech recognition error:', e)
                setIsListening(false)
            }
            recognition.onend = () => setIsListening(false)
            recognitionRef.current = recognition
        }

        return () => {
            abortRef.current?.abort()
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel()
            }
        }
    }, [dialect])

    // Text-to-Speech (TTS Audio Playback)
    const toggleSpeech = (text, index) => {
        if (!('speechSynthesis' in window)) return

        if (speakingIndex === index) {
            window.speechSynthesis.cancel()
            setSpeakingIndex(null)
            return
        }

        window.speechSynthesis.cancel()
        const cleanText = stripMarkdown(text)
        if (!cleanText) return

        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = dialect === 'english' ? 'en-PH' : 'fil-PH'
        utterance.rate = 1.0
        utterance.pitch = 1.0

        utterance.onend = () => setSpeakingIndex(null)
        utterance.onerror = () => setSpeakingIndex(null)

        setSpeakingIndex(index)
        window.speechSynthesis.speak(utterance)
    }

    const handleDialectChange = (newDialect) => {
        setDialect(newDialect)
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel()
        }
        setSpeakingIndex(null)
    }

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) return

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            try {
                const currentOption = DIALECT_OPTIONS.find(d => d.id === dialect)
                recognitionRef.current.lang = currentOption?.speechLang || 'fil-PH'
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

    // Detect matched action cards or document requirements
    const detectCardContext = (text) => {
        const lower = (text || '').toLowerCase()
        if (lower.includes('indigency') || lower.includes('indigent') || lower.includes('kalisod') || lower.includes('kapobre')) {
            return { type: 'doc', data: DOCUMENT_CARDS.indigency }
        }
        if (lower.includes('clearance') && !lower.includes('business')) {
            return { type: 'doc', data: DOCUMENT_CARDS.clearance }
        }
        if (lower.includes('barangay id') || lower.includes('resident id') || lower.includes('brgy id')) {
            return { type: 'doc', data: DOCUMENT_CARDS.id }
        }
        if (lower.includes('business') || lower.includes('permit') || lower.includes('commercial')) {
            return { type: 'doc', data: DOCUMENT_CARDS.business }
        }
        if (lower.includes('complaint') || lower.includes('reklamo') || lower.includes('file a complaint') || lower.includes('incident') || lower.includes('sumbong')) {
            return { type: 'complaint_action' }
        }
        if (lower.includes('status') || lower.includes('track') || lower.includes('subaybay') || lower.includes('kumusta') || lower.includes('hain na')) {
            return { type: 'track_action' }
        }
        if (lower.includes('service') || lower.includes('serbisyo') || lower.includes('certificate') || lower.includes('sertipiko')) {
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

        if (window.speechSynthesis) {
            window.speechSynthesis.cancel()
        }
        setSpeakingIndex(null)

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
                dialect,
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
                const fallbackErr = dialect === 'waray'
                    ? 'Pasayloa, may problema ha koneksyon. Alayon pag-utro pag-submit.'
                    : dialect === 'bisaya'
                    ? 'Pasayloa, naay problema sa koneksyon. Palihog sulayi pag-usab.'
                    : dialect === 'english'
                    ? 'I apologize, but a connection error occurred. Please try again.'
                    : 'Paumanhin, nagkaroon ng problema sa koneksyon. Pakisubukan muli.'

                if (lastIndex >= 0 && next[lastIndex].isStreaming) {
                    next[lastIndex] = {
                        role: 'assistant',
                        content: fallbackErr,
                        source: 'smart-assist',
                        isStreaming: false,
                        cardContext: detectCardContext(trimmed)
                    }
                } else {
                    next.push({
                        role: 'assistant',
                        content: fallbackErr,
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
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel()
        }
        setSpeakingIndex(null)
        setIsStreaming(false)
        setInput('')
        setShowHotlines(false)
        setMessages(createWelcomeMessages(user?.firstName, dialect))
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

    const activeQuickPrompts = QUICK_PROMPTS[dialect] || QUICK_PROMPTS.tagalog

    return (
        <>
            <button
                type="button"
                className={`chatbot-fab ${isOpen ? 'open' : ''}`}
                onClick={isOpen ? closeChatbot : openChatbot}
                aria-label={isOpen ? 'Close chatbot' : 'Open Barangay AI Assistant'}
            >
                {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
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
                                    <Sparkles size={12} /> 24/7 Voice & Multi-Dialect
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

                    {/* Dialect Selector Bar */}
                    <div className="chatbot-dialect-bar">
                        <div className="chatbot-dialect-label">
                            <Languages size={13} />
                            <span>Wika / Dialect:</span>
                        </div>
                        <div className="chatbot-dialect-pills">
                            {DIALECT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`chatbot-dialect-pill ${dialect === opt.id ? 'active' : ''}`}
                                    onClick={() => handleDialectChange(opt.id)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Emergency Hotlines Accordion View */}
                    {showHotlines && (
                        <div className="chatbot-hotlines-drawer animate-fadeIn">
                            <div className="hotlines-drawer-header">
                                <div className="hotlines-drawer-title">
                                    <AlertTriangle size={16} className="text-red-500" />
                                    <span>Basey & National Emergency Hotlines (24/7)</span>
                                </div>
                                <button
                                    type="button"
                                    className="hotlines-close-btn"
                                    onClick={() => setShowHotlines(false)}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="hotlines-grid">
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

                                    {/* Text-to-Speech (Audio Voice Readout) Button for Assistant Messages */}
                                    {msg.role === 'assistant' && msg.content && !msg.isStreaming && 'speechSynthesis' in window && (
                                        <div className="chatbot-tts-row">
                                            <button
                                                type="button"
                                                className={`chatbot-tts-btn ${speakingIndex === index ? 'speaking' : ''}`}
                                                onClick={() => toggleSpeech(msg.content, index)}
                                                title={speakingIndex === index ? 'Itigil ang pagsasalita' : 'Pakinggan ang sagot (Audio Narration)'}
                                            >
                                                {speakingIndex === index ? (
                                                    <>
                                                        <VolumeX size={13} />
                                                        <span>Itigil</span>
                                                        <span className="tts-pulse-dot" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Volume2 size={13} />
                                                        <span>Pakinggan (Voice)</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

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

                                    {/* Feature 2: Live Resident Complaint Status Tracker Card */}
                                    {msg.cardContext?.type === 'track_action' && !msg.isStreaming && (
                                        <div className="chatbot-action-widget track-widget animate-fadeIn">
                                            <div className="track-widget-header">
                                                <Clock size={16} className="text-amber-600" />
                                                <div>
                                                    <h4>Live Complaint Status Tracker</h4>
                                                    <span className="widget-subtitle">Real-time status of your active reports</span>
                                                </div>
                                            </div>

                                            {userComplaints.length > 0 ? (
                                                <div className="inchat-complaints-list">
                                                    {userComplaints.slice(0, 2).map((c) => (
                                                        <div key={c.id} className="inchat-complaint-item" onClick={() => handleNavigate(`/complaints/${c.id}`)}>
                                                            <div className="inchat-complaint-row">
                                                                <span className="inchat-complaint-title">{c.title}</span>
                                                                <span className={`inchat-status-badge badge-${c.status?.toLowerCase().replace('_', '-')}`}>
                                                                    {c.status}
                                                                </span>
                                                            </div>
                                                            <div className="inchat-complaint-meta">
                                                                {c.category?.name && <span>🏷️ {c.category.name}</span>}
                                                                {c.location && <span>📍 {c.location.split('[')[0]}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ margin: '4px 0', fontSize: '0.78rem', color: '#6b7280' }}>
                                                    You currently have no complaints filed under your account.
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                                <button
                                                    type="button"
                                                    className="widget-action-btn track-btn"
                                                    style={{ flex: 1 }}
                                                    onClick={() => handleNavigate('/complaints')}
                                                >
                                                    <span>📋 View All Complaints</span>
                                                    <ArrowRight size={14} />
                                                </button>
                                                {userComplaints.length === 0 && (
                                                    <button
                                                        type="button"
                                                        className="widget-action-btn complaint-btn"
                                                        onClick={() => handleNavigate('/complaints/new')}
                                                    >
                                                        <span>🚀 File New</span>
                                                    </button>
                                                )}
                                            </div>
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
                        {activeQuickPrompts.map((prompt) => (
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

                    {/* Voice Recording Active Floating Wave */}
                    {isListening && (
                        <div className="chatbot-listening-banner animate-fadeIn">
                            <Radio size={15} className="listening-radio-icon" />
                            <span>Nakikinig... Magsalita nang malinaw sa micropono</span>
                            <div className="sound-wave-bars">
                                <span className="wave-bar bar-1"></span>
                                <span className="wave-bar bar-2"></span>
                                <span className="wave-bar bar-3"></span>
                                <span className="wave-bar bar-4"></span>
                            </div>
                        </div>
                    )}

                    {/* Input Form with Voice Input Microphone */}
                    <form className="chatbot-input-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder={isListening ? 'Nakikinig sa iyong boses...' : `Magtanong sa ${DIALECT_OPTIONS.find(d => d.id === dialect)?.label || 'Tagalog'}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isStreaming}
                        />

                        {/* Speech-to-Text Microphone Button */}
                        {typeof window !== 'undefined' && (window.webkitSpeechRecognition || window.SpeechRecognition) ? (
                            <button
                                type="button"
                                className={`chatbot-mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={toggleVoiceInput}
                                title={isListening ? 'Stop recording voice' : `Speak in ${DIALECT_OPTIONS.find(d => d.id === dialect)?.label || 'Tagalog'} (Speech-to-Text)`}
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
