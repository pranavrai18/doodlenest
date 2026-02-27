const jwt = require('jsonwebtoken');
const drawingEvents = require('./drawingEvents');
const chatEvents = require('./chatEvents');
const presenceEvents = require('./presenceEvents');

// Track users in rooms: Map<roomId, Map<socketId, userData>>
const roomUsers = new Map();

const initializeSocket = (io) => {
    // Socket.io JWT authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Initialize all event handlers
        presenceEvents(io, socket, roomUsers);
        drawingEvents(io, socket, roomUsers);
        chatEvents(io, socket, roomUsers);
    });
};

module.exports = initializeSocket;
