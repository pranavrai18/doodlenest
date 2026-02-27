const Room = require('../models/Room');
const WhiteboardSession = require('../models/WhiteboardSession');
const { v4: uuidv4 } = require('uuid');

// POST /api/rooms
exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Room name is required' });
        }

        const roomId = uuidv4().slice(0, 8).toUpperCase();

        const room = await Room.create({
            roomId,
            name,
            host: req.user._id,
            participants: [req.user._id]
        });

        // Create a whiteboard session for this room
        await WhiteboardSession.create({ roomId, strokes: [] });

        const populatedRoom = await Room.findById(room._id)
            .populate('host', 'username email')
            .populate('participants', 'username email');

        res.status(201).json(populatedRoom);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/rooms/join
exports.joinRoom = async (req, res) => {
    try {
        const { roomId } = req.body;

        if (!roomId) {
            return res.status(400).json({ message: 'Room ID is required' });
        }

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const alreadyJoined = room.participants.some(
            p => p.toString() === req.user._id.toString()
        );

        if (!alreadyJoined) {
            room.participants.push(req.user._id);
            await room.save();
        }

        const populatedRoom = await Room.findById(room._id)
            .populate('host', 'username email')
            .populate('participants', 'username email');

        res.json(populatedRoom);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/rooms
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            $or: [
                { host: req.user._id },
                { participants: req.user._id }
            ]
        })
            .populate('host', 'username email')
            .populate('participants', 'username email')
            .sort({ createdAt: -1 });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/rooms/:roomId
exports.getRoomById = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId })
            .populate('host', 'username email')
            .populate('participants', 'username email');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/rooms/:roomId
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the host can delete this room' });
        }

        await Room.findByIdAndDelete(room._id);
        await WhiteboardSession.findOneAndDelete({ roomId: req.params.roomId });

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
