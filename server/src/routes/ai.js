const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireApproved } = require('../middleware/auth');
const { assistComplaint, chatWithAssistant, streamChatWithAssistant, buildPortalContext, isOllamaAvailable } = require('../services/ai');

const router = express.Router();
const prisma = new PrismaClient();

// Check which AI provider is active
router.get('/status', auth, async (req, res) => {
    const ollama = await isOllamaAvailable();
    let provider = 'smart-assist';

    if (process.env.OPENROUTER_API_KEY) provider = 'openrouter';
    else if (process.env.GEMINI_API_KEY) provider = 'gemini';
    else if (process.env.GROQ_API_KEY) provider = 'groq';
    else if (process.env.OPENAI_API_KEY) provider = 'openai';
    else if (ollama) provider = 'ollama';

    res.json({
        provider,
        ollamaAvailable: ollama,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasGroqKey: !!process.env.GROQ_API_KEY,
        hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        message: process.env.OPENROUTER_API_KEY
            ? `Gumagamit ng OpenRouter (${process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free'})`
            : process.env.GEMINI_API_KEY
                ? 'Gumagamit ng Google Gemini — libreng API'
                : process.env.GROQ_API_KEY
                    ? 'Gumagamit ng Groq — libreng API'
                    : process.env.OPENAI_API_KEY
                        ? 'Gumagamit ng OpenAI'
                        : ollama
                            ? 'Gumagamit ng Ollama — libreng local AI'
                            : 'Gumagamit ng Smart Assist — built-in, walang API key na kailangan',
    });
});

// AI Complaint Assistant — residents only
router.post('/complaint-assist', auth, requireApproved, [
    body('description').trim().notEmpty().isLength({ max: 5000 }),
    body('title').optional().trim().isLength({ max: 200 }),
    body('location').optional().trim().isLength({ max: 300 }),
], async (req, res) => {
    try {
        if (req.user.role !== 'RESIDENT') {
            return res.status(403).json({ error: 'Only residents can use the complaint assistant.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { description, title, location } = req.body;

        const categories = await prisma.complaintCategory.findMany({
            orderBy: { name: 'asc' },
        });

        const result = await assistComplaint({
            description,
            title,
            location,
            categories,
        });

        res.json({ suggestion: result });
    } catch (error) {
        console.error('Complaint assist route error:', error);
        res.status(500).json({ error: error.message || 'AI assistance failed.' });
    }
});

// Barangay Chatbot
router.post('/chat', auth, requireApproved, [
    body('message').trim().notEmpty().isLength({ max: 2000 }),
    body('history').optional().isArray({ max: 20 }),
    body('dialect').optional().isString().trim(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { message, history = [], dialect = 'tagalog' } = req.body;
        const { services, complaintStats, context } = await buildChatContext(req);

        const result = await chatWithAssistant({
            message,
            history,
            dialect,
            context,
            user: req.user,
            contextData: { services, complaintStats },
        });

        res.json(result);
    } catch (error) {
        console.error('Chat route error:', error);
        res.status(500).json({ error: error.message || 'Chat failed.' });
    }
});

async function buildChatContext(req) {
    const [services, categories, complaintGroups] = await Promise.all([
        prisma.service.findMany({
            select: {
                name: true,
                fee: true,
                processingDays: true,
                requirements: true,
            },
            orderBy: { name: 'asc' },
        }),
        prisma.complaintCategory.findMany({
            select: { name: true },
            orderBy: { name: 'asc' },
        }),
        req.user.role === 'RESIDENT'
            ? prisma.complaint.groupBy({
                by: ['status'],
                where: { userId: req.user.id },
                _count: true,
            })
            : Promise.resolve([]),
    ]);

    const complaintStats = complaintGroups.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count;
        return acc;
    }, {});

    const context = buildPortalContext({
        services,
        categories,
        user: req.user,
        complaintStats: req.user.role === 'RESIDENT' ? complaintStats : null,
    });

    return {
        services,
        complaintStats,
        context,
    };
}

// Barangay Chatbot — realtime streaming (SSE)
router.post('/chat/stream', auth, requireApproved, [
    body('message').trim().notEmpty().isLength({ max: 2000 }),
    body('history').optional().isArray({ max: 20 }),
    body('dialect').optional().isString().trim(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { message, history = [], dialect = 'tagalog' } = req.body;
        const { services, complaintStats, context } = await buildChatContext(req);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const sendEvent = (event, data) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        let closed = false;
        req.on('close', () => {
            closed = true;
        });

        for await (const chunk of streamChatWithAssistant({
            message,
            history,
            dialect,
            context,
            user: req.user,
            contextData: { services, complaintStats },
        })) {
            if (closed) {
                break;
            }

            if (chunk.type === 'meta') {
                sendEvent('meta', { source: chunk.source });
            } else if (chunk.type === 'token') {
                sendEvent('token', { text: chunk.text });
            } else if (chunk.type === 'done') {
                sendEvent('done', { source: chunk.source });
            }
        }

        if (!closed) {
            res.end();
        }
    } catch (error) {
        console.error('Chat stream route error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Chat stream failed.' });
            return;
        }

        res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'Chat stream failed.' })}\n\n`);
        res.end();
    }
});

module.exports = router;
