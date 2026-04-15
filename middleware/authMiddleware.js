const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No driver token provided.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'driver_secret_key');
        req.driverId = decoded.driverId; // Attach driverId to request
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired driver token.'
        });
    }
};

module.exports = authMiddleware;
