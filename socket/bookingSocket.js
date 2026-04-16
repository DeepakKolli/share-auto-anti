const bookingSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        /**
         * Join a specific pool room to receive seat updates.
         * Room format: pool_{poolId}
         */
        socket.on('join_pool_room', (poolId) => {
            if (poolId) {
                socket.join(`pool_${poolId}`);
                console.log(`[Socket] ${socket.id} joined pool_${poolId}`);
            }
        });

        /**
         * Leave a pool room.
         */
        socket.on('leave_pool_room', (poolId) => {
            if (poolId) {
                socket.leave(`pool_${poolId}`);
                console.log(`[Socket] ${socket.id} left pool_${poolId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
};

module.exports = bookingSocket;
