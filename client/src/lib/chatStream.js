function getAuthToken() {
    const stored = localStorage.getItem('auth-storage')
    if (!stored) {
        return null
    }

    try {
        const { state } = JSON.parse(stored)
        return state?.token || null
    } catch {
        return null
    }
}

function parseSseChunk(buffer) {
    const events = []
    const blocks = buffer.split('\n\n')
    const remainder = blocks.pop() || ''

    for (const block of blocks) {
        if (!block.trim()) {
            continue
        }

        let event = 'message'
        let data = ''

        for (const line of block.split('\n')) {
            if (line.startsWith('event:')) {
                event = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
                data += line.slice(5).trim()
            }
        }

        if (data) {
            try {
                events.push({ event, data: JSON.parse(data) })
            } catch {
                // Skip malformed SSE payloads.
            }
        }
    }

    return { events, remainder }
}

export async function streamChatMessage({ message, history, dialect = 'tagalog', onMeta, onToken, onDone, onError, signal }) {
    const token = getAuthToken()
    if (!token) {
        throw new Error('Not authenticated')
    }

    const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, history, dialect }),
        signal,
    })

    if (!response.ok) {
        let errorMessage = 'Chat stream failed'
        try {
            const payload = await response.json()
            errorMessage = payload.error || errorMessage
        } catch {
            // Ignore JSON parse errors for non-JSON responses.
        }
        throw new Error(errorMessage)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) {
            break
        }

        buffer += decoder.decode(value, { stream: true })
        const { events, remainder } = parseSseChunk(buffer)
        buffer = remainder

        for (const { event, data } of events) {
            if (event === 'meta') {
                onMeta?.(data)
            } else if (event === 'token') {
                onToken?.(data.text || '')
            } else if (event === 'done') {
                onDone?.(data)
            } else if (event === 'error') {
                onError?.(data.message || 'Chat stream failed')
            }
        }
    }
}
