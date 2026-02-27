const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, googleLogin } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

module.exports = router;
