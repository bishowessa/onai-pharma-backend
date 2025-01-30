const multer = require('multer');
const path = require('path');

// Define storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Store files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        // Get the original filename without extension
        const nameWithoutExtension = path.basename(file.originalname, path.extname(file.originalname));

        // Get file extension (e.g., .jpg, .png)
        const ext = path.extname(file.originalname).toLowerCase();

        // Generate the new filename (original name + date + extension)
        const filename = nameWithoutExtension + '_' + Date.now() + ext;

        // Set the filename
        cb(null, filename);
    }
});

// Create multer instance with storage configuration
const upload = multer({ storage: storage });

module.exports = upload;
