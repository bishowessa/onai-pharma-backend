const express = require('express');
const router = express.Router();
const productController = require('../Controllers/productController');
const userMiddleware = require('../Middlewares/userMiddleware');
const adminMiddleware = require('../Middlewares/adminMiddleware');
const upload = require('../Utilities/multerConfig');

router.route('/')
    .get(productController.getAllProducts)
    .post(userMiddleware,adminMiddleware, upload.single('image'), productController.createProduct);

router.route('/:id')
    .get(productController.getProduct)
    .patch(userMiddleware,adminMiddleware, upload.single('image'), productController.updateProduct)
    .delete(userMiddleware,adminMiddleware, productController.deleteProduct);

module.exports = router;




