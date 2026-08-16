const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireApproved, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all suggestions
router.get('/', async (req, res) => {
    try {
        const { status, sort = 'votes', search, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const orderBy = sort === 'recent'
            ? { createdAt: 'desc' }
            : { voteCount: 'desc' };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [suggestions, total, stats] = await Promise.all([
            prisma.suggestion.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    _count: { select: { votes: true } }
                },
                orderBy,
                skip,
                take: parseInt(limit)
            }),
            prisma.suggestion.count({ where }),
            prisma.suggestion.groupBy({
                by: ['status'],
                _count: true
            })
        ]);

        res.json({
            suggestions: suggestions.map(s => ({
                ...s,
                user: s.isAnonymous ? null : s.user
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: {
                total,
                pending: stats.find(s => s.status === 'PENDING')?._count || 0,
                approved: stats.find(s => s.status === 'APPROVED')?._count || 0
            }
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions.' });
    }
});

// Get single suggestion
router.get('/:id', async (req, res) => {
    try {
        const suggestion = await prisma.suggestion.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                },
                votes: {
                    select: { userId: true }
                }
            }
        });

        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found.' });
        }

        res.json({
            suggestion: {
                ...suggestion,
                user: suggestion.isAnonymous ? null : suggestion.user
            }
        });
    } catch (error) {
        console.error('Get suggestion error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestion.' });
    }
});

// Create suggestion
router.post('/', auth, requireApproved, [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').trim().notEmpty()
], async (req, res) => {
    try {
        if (req.user.role !== 'RESIDENT') {
            return res.status(403).json({ error: 'Only residents can submit suggestions.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, category, isAnonymous } = req.body;

        const suggestion = await prisma.suggestion.create({
            data: {
                title,
                description,
                category,
                isAnonymous: isAnonymous || false,
                userId: req.user.id
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        res.status(201).json({ suggestion });
    } catch (error) {
        console.error('Create suggestion error:', error);
        res.status(500).json({ error: 'Failed to create suggestion.' });
    }
});

// Vote/Unvote
router.post('/:id/vote', auth, requireApproved, async (req, res) => {
    try {
        // Only residents can vote (not officials)
        if (req.user.role !== 'RESIDENT') {
            return res.status(403).json({ error: 'Only residents can vote.' });
        }

        const suggestionId = req.params.id;
        const userId = req.user.id;

        // Check if already voted
        const existingVote = await prisma.suggestionVote.findUnique({
            where: {
                suggestionId_userId: { suggestionId, userId }
            }
        });

        if (existingVote) {
            // Unvote
            await prisma.suggestionVote.delete({
                where: { id: existingVote.id }
            });

            const suggestion = await prisma.suggestion.update({
                where: { id: suggestionId },
                data: { voteCount: { decrement: 1 } }
            });

            return res.json({ voted: false, voteCount: suggestion.voteCount });
        } else {
            // Vote
            await prisma.suggestionVote.create({
                data: { suggestionId, userId }
            });

            const suggestion = await prisma.suggestion.update({
                where: { id: suggestionId },
                data: { voteCount: { increment: 1 } }
            });

            return res.json({ voted: true, voteCount: suggestion.voteCount });
        }
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Failed to process vote.' });
    }
});

// Update status (chairman only)
router.patch('/:id/status', auth, requireRole('CHAIRMAN'), async (req, res) => {
    try {
        const { status } = req.body;

        const suggestion = await prisma.suggestion.update({
            where: { id: req.params.id },
            data: {
                status,
                reviewedAt: new Date()
            }
        });

        res.json({ suggestion });
    } catch (error) {
        console.error('Update suggestion status error:', error);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// Get my suggestions
router.get('/my/list', auth, async (req, res) => {
    try {
        const suggestions = await prisma.suggestion.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ suggestions });
    } catch (error) {
        console.error('Get my suggestions error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions.' });
    }
});

// Get user's voted suggestions
router.get('/my/votes', auth, async (req, res) => {
    try {
        const votes = await prisma.suggestionVote.findMany({
            where: { userId: req.user.id },
            select: { suggestionId: true }
        });

        res.json({ votedIds: votes.map(v => v.suggestionId) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch votes.' });
    }
});

module.exports = router;
