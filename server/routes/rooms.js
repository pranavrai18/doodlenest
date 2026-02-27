const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRooms, getRoomById, deleteRoom } = require('../controllers/roomController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, createRoom);
router.post('/join', auth, joinRoom);
router.get('/', auth, getRooms);
router.get('/:roomId', auth, getRoomById);
router.delete('/:roomId', auth, deleteRoom);

module.exports = router;
