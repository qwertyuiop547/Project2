const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, requireApproved, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get service categories with services
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            include: {
                services: true
            },
            orderBy: { name: 'asc' }
        });

        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// Get all services
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        const where = {};
        if (category) where.categoryId = category;

        const services = await prisma.service.findMany({
            where,
            include: {
                category: true
            },
            orderBy: { name: 'asc' }
        });

        res.json({ services });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch services.' });
    }
});

// Get single service
router.get('/:id', async (req, res) => {
    try {
        const service = await prisma.service.findUnique({
            where: { id: req.params.id },
            include: {
                category: true
            }
        });

        if (!service) {
            return res.status(404).json({ error: 'Service not found.' });
        }

        res.json({ service });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch service.' });
    }
});

// Request service
router.post('/:id/request', auth, requireApproved, async (req, res) => {
    try {
        const { purpose, quantity, contactNumber, address, notes } = req.body;

        if (!purpose || !purpose.trim()) {
            return res.status(400).json({ error: 'Purpose is required.' });
        }

        const parsedQuantity = parseInt(quantity, 10);
        const safeQuantity = Number.isInteger(parsedQuantity) && parsedQuantity > 0
            ? parsedQuantity
            : 1;

        const service = await prisma.service.findUnique({
            where: { id: req.params.id }
        });

        if (!service) {
            return res.status(404).json({ error: 'Service not found.' });
        }

        const request = await prisma.serviceRequest.create({
            data: {
                serviceId: req.params.id,
                userId: req.user.id,
                purpose: purpose.trim(),
                quantity: safeQuantity,
                contactNumber: contactNumber?.trim() || null,
                address: address?.trim() || null,
                notes: notes?.trim() || null
            },
            include: {
                service: {
                    include: { category: true }
                }
            }
        });

        res.status(201).json({ request });
    } catch (error) {
        console.error('Request service error:', error);
        res.status(500).json({ error: 'Failed to create request.' });
    }
});

// Get my service requests
router.get('/requests/my', auth, async (req, res) => {
    try {
        const requests = await prisma.serviceRequest.findMany({
            where: { userId: req.user.id },
            include: {
                service: {
                    include: { category: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests.' });
    }
});

// Get all requests (officials)
router.get('/requests/all', auth, requireRole('SECRETARY', 'CHAIRMAN'), async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [requests, total] = await Promise.all([
            prisma.serviceRequest.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    service: {
                        include: { category: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.serviceRequest.count({ where })
        ]);

        res.json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests.' });
    }
});

// Update request status
router.patch('/requests/:id/status', auth, requireRole('SECRETARY', 'CHAIRMAN'), async (req, res) => {
    try {
        const { status, notes } = req.body;

        const updateData = { status };
        if (notes) updateData.notes = notes;
        if (status === 'COMPLETED') updateData.completedAt = new Date();

        const request = await prisma.serviceRequest.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                service: true,
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        res.json({ request });
    } catch (error) {
        console.error('Update request status error:', error);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

module.exports = router;
