const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const roomDir = path.join(uploadsDir, req.params.roomId || 'general');
        if (!fs.existsSync(roomDir)) {
            fs.mkdirSync(roomDir, { recursive: true });
        }
        cb(null, roomDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        cb(null, true);
    }
});

exports.uploadMiddleware = upload.single('file');

// POST /api/files/upload/:roomId
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: `/uploads/${req.params.roomId}/${req.file.filename}`,
            uploadedBy: req.user.username,
            uploadedAt: new Date()
        };

        res.json(fileData);
    } catch (error) {
        res.status(500).json({ message: 'File upload failed' });
    }
};

// GET /api/files/:roomId
exports.getFiles = async (req, res) => {
    try {
        const roomDir = path.join(uploadsDir, req.params.roomId);

        if (!fs.existsSync(roomDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(roomDir).map(filename => {
            const stats = fs.statSync(path.join(roomDir, filename));
            return {
                filename,
                originalName: filename.substring(filename.indexOf('-') + 1),
                size: stats.size,
                url: `/uploads/${req.params.roomId}/${filename}`,
                uploadedAt: stats.mtime
            };
        });

        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get files' });
    }
};
