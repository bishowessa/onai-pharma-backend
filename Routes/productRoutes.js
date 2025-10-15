const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary'); // 1. Import Cloudinary storage
const productController = require('../Controllers/productController');
const userMiddleware = require('../Middlewares/userMiddleware');
const adminMiddleware = require('../Middlewares/adminMiddleware');

// 2. Configure multer to use Cloudinary for storage
const upload = multer({ storage: storage });

router.route('/')
    .get(productController.getAllProducts)
    // 3. Removed 'resizeImage' as Cloudinary handles this
    .post(userMiddleware, adminMiddleware, upload.single('image'), productController.createProduct);
    
router.get('/stock', productController.getProductsByStock);
router.patch('/addStock/:productId', userMiddleware, adminMiddleware, productController.addStock);

router.route('/:id')
    .get(productController.getProduct)
    // 4. Use the same Cloudinary upload for updating
    .patch(userMiddleware, adminMiddleware, upload.single('image'), productController.updateProduct)
    .delete(userMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;