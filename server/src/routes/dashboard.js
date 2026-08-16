const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard stats (role-based)
router.get('/stats', auth, async (req, res) => {
    try {
        const { role, id: userId } = req.user;

        if (role === 'RESIDENT') {
            // Resident dashboard
            const [complaints, suggestions, notifications] = await Promise.all([
                prisma.complaint.groupBy({
                    by: ['status'],
                    where: { userId },
                    _count: true
                }),
                prisma.suggestion.count({ where: { userId } }),
                prisma.notification.count({ where: { userId, isRead: false } })
            ]);

            const complaintStats = complaints.reduce((acc, c) => {
                acc[c.status.toLowerCase()] = c._count;
                acc.total = (acc.total || 0) + c._count;
                return acc;
            }, {});

            return res.json({
                complaints: complaintStats,
                suggestions,
                unreadNotifications: notifications
            });
        }

        // Officials dashboard (Secretary/Chairman)
        const [
            userStats,
            complaintStats,
            suggestionStats,
            serviceStats,
            announcementStats
        ] = await Promise.all([
            prisma.user.groupBy({
                by: ['role', 'isApproved'],
                _count: true
            }),
            prisma.complaint.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.suggestion.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.serviceRequest.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.announcement.groupBy({
                by: ['status'],
                _count: true
            })
        ]);

        // Process stats
        const users = {
            total: userStats.reduce((acc, u) => acc + u._count, 0),
            pendingApproval: userStats
                .filter(u => !u.isApproved)
                .reduce((acc, u) => acc + u._count, 0),
            residents: userStats
                .filter(u => u.role === 'RESIDENT' && u.isApproved)
                .reduce((acc, u) => acc + u._count, 0)
        };

        const complaints = complaintStats.reduce((acc, c) => {
            acc[c.status.toLowerCase()] = c._count;
            acc.total = (acc.total || 0) + c._count;
            return acc;
        }, {});

        const suggestions = suggestionStats.reduce((acc, s) => {
            acc[s.status.toLowerCase()] = s._count;
            acc.total = (acc.total || 0) + s._count;
            return acc;
        }, {});

        const services = serviceStats.reduce((acc, s) => {
            acc[s.status.toLowerCase()] = s._count;
            acc.total = (acc.total || 0) + s._count;
            return acc;
        }, {});

        const announcements = announcementStats.reduce((acc, a) => {
            acc[a.status.toLowerCase()] = a._count;
            acc.total = (acc.total || 0) + a._count;
            return acc;
        }, {});

        // Resolution rate
        const resolved = complaints.resolved || 0;
        const total = complaints.total || 1;
        const resolutionRate = Math.round((resolved / total) * 100);

        res.json({
            users,
            complaints: { ...complaints, resolutionRate },
            suggestions,
            services,
            announcements
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
    }
});

// Get recent activity
router.get('/recent', auth, async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const limit = 10;

        if (role === 'RESIDENT') {
            const [complaints, suggestions] = await Promise.all([
                prisma.complaint.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true,
                        category: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }),
                prisma.suggestion.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        voteCount: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                })
            ]);

            return res.json({
                complaints,
                suggestions
            });
        }

        // Officials
        const [complaints, suggestions, requests] = await Promise.all([
            prisma.complaint.findMany({
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    category: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            }),
            prisma.suggestion.findMany({
                include: {
                    user: { select: { firstName: true, lastName: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            }),
            prisma.serviceRequest.findMany({
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    service: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            })
        ]);

        res.json({
            complaints: complaints.map(c => ({
                ...c,
                user: c.isAnonymous ? null : c.user
            })),
            suggestions: suggestions.map(s => ({
                ...s,
                user: s.isAnonymous ? null : s.user
            })),
            requests
        });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity.' });
    }
});

// Get pending approvals (chairman only)
router.get('/approvals', auth, requireRole('CHAIRMAN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { isApproved: false, isDeactivated: false },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                address: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending approvals.' });
    }
});

// Approve user
router.post('/approvals/:id/approve', auth, requireRole('CHAIRMAN'), async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isApproved: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isApproved: true
            }
        });

        res.json({ user, message: 'User approved successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve user.' });
    }
});

// Reject/Deactivate user
router.post('/approvals/:id/reject', auth, requireRole('CHAIRMAN'), async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.params.id },
            data: { isDeactivated: true }
        });

        res.json({ message: 'User rejected.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject user.' });
    }
});

module.exports = router;
