const mongoose = require('mongoose');

const strokeSchema = new mongoose.Schema({
    tool: { type: String, enum: ['pencil', 'eraser'], required: true },
    color: { type: String, default: '#000000' },
    size: { type: Number, default: 3 },
    points: [{ x: Number, y: Number }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
}, { _id: true });

const whiteboardSessionSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    strokes: [strokeSchema],
    snapshot: {
        type: String,
        default: null
    },
    recordings: [{
        eventType: String,
        data: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('WhiteboardSession', whiteboardSessionSchema);
