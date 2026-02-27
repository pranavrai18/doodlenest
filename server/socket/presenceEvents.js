module.exports = (io, socket, roomUsers) => {
    // User joins room
    socket.on('join-room', (data) => {
        const { roomId, userId, username } = data;
        socket.join(roomId);

        // Track user in room
        if (!roomUsers.has(roomId)) {
            roomUsers.set(roomId, new Map());
        }
        roomUsers.get(roomId).set(socket.id, { userId, username, socketId: socket.id });

        // Notify room about new user
        const users = Array.from(roomUsers.get(roomId).values());
        io.to(roomId).emit('users-in-room', users);
        socket.to(roomId).emit('user-joined', { userId, username });

        // Store roomId on socket for disconnect
        socket.roomId = roomId;
        socket.userId = userId;
        socket.username = username;

        console.log(`${username} joined room ${roomId}`);
    });

    // Request current user list (called when Users tab opens)
    socket.on('get-users', (data) => {
        const { roomId } = data;
        if (roomUsers.has(roomId)) {
            const users = Array.from(roomUsers.get(roomId).values());
            socket.emit('users-in-room', users);
        } else {
            socket.emit('users-in-room', []);
        }
    });

    // User leaves room
    socket.on('leave-room', (data) => {
        const { roomId, username } = data;
        socket.leave(roomId);

        if (roomUsers.has(roomId)) {
            roomUsers.get(roomId).delete(socket.id);
            const users = Array.from(roomUsers.get(roomId).values());
            io.to(roomId).emit('users-in-room', users);
            socket.to(roomId).emit('user-left', { username });

            if (roomUsers.get(roomId).size === 0) {
                roomUsers.delete(roomId);
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        const username = socket.username;

        if (roomId && roomUsers.has(roomId)) {
            roomUsers.get(roomId).delete(socket.id);
            const users = Array.from(roomUsers.get(roomId).values());
            io.to(roomId).emit('users-in-room', users);
            if (username) {
                socket.to(roomId).emit('user-left', { username });
            }

            if (roomUsers.get(roomId).size === 0) {
                roomUsers.delete(roomId);
            }
        }

        console.log(`Socket disconnected: ${socket.id}`);
    });

    // WebRTC signaling for screen share
    socket.on('screen-share-offer', (data) => {
        const { roomId, offer, senderId } = data;
        socket.to(roomId).emit('screen-share-offer', { offer, senderId });
    });

    socket.on('screen-share-answer', (data) => {
        const { roomId, answer, senderId, targetId } = data;
        io.to(targetId).emit('screen-share-answer', { answer, senderId });
    });

    socket.on('screen-share-ice-candidate', (data) => {
        const { roomId, candidate, senderId } = data;
        socket.to(roomId).emit('screen-share-ice-candidate', { candidate, senderId });
    });

    socket.on('screen-share-stop', (data) => {
        const { roomId } = data;
        socket.to(roomId).emit('screen-share-stop');
    });

    // File shared notification
    socket.on('file-shared', (data) => {
        const { roomId, fileData } = data;
        socket.to(roomId).emit('file-shared', fileData);
    });
};
