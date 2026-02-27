const Room = require('../models/Room');

const roleCheck = (role) => {
    return async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const room = await Room.findOne({ roomId });

            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }

            if (role === 'host' && room.host.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Only the host can perform this action' });
            }

            if (role === 'participant') {
                const isParticipant = room.participants.some(
                    p => p.toString() === req.user._id.toString()
                );
                const isHost = room.host.toString() === req.user._id.toString();

                if (!isParticipant && !isHost) {
                    return res.status(403).json({ message: 'You are not a member of this room' });
                }
            }

            req.room = room;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = roleCheck;
