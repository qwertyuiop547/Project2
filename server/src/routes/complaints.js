const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireApproved, requireRole } = require('../middleware/auth');
const { isOfficial } = require('../utils/roles');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// Get all complaints (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { status, priority, category, search, page = 1, limit = 10 } = req.query;

        const where = {};

        if (req.user.role === 'RESIDENT') {
            where.userId = req.user.id;
        }

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category) where.categoryId = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [complaints, total] = await Promise.all([
            prisma.complaint.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    category: true,
                    _count: { select: { comments: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.complaint.count({ where })
        ]);

        const statsWhere = req.user.role === 'RESIDENT' ? { userId: req.user.id } : {};

        const stats = await prisma.complaint.groupBy({
            by: ['status'],
            where: statsWhere,
            _count: true
        });

        res.json({
            complaints: complaints.map(c => ({
                ...c,
                user: c.isAnonymous ? null : c.user,
                commentsCount: c._count.comments
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: stats.reduce((acc, s) => {
                acc[s.status.toLowerCase()] = s._count;
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ error: 'Failed to fetch complaints.' });
    }
});

// Get categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.complaintCategory.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// Get single complaint
router.get('/:id', auth, async (req, res) => {
    try {
        const isOfficialUser = isOfficial(req.user.role);

        const complaint = await prisma.complaint.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                category: true,
                comments: {
                    where: isOfficialUser ? undefined : { isInternal: false },
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, role: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                attachments: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        if (req.user.role === 'RESIDENT' && complaint.userId !== req.user.id) {
            return res.status(403).json({ error: 'You can only view your own complaints.' });
        }

        const isComplainant = complaint.userId === req.user.id;

        res.json({
            complaint: {
                ...complaint,
                user: complaint.isAnonymous ? null : complaint.user,
                statusHistory: isComplainant ? complaint.statusHistory : [],
                resolutionNotes: isComplainant ? complaint.resolutionNotes : null
            }
        });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ error: 'Failed to fetch complaint.' });
    }
});

// Create complaint
router.post('/', auth, requireApproved, [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').trim().notEmpty(),
    body('categoryId').notEmpty(),
], async (req, res) => {
    try {
        if (req.user.role !== 'RESIDENT') {
            return res.status(403).json({ error: 'Only residents can file complaints.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, location, categoryId, priority, isAnonymous } = req.body;

        const complaint = await prisma.complaint.create({
            data: {
                title,
                description,
                location,
                categoryId,
                priority: priority || 'MEDIUM',
                isAnonymous: isAnonymous || false,
                anonymousReference: isAnonymous ? `ANO-${crypto.randomBytes(4).toString('hex').toUpperCase()}` : null,
                userId: req.user.id
            },
            include: {
                category: true,
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        res.status(201).json({ complaint });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({ error: 'Failed to create complaint.' });
    }
});

// Update complaint status (officials only)
router.patch('/:id/status', auth, requireRole('SECRETARY', 'CHAIRMAN'), async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;

        const complaint = await prisma.complaint.findUnique({
            where: { id: req.params.id }
        });

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        const updateData = { status };

        if (status === 'RESOLVED') {
            updateData.resolvedAt = new Date();
            updateData.resolutionNotes = resolutionNotes;
        } else if (status === 'CLOSED') {
            updateData.closedAt = new Date();
        } else if (status === 'IN_PROGRESS' && !complaint.acceptedAt) {
            updateData.acceptedAt = new Date();
        }

        // Create status history
        await prisma.complaintStatusHistory.create({
            data: {
                complaintId: req.params.id,
                oldStatus: complaint.status,
                newStatus: status,
                notes: resolutionNotes
            }
        });

        const updated = await prisma.complaint.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                category: true,
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        res.json({ complaint: updated });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// Add comment
router.post('/:id/comments', auth, [
    body('content').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { content, isInternal } = req.body;

        const comment = await prisma.complaintComment.create({
            data: {
                content,
                isInternal: isInternal && isOfficial(req.user.role),
                complaintId: req.params.id,
                userId: req.user.id
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true }
                }
            }
        });

        res.status(201).json({ comment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
});

// Get my complaints
router.get('/my/list', auth, async (req, res) => {
    try {
        const complaints = await prisma.complaint.findMany({
            where: { userId: req.user.id },
            include: {
                category: true,
                _count: { select: { comments: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ complaints });
    } catch (error) {
        console.error('Get my complaints error:', error);
        res.status(500).json({ error: 'Failed to fetch complaints.' });
    }
});

module.exports = router;
