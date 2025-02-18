const express = require('express');
const router = express.Router();
const productController = require('../Controllers/productController');
const userMiddleware = require('../Middlewares/userMiddleware');
const adminMiddleware = require('../Middlewares/adminMiddleware');
const { upload, resizeImage } = require('../Utilities/multerConfig');

router.route('/')
    .get(productController.getAllProducts)
    .post(userMiddleware,adminMiddleware, upload.single('image'), resizeImage , productController.createProduct);
    
router.get('/stock', productController.getProductsByStock);
router.patch('/addStock/:productId', userMiddleware,adminMiddleware, productController.addStock);

router.route('/:id')
    .get(productController.getProduct)
    .patch(userMiddleware,adminMiddleware, upload.single('image'), productController.updateProduct)
    .delete(userMiddleware,adminMiddleware, productController.deleteProduct);

module.exports = router;




