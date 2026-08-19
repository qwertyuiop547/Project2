const express = require('express');
const { auth, requireApproved } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - Get current user's notifications & unread count
router.get('/', auth, requireApproved, async (req, res) => {
    try {
        const userId = req.user.id;
        const prisma = req.prisma;

        let notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Seed default initial notifications if empty for a warm, engaging experience
        if (notifications.length === 0) {
            const initialData = [
                {
                    userId,
                    title: 'Maligayang Pagdating!',
                    message: 'Maligayang pagdating sa opisyal na Barangay Burgos Portal. Maaari ka nang mag-file ng reklamo at mag-request ng certificates.',
                    type: 'SYSTEM',
                    link: '/dashboard',
                    isRead: false,
                },
                {
                    userId,
                    title: 'Available na ang E-Services',
                    message: 'Maaari ka nang mag-request ng Barangay Clearance, Certificate of Indigency, at Barangay ID online.',
                    type: 'SERVICES',
                    link: '/services',
                    isRead: false,
                },
                {
                    userId,
                    title: '24/7 AI Captain at Emergency Hotlines',
                    message: 'Subukan ang bagong Multi-Dialect AI Chatbot para sa mabilisang pagsagot sa inyong mga katanungan.',
                    type: 'AI_ASSIST',
                    link: '/dashboard',
                    isRead: false,
                }
            ];

            await prisma.notification.createMany({
                data: initialData
            });

            notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 20
            });
        }

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', auth, requireApproved, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const prisma = req.prisma;

        const notification = await prisma.notification.findFirst({
            where: { id, userId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({ notification: updated, unreadCount });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', auth, requireApproved, async (req, res) => {
    try {
        const userId = req.user.id;
        const prisma = req.prisma;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true, unreadCount: 0 });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', auth, requireApproved, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const prisma = req.prisma;

        const notification = await prisma.notification.findFirst({
            where: { id, userId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.delete({
            where: { id }
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({ success: true, unreadCount });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
