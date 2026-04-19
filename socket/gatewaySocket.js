const gatewaySocket = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`[Socket Gateway] Authenticated user connected: ${userId} (${socket.id})`);

        /**
         * 1. Join Pool Room
         * Room format: pool:{id}
         */
        socket.on('join_pool', (poolId) => {
            if (!poolId) return;
            socket.join(`pool:${poolId}`);
            console.log(`[Socket Gateway] ${userId} joined pool:${poolId}`);
            
            // Send initial acknowledgment
            socket.emit('joined_pool', { success: true, poolId });
        });

        /**
         * 2. Join Route Room (For Drivers)
         * Room format: route:{id}
         */
        socket.on('join_route', (routeId) => {
            if (!routeId) return;
            socket.join(`route:${routeId}`);
            console.log(`[Socket Gateway] Driver ${userId} joined route:${routeId}`);
            socket.emit('joined_route', { success: true, routeId });
        });

        /**
         * 3. Driver Location Broadcast
         * Data: { poolId, coords: { lat, lng } }
         * Note: Throttled at source (frontend) every 5-10 seconds
         */
        socket.on('driver_location', (data) => {
            const { poolId, coords } = data;
            if (!poolId || !coords) return;

            // Broadcast to all users in the pool room (except sender if needed)
            io.to(`pool:${poolId}`).emit('location_update', {
                driverId: userId,
                coords,
                timestamp: new Date()
            });
            
            console.log(`[Socket Gateway] Location broadcasted for pool:${poolId}`);
        });

        /**
         * 4. Leave Room
         */
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            console.log(`[Socket Gateway] ${userId} left ${roomName}`);
        });

        /**
         * 5. Disconnection
         */
        socket.on('disconnect', () => {
            console.log(`[Socket Gateway] User ${userId} disconnected`);
        });
    });
};

module.exports = gatewaySocket;
