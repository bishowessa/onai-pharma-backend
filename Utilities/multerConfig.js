const multer = require('multer');
const path = require('path');

// Define storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Store files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        const nameWithoutExtension = path.basename(file.originalname, path.extname(file.originalname));
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = nameWithoutExtension + '_' + Date.now() + ext;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// Optionally, export resize middleware
const sharp = require('sharp');
const resizeImage = (req, res, next) => {
    if (!req.file) return next();
    sharp(req.file.path)
        .resize(300, 300)
        .toFile(`./uploads/resized_${req.file.filename}`, (err) => {
            if (err) return next(err);
            next();
        });
};

module.exports = { upload, resizeImage };
