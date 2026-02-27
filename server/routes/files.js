const express = require('express');
const router = express.Router();
const { uploadMiddleware, uploadFile, getFiles } = require('../controllers/fileController');
const auth = require('../middleware/auth');

router.post('/upload/:roomId', auth, uploadMiddleware, uploadFile);
router.get('/:roomId', auth, getFiles);

module.exports = router;
