const WhiteboardSession = require('../models/WhiteboardSession');

module.exports = (io, socket, roomUsers) => {
    // Live drawing - stream start point immediately (volatile = skip if slow)
    socket.on('draw-start', (data) => {
        socket.to(data.roomId).volatile.emit('draw-start', data);
    });

    // Live drawing - stream each point instantly as user draws
    socket.on('draw-move', (data) => {
        socket.to(data.roomId).volatile.emit('draw-move', data);
    });

    // Stroke complete - persist to MongoDB (no re-broadcast, already streamed live)
    socket.on('draw-stroke', async (data) => {
        const { roomId, stroke } = data;

        try {
            await WhiteboardSession.findOneAndUpdate(
                { roomId },
                { $push: { strokes: stroke } },
                { upsert: true }
            );
        } catch (err) {
            console.error('Error saving stroke:', err.message);
        }
    });

    // Erase
    socket.on('erase', (data) => {
        const { roomId, eraseData } = data;
        socket.to(roomId).emit('erase', eraseData);
    });

    // Clear board (host only)
    socket.on('clear-board', async (data) => {
        const { roomId } = data;
        io.to(roomId).emit('clear-board');

        try {
            await WhiteboardSession.findOneAndUpdate(
                { roomId },
                { $set: { strokes: [] } }
            );
        } catch (err) {
            console.error('Error clearing board:', err.message);
        }
    });

    // Undo
    socket.on('undo', async (data) => {
        const { roomId, strokeId } = data;
        socket.to(roomId).emit('undo', { strokeId });
    });

    // Redo
    socket.on('redo', async (data) => {
        const { roomId, stroke } = data;
        socket.to(roomId).emit('redo', { stroke });
    });

    // Save snapshot
    socket.on('save-snapshot', async (data) => {
        const { roomId, snapshot } = data;
        try {
            await WhiteboardSession.findOneAndUpdate(
                { roomId },
                { $set: { snapshot } },
                { upsert: true }
            );
        } catch (err) {
            console.error('Error saving snapshot:', err.message);
        }
    });

    // Load session
    socket.on('load-session', async (data) => {
        const { roomId } = data;
        try {
            const session = await WhiteboardSession.findOne({ roomId });
            socket.emit('session-loaded', session || { strokes: [] });
        } catch (err) {
            console.error('Error loading session:', err.message);
            socket.emit('session-loaded', { strokes: [] });
        }
    });

    // Recording events
    socket.on('record-event', async (data) => {
        const { roomId, event } = data;
        try {
            await WhiteboardSession.findOneAndUpdate(
                { roomId },
                { $push: { recordings: { eventType: event.type, data: event.data, timestamp: new Date() } } },
                { upsert: true }
            );
        } catch (err) {
            console.error('Error recording event:', err.message);
        }
    });
};
