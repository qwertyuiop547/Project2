import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'
import { streamChatMessage } from '../lib/chatStream'
import { useAuthStore } from '../lib/auth'
import './BarangayChatbot.css'

const QUICK_PROMPTS = [
    'Paano mag-file ng reklamo?',
    'Ano ang requirements ng Barangay Clearance?',
    'Paano ko makikita ang status ng reklamo ko?',
    'Anong mga serbisyo ang available?',
]

function formatReply(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')
}

function TypingIndicator() {
    return (
        <div className="chatbot-typing-indicator" aria-label="Sinusulat ang sagot">
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
            content: `Kumusta, ${firstName || 'kabarangay'}! Ako ang **Barangay AI Assistant**. Matutulungan kita sa reklamo, dokumento, at iba pang serbisyo ng portal. Ano ang maitutulong ko?`,
            source: 'portal-guide',
        },
    ]
}

export default function BarangayChatbot() {
    const { user } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [messages, setMessages] = useState(() => createWelcomeMessages(user?.firstName))
    const messagesEndRef = useRef(null)
    const abortRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isStreaming])

    useEffect(() => {
        return () => {
            abortRef.current?.abort()
        }
    }, [])

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

    const sendMessage = async (text) => {
        const trimmed = text.trim()
        if (!trimmed || isStreaming) {
            return
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
                        content: next[lastIndex].content || 'Walang natanggap na sagot. Subukan ulit.',
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
                        content: 'Pasensya na, may error sa chat. Subukan ulit mamaya.',
                        source: 'smart-assist',
                        isStreaming: false,
                    }
                } else {
                    next.push({
                        role: 'assistant',
                        content: 'Pasensya na, may error sa chat. Subukan ulit mamaya.',
                        source: 'smart-assist',
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
        setMessages(createWelcomeMessages(user?.firstName))
    }

    const closeChatbot = () => {
        resetSession()
        setIsOpen(false)
    }

    const openChatbot = () => {
        setIsOpen(true)
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
                {!isOpen && <span className="chatbot-fab-label">AI Tulong</span>}
            </button>

            {isOpen && (
                <div className="chatbot-panel">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3>Barangay AI Assistant</h3>
                                <p className="chatbot-provider-tag">
                                    <Sparkles size={12} /> Tagalog / English
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="chatbot-close"
                            onClick={closeChatbot}
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>

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
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

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

                    <form className="chatbot-input-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Magtanong tungkol sa reklamo, dokumento..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isStreaming}
                        />
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
