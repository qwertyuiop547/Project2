const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get published announcements (public)
router.get('/', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;

        const where = {
            status: 'PUBLISHED',
            OR: [
                { publishDate: null },
                { publishDate: { lte: new Date() } }
            ],
            AND: [
                {
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gte: new Date() } }
                    ]
                }
            ]
        };

        if (category) where.category = category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [announcements, total] = await Promise.all([
            prisma.announcement.findMany({
                where,
                include: {
                    createdBy: {
                        select: { firstName: true, lastName: true }
                    }
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { publishDate: 'desc' }
                ],
                skip,
                take: parseInt(limit)
            }),
            prisma.announcement.count({ where })
        ]);

        res.json({
            announcements,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ error: 'Failed to fetch announcements.' });
    }
});

// Get single announcement
router.get('/:id', async (req, res) => {
    try {
        const announcement = await prisma.announcement.findUnique({
            where: { id: req.params.id },
            include: {
                createdBy: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found.' });
        }

        res.json({ announcement });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch announcement.' });
    }
});

// Create announcement (officials only)
router.post('/', auth, requireRole('SECRETARY', 'CHAIRMAN'), [
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, category, status, isPinned, publishDate, expiryDate } = req.body;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                category,
                status: status || 'DRAFT',
                isPinned: isPinned || false,
                publishDate: publishDate ? new Date(publishDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                createdById: req.user.id
            }
        });

        res.status(201).json({ announcement });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement.' });
    }
});

// Update announcement
router.put('/:id', auth, requireRole('SECRETARY', 'CHAIRMAN'), async (req, res) => {
    try {
        const { title, content, category, status, isPinned, publishDate, expiryDate } = req.body;

        const announcement = await prisma.announcement.update({
            where: { id: req.params.id },
            data: {
                title,
                content,
                category,
                status,
                isPinned,
                publishDate: publishDate ? new Date(publishDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            }
        });

        res.json({ announcement });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ error: 'Failed to update announcement.' });
    }
});

// Delete announcement
router.delete('/:id', auth, requireRole('CHAIRMAN'), async (req, res) => {
    try {
        await prisma.announcement.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Announcement deleted.' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Failed to delete announcement.' });
    }
});

// Get all announcements for management (officials only)
router.get('/manage/all', auth, requireRole('SECRETARY', 'CHAIRMAN'), async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [announcements, total] = await Promise.all([
            prisma.announcement.findMany({
                where,
                include: {
                    createdBy: {
                        select: { firstName: true, lastName: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.announcement.count({ where })
        ]);

        res.json({
            announcements,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch announcements.' });
    }
});

module.exports = router;
