const Driver = require('../models/Driver');

const driverSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] New connection: ${socket.id}`);

        // 1. Driver goes online
        socket.on('driver_online', async (data) => {
            const { driverId } = data;
            if (!driverId) return;

            try {
                const driver = await Driver.findByIdAndUpdate(driverId, {
                    isOnline: true,
                    socketId: socket.id
                }, { new: true });

                if (driver && driver.currentRoute) {
                    socket.join(`route_${driver.currentRoute}`);
                    console.log(`[Socket] Driver ${driver.name} is online on route ${driver.currentRoute}`);
                }
            } catch (err) {
                console.error(`[Socket Error] Online sync failed: ${err.message}`);
            }
        });

        // 2. Driver subscribes to route
        socket.on('subscribe_route', async (data) => {
            const { driverId, routeId } = data;
            if (!driverId || !routeId) return;

            try {
                const driver = await Driver.findById(driverId);
                if (driver) {
                    // Leave old room if any
                    if (driver.currentRoute) {
                        socket.leave(`route_${driver.currentRoute}`);
                    }
                    
                    // Join new room
                    driver.currentRoute = routeId;
                    await driver.save();
                    socket.join(`route_${routeId}`);
                    
                    console.log(`[Socket] Driver ${driver.name} subscribed to route ${routeId}`);
                    socket.emit('route_subscribed', { success: true, routeId });
                }
            } catch (err) {
                console.error(`[Socket Error] Subscription failed: ${err.message}`);
            }
        });

        // 3. Disconnection handling
        socket.on('disconnect', async () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
            try {
                // Find driver by socketId and set offline
                await Driver.findOneAndUpdate(
                    { socketId: socket.id },
                    { isOnline: false, socketId: null }
                );
            } catch (err) {
                console.error(`[Socket Error] Offline sync failed: ${err.message}`);
            }
        });
    });
};

module.exports = driverSocket;
