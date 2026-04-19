const jwt = require('jsonwebtoken');

/**
 * Socket.io middleware for JWT authentication
 */
const socketAuthMiddleware = (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];

    if (!token) {
        console.error('[Socket Auth] Denied: No token provided');
        return next(new Error('Authentication error: No token provided'));
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'fallback_secret');
        socket.user = decoded; // Attach user info to the socket
        next();
    } catch (err) {
        console.error('[Socket Auth] Denied: Invalid token');
        return next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = socketAuthMiddleware;
