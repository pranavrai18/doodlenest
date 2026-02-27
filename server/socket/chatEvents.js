const Message = require('../models/Message');

module.exports = (io, socket, roomUsers) => {
    // Send message
    socket.on('send-message', async (data) => {
        const { roomId, text, sender, senderId } = data;

        const messageData = {
            roomId,
            text,
            senderName: sender,
            sender: senderId,
            timestamp: new Date()
        };

        // Broadcast to room
        io.to(roomId).emit('receive-message', {
            ...messageData,
            _id: Date.now().toString()
        });

        // Persist to MongoDB
        try {
            await Message.create({
                roomId,
                sender: senderId,
                senderName: sender,
                text
            });
        } catch (err) {
            console.error('Error saving message:', err.message);
        }
    });

    // Load chat history
    socket.on('load-messages', async (data) => {
        const { roomId } = data;
        try {
            const messages = await Message.find({ roomId })
                .sort({ createdAt: 1 })
                .limit(100)
                .lean();
            socket.emit('messages-loaded', messages);
        } catch (err) {
            console.error('Error loading messages:', err.message);
            socket.emit('messages-loaded', []);
        }
    });
};
