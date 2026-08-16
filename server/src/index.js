require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const suggestionsRoutes = require('./routes/suggestions');
const announcementsRoutes = require('./routes/announcements');
const servicesRoutes = require('./routes/services');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const { warmUpOllama } = require('./services/ai');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make prisma available to routes
app.use((req, res, next) => {
    req.prisma = prisma;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const path = require('path');
const fs = require('fs');

// Serve client static build in production or when client/dist exists
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (typeof warmUpOllama === 'function') {
        warmUpOllama().catch(() => {});
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
