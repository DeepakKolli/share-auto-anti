const userService = require('../services/userService');

const register = async (req, res) => {
    try {
        const result = await userService.register(req.body);
        res.status(201).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const result = await userService.login(req.body);
        res.json({
            success: true,
            token: result.token,
            user: result.user
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login
};
