const bookingService = require('../services/bookingService');
const Route = require('../models/Route');

const createBooking = async (req, res) => {
    try {
        const booking = await bookingService.createBooking(req.user.userId, req.body);
        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await bookingService.getMyBookings(req.user.userId);
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

const getRouteStatus = async (req, res) => {
    try {
        const { routeId } = req.params;
        const status = await bookingService.getRouteStatus(routeId);
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

const getAllRoutes = async (req, res) => {
    try {
        const routes = await Route.find({ isActive: true });
        res.json({
            success: true,
            data: routes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getRouteStatus,
    getAllRoutes
};
