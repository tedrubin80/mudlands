require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const winston = require('winston');
const rateLimit = require('express-rate-limit');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const app = express();

// Trust proxy for nginx
app.set('trust proxy', true);

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? [`https://${process.env.DOMAIN}`, `http://${process.env.DOMAIN}`]
            : ['*', `http://${process.env.DOMAIN}:${process.env.PORT}`, `https://${process.env.DOMAIN}:${process.env.PORT}`],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const redisClient = createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD || undefined
});

redisClient.connect().catch(err => {
    logger.error('Redis connection error:', err);
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [`https://${process.env.DOMAIN}`, `http://${process.env.DOMAIN}`]
        : ['*', `http://${process.env.DOMAIN}:${process.env.PORT}`, `https://${process.env.DOMAIN}:${process.env.PORT}`],
    credentials: true
}));

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api/', apiLimiter);

// Serve static files (but let specific routes take precedence)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,  // CHANGED: Allow session creation for anonymous users
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: 'lax'  // ADDED: Helps with CSRF protection
    },
    name: 'mudlands.sid'  // ADDED: Custom session name
}));

// CSRF Protection
const CSRFProtection = require('./src/middleware/csrf');
app.use(CSRFProtection.initializeToken);
app.get('/api/csrf-token', CSRFProtection.getToken);

// Initialize game components first
const GameEngine = require('./src/services/GameEngine');
const CommandParser = require('./src/services/CommandParser');
const SocketHandler = require('./src/services/SocketHandler');

const gameEngine = new GameEngine();
const commandParser = new CommandParser(gameEngine);
const socketHandler = new SocketHandler(io, gameEngine, commandParser);

// Admin routes BEFORE CSRF protection
const createAdminRouter = require('./src/routes/admin');
const adminRoutes = createAdminRouter(gameEngine);
const authRoutes = require('./src/routes/auth');
app.use('/api/admin', adminRoutes);

// Auth routes BEFORE CSRF protection (they have rate limiting instead)
app.use('/api/auth', authLimiter, authRoutes);

// Apply CSRF protection to other API routes (after admin and auth routes)
app.use('/api', CSRFProtection.verifyToken);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/roles', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-roles.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        players: gameEngine.getPlayerCount(),
        uptime: process.uptime()
    });
});

const characterRoutes = require('./src/routes/character');
const aiRoutes = require('./src/routes/ai');
const roleManagementRoutes = require('./src/routes/roleManagement');
const ErrorHandler = require('./src/middleware/errorHandler');
app.use('/api/character', authLimiter, characterRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/roles', roleManagementRoutes);

// Error handling middleware only for API routes
app.use('/api/*', ErrorHandler.handleNotFound);
app.use(ErrorHandler.handleError);

io.on('connection', (socket) => {
    console.log('Socket.IO connection received:', socket.id);
    logger.info('Socket.IO connection received', { socketId: socket.id });
    socketHandler.handleConnection(socket);
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Process-level error handling
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    gameEngine.shutdown();
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    gameEngine.shutdown();
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

server.listen(PORT, HOST, async () => {
    logger.info(`MUDlands Online server running on ${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Domain: ${process.env.DOMAIN}`);
    await gameEngine.initialize();
});